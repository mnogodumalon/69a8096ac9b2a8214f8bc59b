import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Verkaeufe, Artikel, Kaeufer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { VerkaeufeDialog } from '@/components/dialogs/VerkaeufeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function VerkaeufePage() {
  const [records, setRecords] = useState<Verkaeufe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Verkaeufe | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Verkaeufe | null>(null);
  const [artikelList, setArtikelList] = useState<Artikel[]>([]);
  const [kaeuferList, setKaeuferList] = useState<Kaeufer[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, artikelData, kaeuferData] = await Promise.all([
        LivingAppsService.getVerkaeufe(),
        LivingAppsService.getArtikel(),
        LivingAppsService.getKaeufer(),
      ]);
      setRecords(mainData);
      setArtikelList(artikelData);
      setKaeuferList(kaeuferData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Verkaeufe['fields']) {
    await LivingAppsService.createVerkaeufeEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Verkaeufe['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateVerkaeufeEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteVerkaeufeEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getArtikelDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return artikelList.find(r => r.record_id === id)?.fields.artikelnummer ?? '—';
  }

  function getKaeuferDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return kaeuferList.find(r => r.record_id === id)?.fields.vorname ?? '—';
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
      title="Verkäufe"
      subtitle={`${records.length} Verkäufe im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Verkäufe suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Verkaufter Artikel</TableHead>
              <TableHead>Verkaufspreis (EUR)</TableHead>
              <TableHead>Verkaufsdatum und -uhrzeit</TableHead>
              <TableHead>Käufer</TableHead>
              <TableHead>Zahlungsmethode</TableHead>
              <TableHead>Notizen</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell>{getArtikelDisplayName(record.fields.artikel)}</TableCell>
                <TableCell>{record.fields.verkaufspreis ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.verkaufsdatum)}</TableCell>
                <TableCell>{getKaeuferDisplayName(record.fields.kaeufer)}</TableCell>
                <TableCell><Badge variant="secondary">{record.fields.zahlungsmethode ?? '—'}</Badge></TableCell>
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
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Verkäufe. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VerkaeufeDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        artikelList={artikelList}
        kaeuferList={kaeuferList}
        enablePhotoScan={AI_PHOTO_SCAN['Verkaeufe']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Verkäufe löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}