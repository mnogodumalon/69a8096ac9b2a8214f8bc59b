import type { Verkaeufe, Artikel, Kaeufer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface VerkaeufeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Verkaeufe | null;
  onEdit: (record: Verkaeufe) => void;
  artikelList: Artikel[];
  kaeuferList: Kaeufer[];
}

export function VerkaeufeViewDialog({ open, onClose, record, onEdit, artikelList, kaeuferList }: VerkaeufeViewDialogProps) {
  function getArtikelDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return artikelList.find(r => r.record_id === id)?.fields.artikelnummer ?? '—';
  }

  function getKaeuferDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kaeuferList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verkäufe anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verkaufter Artikel</Label>
            <p className="text-sm">{getArtikelDisplayName(record.fields.artikel)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verkaufspreis (EUR)</Label>
            <p className="text-sm">{record.fields.verkaufspreis ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verkaufsdatum und -uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.verkaufsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Käufer</Label>
            <p className="text-sm">{getKaeuferDisplayName(record.fields.kaeufer)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zahlungsmethode</Label>
            <Badge variant="secondary">{record.fields.zahlungsmethode?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.notizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}