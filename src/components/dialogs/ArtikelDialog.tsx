import { useState, useEffect, useRef } from 'react';
import type { Artikel, Verkaeufer } from '@/types/app';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface ArtikelDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Artikel['fields']) => Promise<void>;
  defaultValues?: Artikel['fields'];
  verkaeuferList: Verkaeufer[];
  enablePhotoScan?: boolean;
}

export function ArtikelDialog({ open, onClose, onSubmit, defaultValues, verkaeuferList, enablePhotoScan = false }: ArtikelDialogProps) {
  const [fields, setFields] = useState<Partial<Artikel['fields']>>({});
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
      await onSubmit(fields as Artikel['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "artikelnummer": string | null, // Artikelnummer\n  "verkaeufer": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "artikelname": string | null, // Artikelbezeichnung\n  "beschreibung": string | null, // Beschreibung\n  "kategorie": "moebel" | "kleidung" | "buecher" | "elektronik" | "spielzeug" | "haushaltswaren" | "dekoration" | "schmuck" | null, // Kategorie\n  "zustand": "neu" | "wie_neu" | "sehr_gut" | "gut" | "akzeptabel" | "defekt" | null, // Zustand\n  "preis": number | null, // Preis (EUR)\n  "verfuegbar": boolean | null, // Verfügbar\n  "foto": string | null, // Foto des Artikels\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["verkaeufer"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const verkaeuferName = raw['verkaeufer'] as string | null;
        if (verkaeuferName && !merged['verkaeufer']) {
          const verkaeuferMatch = verkaeuferList.find(r => matchName(verkaeuferName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (verkaeuferMatch) merged['verkaeufer'] = createRecordUrl(APP_IDS.VERKAEUFER, verkaeuferMatch.record_id);
        }
        return merged as Partial<Artikel['fields']>;
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
            <DialogTitle>{defaultValues ? 'Artikel bearbeiten' : 'Artikel hinzufügen'}</DialogTitle>
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
            <Label htmlFor="artikelnummer">Artikelnummer</Label>
            <Input
              id="artikelnummer"
              value={fields.artikelnummer ?? ''}
              onChange={e => setFields(f => ({ ...f, artikelnummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verkaeufer">Verkäufer</Label>
            <Select
              value={extractRecordId(fields.verkaeufer) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, verkaeufer: v === 'none' ? undefined : createRecordUrl(APP_IDS.VERKAEUFER, v) }))}
            >
              <SelectTrigger id="verkaeufer"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {verkaeuferList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.verkaeufernummer ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="artikelname">Artikelbezeichnung</Label>
            <Input
              id="artikelname"
              value={fields.artikelname ?? ''}
              onChange={e => setFields(f => ({ ...f, artikelname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea
              id="beschreibung"
              value={fields.beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kategorie">Kategorie</Label>
            <Select
              value={fields.kategorie ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, kategorie: v === 'none' ? undefined : v as 'moebel' | 'kleidung' | 'buecher' | 'elektronik' | 'spielzeug' | 'haushaltswaren' | 'dekoration' | 'schmuck' | 'sport_freizeit' | 'sonstiges' }))}
            >
              <SelectTrigger id="kategorie"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="moebel">Möbel</SelectItem>
                <SelectItem value="kleidung">Kleidung</SelectItem>
                <SelectItem value="buecher">Bücher</SelectItem>
                <SelectItem value="elektronik">Elektronik</SelectItem>
                <SelectItem value="spielzeug">Spielzeug</SelectItem>
                <SelectItem value="haushaltswaren">Haushaltswaren</SelectItem>
                <SelectItem value="dekoration">Dekoration</SelectItem>
                <SelectItem value="schmuck">Schmuck</SelectItem>
                <SelectItem value="sport_freizeit">Sport & Freizeit</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zustand">Zustand</Label>
            <Select
              value={fields.zustand ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zustand: v === 'none' ? undefined : v as 'neu' | 'wie_neu' | 'sehr_gut' | 'gut' | 'akzeptabel' | 'defekt' }))}
            >
              <SelectTrigger id="zustand"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="neu">Neu</SelectItem>
                <SelectItem value="wie_neu">Wie neu</SelectItem>
                <SelectItem value="sehr_gut">Sehr gut</SelectItem>
                <SelectItem value="gut">Gut</SelectItem>
                <SelectItem value="akzeptabel">Akzeptabel</SelectItem>
                <SelectItem value="defekt">Defekt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preis">Preis (EUR)</Label>
            <Input
              id="preis"
              type="number"
              value={fields.preis ?? ''}
              onChange={e => setFields(f => ({ ...f, preis: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verfuegbar">Verfügbar</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="verfuegbar"
                checked={!!fields.verfuegbar}
                onCheckedChange={(v) => setFields(f => ({ ...f, verfuegbar: !!v }))}
              />
              <Label htmlFor="verfuegbar" className="font-normal">Verfügbar</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="foto">Foto des Artikels</Label>
            <Input
              id="foto"
              value={fields.foto ?? ''}
              onChange={e => setFields(f => ({ ...f, foto: e.target.value }))}
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