import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichArtikel, enrichVerkaeufe } from '@/lib/enrich';
import type { EnrichedArtikel, EnrichedVerkaeufe } from '@/types/enriched';
import type { Artikel, Kaeufer, Verkaeufer, Verkaeufe } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, formatCurrency, displayLookup, displayMultiLookup } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, Pencil, Trash2, ShoppingCart, Package, Users, TrendingUp, Search, Tag, CheckCircle, XCircle, Euro, Filter, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { ArtikelDialog } from '@/components/dialogs/ArtikelDialog';
import { VerkaeufeDialog } from '@/components/dialogs/VerkaeufeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

export default function DashboardOverview() {
  const {
    artikel, kaeufer, verkaeufer, verkaeufe,
    artikelMap, kaeuferMap, verkaeuferMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedArtikel = enrichArtikel(artikel, { verkaeuferMap });
  const enrichedVerkaeufe = enrichVerkaeufe(verkaeufe, { artikelMap, kaeuferMap });

  // State - all hooks BEFORE any early returns
  const [search, setSearch] = useState('');
  const [filterKategorie, setFilterKategorie] = useState('all');
  const [filterVerfuegbar, setFilterVerfuegbar] = useState('all');
  const [artikelDialogOpen, setArtikelDialogOpen] = useState(false);
  const [editArtikel, setEditArtikel] = useState<EnrichedArtikel | null>(null);
  const [deleteArtikelTarget, setDeleteArtikelTarget] = useState<EnrichedArtikel | null>(null);
  const [verkaufDialogOpen, setVerkaufDialogOpen] = useState(false);
  const [editVerkauf, setEditVerkauf] = useState<EnrichedVerkaeufe | null>(null);
  const [deleteVerkaufTarget, setDeleteVerkaufTarget] = useState<EnrichedVerkaeufe | null>(null);
  const [quickSaleArtikel, setQuickSaleArtikel] = useState<EnrichedArtikel | null>(null);
  const [activeTab, setActiveTab] = useState<'artikel' | 'verkaeufe'>('artikel');

  const filteredArtikel = useMemo(() => {
    return enrichedArtikel.filter(a => {
      const matchSearch =
        !search ||
        (a.fields.artikelname ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (a.fields.artikelnummer ?? '').toLowerCase().includes(search.toLowerCase()) ||
        a.verkaeuferName.toLowerCase().includes(search.toLowerCase());
      const matchKat = filterKategorie === 'all' || a.fields.kategorie?.key === filterKategorie;
      const matchVf =
        filterVerfuegbar === 'all' ||
        (filterVerfuegbar === 'verfuegbar' && a.fields.verfuegbar === true) ||
        (filterVerfuegbar === 'verkauft' && a.fields.verfuegbar !== true);
      return matchSearch && matchKat && matchVf;
    });
  }, [enrichedArtikel, search, filterKategorie, filterVerfuegbar]);

  const soldArtikelIds = useMemo(() => {
    const ids = new Set<string>();
    verkaeufe.forEach(v => {
      const id = extractRecordId(v.fields.artikel);
      if (id) ids.add(id);
    });
    return ids;
  }, [verkaeufe]);

  const stats = useMemo(() => {
    const total = artikel.length;
    const verfuegbar = artikel.filter(a => a.fields.verfuegbar === true).length;
    const verkauft = verkaeufe.length;
    const umsatz = verkaeufe.reduce((sum, v) => sum + (v.fields.verkaufspreis ?? 0), 0);
    return { total, verfuegbar, verkauft, umsatz };
  }, [artikel, verkaeufe]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleArtikelCreate = async (fields: Artikel['fields']) => {
    await LivingAppsService.createArtikelEntry(fields);
    fetchAll();
  };

  const handleArtikelUpdate = async (fields: Artikel['fields']) => {
    if (!editArtikel) return;
    await LivingAppsService.updateArtikelEntry(editArtikel.record_id, fields);
    setEditArtikel(null);
    fetchAll();
  };

  const handleArtikelDelete = async () => {
    if (!deleteArtikelTarget) return;
    await LivingAppsService.deleteArtikelEntry(deleteArtikelTarget.record_id);
    setDeleteArtikelTarget(null);
    fetchAll();
  };

  const handleVerkaufCreate = async (fields: Verkaeufe['fields']) => {
    await LivingAppsService.createVerkaeufeEntry(fields);
    setQuickSaleArtikel(null);
    fetchAll();
  };

  const handleVerkaufUpdate = async (fields: Verkaeufe['fields']) => {
    if (!editVerkauf) return;
    await LivingAppsService.updateVerkaeufeEntry(editVerkauf.record_id, fields);
    setEditVerkauf(null);
    fetchAll();
  };

  const handleVerkaufDelete = async () => {
    if (!deleteVerkaufTarget) return;
    await LivingAppsService.deleteVerkaeufeEntry(deleteVerkaufTarget.record_id);
    setDeleteVerkaufTarget(null);
    fetchAll();
  };

  const kategorieBadgeColor: Record<string, string> = {
    moebel: 'bg-amber-100 text-amber-800',
    kleidung: 'bg-pink-100 text-pink-800',
    buecher: 'bg-blue-100 text-blue-800',
    elektronik: 'bg-purple-100 text-purple-800',
    spielzeug: 'bg-green-100 text-green-800',
    haushaltswaren: 'bg-orange-100 text-orange-800',
    dekoration: 'bg-rose-100 text-rose-800',
    schmuck: 'bg-yellow-100 text-yellow-800',
    sport_freizeit: 'bg-teal-100 text-teal-800',
    sonstiges: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flohmarkt</h1>
          <p className="text-sm text-muted-foreground">Artikel verwalten und Verkäufe erfassen</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setVerkaufDialogOpen(true); setEditVerkauf(null); setQuickSaleArtikel(null); }}
          >
            <ReceiptText size={16} className="shrink-0 mr-1.5" />
            <span className="hidden sm:inline">Verkauf erfassen</span>
            <span className="sm:hidden">Verkauf</span>
          </Button>
          <Button
            size="sm"
            onClick={() => { setArtikelDialogOpen(true); setEditArtikel(null); }}
          >
            <Plus size={16} className="shrink-0 mr-1.5" />
            <span className="hidden sm:inline">Neuer Artikel</span>
            <span className="sm:hidden">Artikel</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Artikel gesamt"
          value={String(stats.total)}
          description="registriert"
          icon={<Package size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Verfügbar"
          value={String(stats.verfuegbar)}
          description="zum Verkauf"
          icon={<CheckCircle size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Verkäufe"
          value={String(stats.verkauft)}
          description="abgeschlossen"
          icon={<ShoppingCart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Umsatz"
          value={formatCurrency(stats.umsatz)}
          description="Gesamterlös"
          icon={<Euro size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('artikel')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'artikel'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Artikel ({filteredArtikel.length})
        </button>
        <button
          onClick={() => setActiveTab('verkaeufe')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'verkaeufe'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Verkäufe ({enrichedVerkaeufe.length})
        </button>
      </div>

      {activeTab === 'artikel' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <Input
                className="pl-9"
                placeholder="Artikel suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterKategorie} onValueChange={setFilterKategorie}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {LOOKUP_OPTIONS.artikel.kategorie.map(opt => (
                  <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterVerfuegbar} onValueChange={setFilterVerfuegbar}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="verfuegbar">Verfügbar</SelectItem>
                <SelectItem value="verkauft">Vergeben</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Artikel Grid */}
          {filteredArtikel.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Package size={48} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Keine Artikel gefunden</p>
              <Button size="sm" onClick={() => { setArtikelDialogOpen(true); setEditArtikel(null); }}>
                <Plus size={16} className="mr-1.5" /> Artikel hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredArtikel.map(a => {
                const isSold = soldArtikelIds.has(a.record_id);
                const available = a.fields.verfuegbar === true;
                return (
                  <div
                    key={a.record_id}
                    className={`group rounded-2xl border bg-card overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                      !available ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Foto or placeholder */}
                    <div className="relative h-32 bg-muted flex items-center justify-center overflow-hidden">
                      {a.fields.foto ? (
                        <img
                          src={a.fields.foto}
                          alt={a.fields.artikelname ?? 'Artikel'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={36} className="text-muted-foreground/40" />
                      )}
                      {/* Availability badge */}
                      <div className="absolute top-2 right-2">
                        {available ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={11} /> Verfügbar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle size={11} /> Vergeben
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-mono">{a.fields.artikelnummer ?? '—'}</p>
                        <p className="font-semibold text-sm truncate">{a.fields.artikelname ?? 'Unbenannt'}</p>
                        {a.verkaeuferName && (
                          <p className="text-xs text-muted-foreground truncate">Verkäufer: {a.verkaeuferName}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {a.fields.kategorie && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${kategorieBadgeColor[a.fields.kategorie.key] ?? 'bg-gray-100 text-gray-700'}`}>
                            {a.fields.kategorie.label}
                          </span>
                        )}
                        {a.fields.preis != null && (
                          <span className="text-sm font-bold text-primary ml-auto shrink-0">
                            {formatCurrency(a.fields.preis)}
                          </span>
                        )}
                      </div>

                      {a.fields.zustand && (
                        <p className="text-xs text-muted-foreground">Zustand: {a.fields.zustand.label}</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5 mt-auto pt-1 flex-wrap">
                        {available && (
                          <Button
                            size="sm"
                            className="flex-1 min-w-0 text-xs h-7"
                            onClick={() => {
                              setQuickSaleArtikel(a);
                              setEditVerkauf(null);
                              setVerkaufDialogOpen(true);
                            }}
                          >
                            <ShoppingCart size={13} className="shrink-0 mr-1" />
                            Verkaufen
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 shrink-0"
                          onClick={() => { setEditArtikel(a); setArtikelDialogOpen(true); }}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteArtikelTarget(a)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'verkaeufe' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => { setVerkaufDialogOpen(true); setEditVerkauf(null); setQuickSaleArtikel(null); }}
            >
              <Plus size={16} className="mr-1.5" /> Verkauf erfassen
            </Button>
          </div>

          {enrichedVerkaeufe.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ReceiptText size={48} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Noch keine Verkäufe erfasst</p>
              <Button size="sm" onClick={() => { setVerkaufDialogOpen(true); setEditVerkauf(null); setQuickSaleArtikel(null); }}>
                <Plus size={16} className="mr-1.5" /> Verkauf erfassen
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Artikel</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Käufer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Zahlungsmethode</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Datum</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Preis</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedVerkaeufe.map((v, i) => (
                    <tr key={v.record_id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[140px]">{v.artikelName || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground truncate max-w-[120px]">
                        {v.kaeuferName || '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {v.fields.zahlungsmethode ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {v.fields.zahlungsmethode.label}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {v.fields.verkaufsdatum ? formatDate(v.fields.verkaufsdatum) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {v.fields.verkaufspreis != null ? formatCurrency(v.fields.verkaufspreis) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={() => { setEditVerkauf(v); setVerkaufDialogOpen(true); setQuickSaleArtikel(null); }}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteVerkaufTarget(v)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Artikel Dialog */}
      <ArtikelDialog
        open={artikelDialogOpen}
        onClose={() => { setArtikelDialogOpen(false); setEditArtikel(null); }}
        onSubmit={editArtikel ? handleArtikelUpdate : handleArtikelCreate}
        defaultValues={editArtikel?.fields}
        verkaeuferList={verkaeufer}
        enablePhotoScan={AI_PHOTO_SCAN['Artikel']}
      />

      {/* Verkauf Dialog */}
      <VerkaeufeDialog
        open={verkaufDialogOpen}
        onClose={() => { setVerkaufDialogOpen(false); setEditVerkauf(null); setQuickSaleArtikel(null); }}
        onSubmit={editVerkauf ? handleVerkaufUpdate : handleVerkaufCreate}
        defaultValues={
          editVerkauf
            ? editVerkauf.fields
            : quickSaleArtikel
            ? { artikel: createRecordUrl(APP_IDS.ARTIKEL, quickSaleArtikel.record_id) }
            : undefined
        }
        artikelList={artikel}
        kaeuferList={kaeufer}
        enablePhotoScan={AI_PHOTO_SCAN['Verkaeufe']}
      />

      {/* Confirm Delete Artikel */}
      <ConfirmDialog
        open={!!deleteArtikelTarget}
        title="Artikel löschen"
        description={`Möchten Sie den Artikel "${deleteArtikelTarget?.fields.artikelname ?? ''}" wirklich löschen?`}
        onConfirm={handleArtikelDelete}
        onClose={() => setDeleteArtikelTarget(null)}
      />

      {/* Confirm Delete Verkauf */}
      <ConfirmDialog
        open={!!deleteVerkaufTarget}
        title="Verkauf löschen"
        description="Möchten Sie diesen Verkauf wirklich löschen?"
        onConfirm={handleVerkaufDelete}
        onClose={() => setDeleteVerkaufTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
