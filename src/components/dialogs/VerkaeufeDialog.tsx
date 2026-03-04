import { useState, useEffect, useRef } from 'react';
import type { Verkaeufe, Artikel, Kaeufer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface VerkaeufeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Verkaeufe['fields']) => Promise<void>;
  defaultValues?: Verkaeufe['fields'];
  artikelList: Artikel[];
  kaeuferList: Kaeufer[];
  enablePhotoScan?: boolean;
}

export function VerkaeufeDialog({ open, onClose, onSubmit, defaultValues, artikelList, kaeuferList, enablePhotoScan = false }: VerkaeufeDialogProps) {
  const [fields, setFields] = useState<Partial<Verkaeufe['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Verkaeufe['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "artikel": string | null, // Name des Artikel-Eintrags (z.B. "Jonas Schmidt")\n  "verkaufspreis": number | null, // Verkaufspreis (EUR)\n  "verkaufsdatum": string | null, // YYYY-MM-DDTHH:MM // Verkaufsdatum und -uhrzeit\n  "kaeufer": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "zahlungsmethode": "bargeld" | "ec_karte" | "kreditkarte" | "paypal" | "ueberweisung" | "sonstiges" | null, // Zahlungsmethode\n  "notizen": string | null, // Notizen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["artikel", "kaeufer"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const artikelName = raw['artikel'] as string | null;
        if (artikelName && !merged['artikel']) {
          const artikelMatch = artikelList.find(r => matchName(artikelName!, [String(r.fields.artikelnummer ?? '')]));
          if (artikelMatch) merged['artikel'] = createRecordUrl(APP_IDS.ARTIKEL, artikelMatch.record_id);
        }
        const kaeuferName = raw['kaeufer'] as string | null;
        if (kaeuferName && !merged['kaeufer']) {
          const kaeuferMatch = kaeuferList.find(r => matchName(kaeuferName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (kaeuferMatch) merged['kaeufer'] = createRecordUrl(APP_IDS.KAEUFER, kaeuferMatch.record_id);
        }
        return merged as Partial<Verkaeufe['fields']>;
      });
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
    } finally {
      setScanning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{defaultValues ? 'Verkäufe bearbeiten' : 'Verkäufe hinzufügen'}</DialogTitle>
            {enablePhotoScan && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoScan(f);
                    e.target.value = '';
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={scanning} onClick={() => fileInputRef.current?.click()}>
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                  {scanning ? 'Wird erkannt...' : 'Foto scannen'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="artikel">Verkaufter Artikel</Label>
            <Select
              value={extractRecordId(fields.artikel) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, artikel: v === 'none' ? undefined : createRecordUrl(APP_IDS.ARTIKEL, v) }))}
            >
              <SelectTrigger id="artikel"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {artikelList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.artikelnummer ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="verkaufspreis">Verkaufspreis (EUR)</Label>
            <Input
              id="verkaufspreis"
              type="number"
              value={fields.verkaufspreis ?? ''}
              onChange={e => setFields(f => ({ ...f, verkaufspreis: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verkaufsdatum">Verkaufsdatum und -uhrzeit</Label>
            <Input
              id="verkaufsdatum"
              type="datetime-local"
              step="60"
              value={fields.verkaufsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, verkaufsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kaeufer">Käufer</Label>
            <Select
              value={extractRecordId(fields.kaeufer) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, kaeufer: v === 'none' ? undefined : createRecordUrl(APP_IDS.KAEUFER, v) }))}
            >
              <SelectTrigger id="kaeufer"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {kaeuferList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.vorname ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zahlungsmethode">Zahlungsmethode</Label>
            <Select
              value={fields.zahlungsmethode ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zahlungsmethode: v === 'none' ? undefined : v as 'bargeld' | 'ec_karte' | 'kreditkarte' | 'paypal' | 'ueberweisung' | 'sonstiges' }))}
            >
              <SelectTrigger id="zahlungsmethode"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="bargeld">Bargeld</SelectItem>
                <SelectItem value="ec_karte">EC-Karte</SelectItem>
                <SelectItem value="kreditkarte">Kreditkarte</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="ueberweisung">Überweisung</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notizen">Notizen</Label>
            <Textarea
              id="notizen"
              value={fields.notizen ?? ''}
              onChange={e => setFields(f => ({ ...f, notizen: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}