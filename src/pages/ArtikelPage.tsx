import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Artikel, Verkaeufer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { ArtikelDialog } from '@/components/dialogs/ArtikelDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

export default function ArtikelPage() {
  const [records, setRecords] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Artikel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Artikel | null>(null);
  const [verkaeuferList, setVerkaeuferList] = useState<Verkaeufer[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, verkaeuferData] = await Promise.all([
        LivingAppsService.getArtikel(),
        LivingAppsService.getVerkaeufer(),
      ]);
      setRecords(mainData);
      setVerkaeuferList(verkaeuferData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Artikel['fields']) {
    await LivingAppsService.createArtikelEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Artikel['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateArtikelEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteArtikelEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getVerkaeuferDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return verkaeuferList.find(r => r.record_id === id)?.fields.verkaeufernummer ?? '—';
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
      title="Artikel"
      subtitle={`${records.length} Artikel im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Artikel suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikelnummer</TableHead>
              <TableHead>Verkäufer</TableHead>
              <TableHead>Artikelbezeichnung</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Zustand</TableHead>
              <TableHead>Preis (EUR)</TableHead>
              <TableHead>Verfügbar</TableHead>
              <TableHead>Foto des Artikels</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.artikelnummer ?? '—'}</TableCell>
                <TableCell>{getVerkaeuferDisplayName(record.fields.verkaeufer)}</TableCell>
                <TableCell>{record.fields.artikelname ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.beschreibung ?? '—'}</span></TableCell>
                <TableCell><Badge variant="secondary">{record.fields.kategorie ?? '—'}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{record.fields.zustand ?? '—'}</Badge></TableCell>
                <TableCell>{record.fields.preis ?? '—'}</TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.verfuegbar ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.verfuegbar ? 'Ja' : 'Nein'}</span></TableCell>
                <TableCell>{record.fields.foto ?? '—'}</TableCell>
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
                <TableCell colSpan={10} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Artikel. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ArtikelDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        verkaeuferList={verkaeuferList}
        enablePhotoScan={AI_PHOTO_SCAN['Artikel']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Artikel löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}