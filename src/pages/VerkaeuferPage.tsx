import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Verkaeufer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { VerkaeuferDialog } from '@/components/dialogs/VerkaeuferDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function VerkaeuferPage() {
  const [records, setRecords] = useState<Verkaeufer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Verkaeufer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Verkaeufer | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getVerkaeufer());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Verkaeufer['fields']) {
    await LivingAppsService.createVerkaeuferEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Verkaeufer['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateVerkaeuferEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteVerkaeuferEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v =>
      String(v ?? '').toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Verkäufer"
      subtitle={`${records.length} Verkäufer im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Verkäufer suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Verkäufernummer</TableHead>
              <TableHead>Vorname</TableHead>
              <TableHead>Nachname</TableHead>
              <TableHead>Telefonnummer</TableHead>
              <TableHead>E-Mail-Adresse</TableHead>
              <TableHead>Registrierungsdatum</TableHead>
              <TableHead>Notizen</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.verkaeufernummer ?? '—'}</TableCell>
                <TableCell>{record.fields.vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.nachname ?? '—'}</TableCell>
                <TableCell>{record.fields.telefon ?? '—'}</TableCell>
                <TableCell>{record.fields.email ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.registrierungsdatum)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.notizen ?? '—'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Verkäufer. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VerkaeuferDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Verkaeufer']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Verkäufer löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}