import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichArtikel, enrichVerkaeufe } from '@/lib/enrich';
import type { EnrichedArtikel, EnrichedVerkaeufe } from '@/types/enriched';
import type { Artikel, Verkaeufe } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, ShoppingCart, Package, Users, TrendingUp, Tag, CheckCircle2, XCircle, Edit2, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ArtikelDialog } from '@/components/dialogs/ArtikelDialog';
import { VerkaeufeDialog } from '@/components/dialogs/VerkaeufeDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const KATEGORIE_LABELS: Record<string, string> = {
  moebel: 'Möbel',
  kleidung: 'Kleidung',
  buecher: 'Bücher',
  elektronik: 'Elektronik',
  spielzeug: 'Spielzeug',
  haushaltswaren: 'Haushaltswaren',
  dekoration: 'Dekoration',
  schmuck: 'Schmuck',
  sport_freizeit: 'Sport & Freizeit',
  sonstiges: 'Sonstiges',
};

const ZUSTAND_LABELS: Record<string, string> = {
  neu: 'Neu',
  wie_neu: 'Wie neu',
  sehr_gut: 'Sehr gut',
  gut: 'Gut',
  akzeptabel: 'Akzeptabel',
  defekt: 'Defekt',
};

const ZUSTAND_COLORS: Record<string, string> = {
  neu: 'bg-emerald-100 text-emerald-700',
  wie_neu: 'bg-green-100 text-green-700',
  sehr_gut: 'bg-lime-100 text-lime-700',
  gut: 'bg-yellow-100 text-yellow-700',
  akzeptabel: 'bg-orange-100 text-orange-700',
  defekt: 'bg-red-100 text-red-700',
};

const KATEGORIE_COLORS: Record<string, string> = {
  moebel: '#6366f1',
  kleidung: '#8b5cf6',
  buecher: '#ec4899',
  elektronik: '#14b8a6',
  spielzeug: '#f59e0b',
  haushaltswaren: '#10b981',
  dekoration: '#f43f5e',
  schmuck: '#a855f7',
  sport_freizeit: '#3b82f6',
  sonstiges: '#94a3b8',
};

export default function DashboardOverview() {
  const {
    verkaeufer, artikel, kaeufer, verkaeufe,
    verkaeuferMap, artikelMap, kaeuferMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedArtikel = enrichArtikel(artikel, { verkaeuferMap });
  const enrichedVerkaeufe = enrichVerkaeufe(verkaeufe, { artikelMap, kaeuferMap });

  const [filterKategorie, setFilterKategorie] = useState<string>('alle');
  const [filterVerfuegbar, setFilterVerfuegbar] = useState<'alle' | 'verfuegbar' | 'verkauft'>('alle');

  const [artikelDialogOpen, setArtikelDialogOpen] = useState(false);
  const [editArtikel, setEditArtikel] = useState<EnrichedArtikel | null>(null);
  const [deleteArtikelTarget, setDeleteArtikelTarget] = useState<EnrichedArtikel | null>(null);

  const [verkaufDialogOpen, setVerkaufDialogOpen] = useState(false);
  const [selectedArtikelForVerkauf, setSelectedArtikelForVerkauf] = useState<EnrichedArtikel | null>(null);
  const [editVerkauf, setEditVerkauf] = useState<EnrichedVerkaeufe | null>(null);
  const [deleteVerkaufTarget, setDeleteVerkaufTarget] = useState<EnrichedVerkaeufe | null>(null);

  const soldArtikelIds = useMemo(() => {
    const ids = new Set<string>();
    verkaeufe.forEach(v => {
      const id = extractRecordId(v.fields.artikel);
      if (id) ids.add(id);
    });
    return ids;
  }, [verkaeufe]);

  const filteredArtikel = useMemo(() => {
    return enrichedArtikel.filter(a => {
      if (filterKategorie !== 'alle' && a.fields.kategorie !== filterKategorie) return false;
      if (filterVerfuegbar === 'verfuegbar' && !a.fields.verfuegbar) return false;
      if (filterVerfuegbar === 'verkauft' && a.fields.verfuegbar !== false && !soldArtikelIds.has(a.record_id)) return false;
      return true;
    });
  }, [enrichedArtikel, filterKategorie, filterVerfuegbar, soldArtikelIds]);

  const totalUmsatz = verkaeufe.reduce((s, v) => s + (v.fields.verkaufspreis ?? 0), 0);
  const verfuegbarCount = artikel.filter(a => a.fields.verfuegbar).length;
  const kategorienData = useMemo(() => {
    const counts: Record<string, number> = {};
    artikel.forEach(a => {
      const k = a.fields.kategorie ?? 'sonstiges';
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({ key, name: KATEGORIE_LABELS[key] ?? key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [artikel]);

  const recentVerkaeufe = useMemo(() =>
    [...enrichedVerkaeufe]
      .sort((a, b) => (b.fields.verkaufsdatum ?? '').localeCompare(a.fields.verkaufsdatum ?? ''))
      .slice(0, 5),
    [enrichedVerkaeufe]
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const defaultVerkaeufeFields = selectedArtikelForVerkauf
    ? { artikel: `https://ci04.ci.xist4c.de/rest/apps/69a8093d0a4bccc713ac989f/records/${selectedArtikelForVerkauf.record_id}` }
    : undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marktplatz</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Artikel verwalten & Verkäufe erfassen</p>
        </div>
        <Button onClick={() => { setEditArtikel(null); setArtikelDialogOpen(true); }} className="gap-2">
          <Plus size={16} />
          Artikel hinzufügen
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Artikel"
          value={String(artikel.length)}
          description={`${verfuegbarCount} verfügbar`}
          icon={<Package size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Verkäufe"
          value={String(verkaeufe.length)}
          description="Abgeschlossen"
          icon={<ShoppingCart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Umsatz"
          value={formatCurrency(totalUmsatz)}
          description="Gesamt"
          icon={<TrendingUp size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Teilnehmer"
          value={String(verkaeufer.length + kaeufer.length)}
          description={`${verkaeufer.length} Verk. / ${kaeufer.length} Käufer`}
          icon={<Users size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main Content: Artikel Board + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Artikel Board (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {['alle', 'verfuegbar', 'verkauft'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterVerfuegbar(f as 'alle' | 'verfuegbar' | 'verkauft')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterVerfuegbar === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {f === 'alle' ? 'Alle' : f === 'verfuegbar' ? 'Verfügbar' : 'Verkauft'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 ml-2">
              <button
                onClick={() => setFilterKategorie('alle')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterKategorie === 'alle'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Alle Kategorien
              </button>
              {kategorienData.map(k => (
                <button
                  key={k.key}
                  onClick={() => setFilterKategorie(k.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterKategorie === k.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {k.name}
                </button>
              ))}
            </div>
          </div>

          {/* Article Grid */}
          {filteredArtikel.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-2xl border-border">
              <Package size={32} className="text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">Keine Artikel gefunden</p>
              <p className="text-sm text-muted-foreground mt-1">Füge deinen ersten Artikel hinzu</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setEditArtikel(null); setArtikelDialogOpen(true); }}
              >
                <Plus size={14} className="mr-1" />
                Artikel hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredArtikel.map(a => {
                const isSold = soldArtikelIds.has(a.record_id);
                return (
                  <div
                    key={a.record_id}
                    className={`relative rounded-2xl border bg-card p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${
                      isSold ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{a.fields.artikelname ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.fields.artikelnummer ?? ''}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            <XCircle size={11} /> Verkauft
                          </span>
                        ) : a.fields.verfuegbar ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={11} /> Verfügbar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                            Reserviert
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-1.5">
                      {a.fields.kategorie && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                          <Tag size={10} />
                          {KATEGORIE_LABELS[a.fields.kategorie] ?? a.fields.kategorie}
                        </span>
                      )}
                      {a.fields.zustand && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ZUSTAND_COLORS[a.fields.zustand] ?? 'bg-muted text-muted-foreground'}`}>
                          {ZUSTAND_LABELS[a.fields.zustand] ?? a.fields.zustand}
                        </span>
                      )}
                      {a.verkaeuferName && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          {a.verkaeuferName}
                        </span>
                      )}
                    </div>

                    {/* Price + actions */}
                    <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/50">
                      <span className="text-lg font-bold text-foreground">
                        {a.fields.preis != null ? formatCurrency(a.fields.preis) : '—'}
                      </span>
                      <div className="flex items-center gap-1">
                        {!isSold && a.fields.verfuegbar && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs gap-1 px-2"
                            onClick={() => {
                              setSelectedArtikelForVerkauf(a);
                              setEditVerkauf(null);
                              setVerkaufDialogOpen(true);
                            }}
                          >
                            <ShoppingCart size={12} />
                            Verkaufen
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => { setEditArtikel(a); setArtikelDialogOpen(true); }}
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
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
        </div>

        {/* Right Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Category Chart */}
          {kategorienData.length > 0 && (
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-4">Artikel nach Kategorie</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kategorienData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: 'var(--accent)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {kategorienData.map(entry => (
                      <Cell key={entry.key} fill={KATEGORIE_COLORS[entry.key] ?? '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Verkäufe */}
          <div className="bg-card border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-foreground">Letzte Verkäufe</h3>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 px-2"
                onClick={() => {
                  setSelectedArtikelForVerkauf(null);
                  setEditVerkauf(null);
                  setVerkaufDialogOpen(true);
                }}
              >
                <Plus size={12} />
                Neu
              </Button>
            </div>
            {recentVerkaeufe.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Noch keine Verkäufe</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentVerkaeufe.map(v => (
                  <div key={v.record_id} className="flex items-start justify-between gap-2 py-2.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.artikelName || '—'}</p>
                      <p className="text-xs text-muted-foreground">{v.kaeuferName || '—'} · {formatDate(v.fields.verkaufsdatum)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-semibold text-foreground">
                        {v.fields.verkaufspreis != null ? formatCurrency(v.fields.verkaufspreis) : '—'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => { setEditVerkauf(v); setSelectedArtikelForVerkauf(null); setVerkaufDialogOpen(true); }}
                      >
                        <Edit2 size={11} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteVerkaufTarget(v)}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ArtikelDialog
        open={artikelDialogOpen}
        onClose={() => { setArtikelDialogOpen(false); setEditArtikel(null); }}
        onSubmit={async (fields) => {
          if (editArtikel) {
            await LivingAppsService.updateArtikelEntry(editArtikel.record_id, fields);
          } else {
            await LivingAppsService.createArtikelEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editArtikel?.fields}
        verkaeuferList={verkaeufer}
        enablePhotoScan={AI_PHOTO_SCAN['Artikel']}
      />

      <VerkaeufeDialog
        open={verkaufDialogOpen}
        onClose={() => { setVerkaufDialogOpen(false); setEditVerkauf(null); setSelectedArtikelForVerkauf(null); }}
        onSubmit={async (fields) => {
          if (editVerkauf) {
            await LivingAppsService.updateVerkaeufeEntry(editVerkauf.record_id, fields);
          } else {
            await LivingAppsService.createVerkaeufeEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editVerkauf?.fields ?? defaultVerkaeufeFields}
        artikelList={artikel}
        kaeuferList={kaeufer}
        enablePhotoScan={AI_PHOTO_SCAN['Verkaeufe']}
      />

      <ConfirmDialog
        open={!!deleteArtikelTarget}
        title="Artikel löschen"
        description={`"${deleteArtikelTarget?.fields.artikelname ?? 'Artikel'}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteArtikelTarget) {
            await LivingAppsService.deleteArtikelEntry(deleteArtikelTarget.record_id);
            fetchAll();
          }
          setDeleteArtikelTarget(null);
        }}
        onClose={() => setDeleteArtikelTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteVerkaufTarget}
        title="Verkauf löschen"
        description="Diesen Verkauf wirklich löschen?"
        onConfirm={async () => {
          if (deleteVerkaufTarget) {
            await LivingAppsService.deleteVerkaeufeEntry(deleteVerkaufTarget.record_id);
            fetchAll();
          }
          setDeleteVerkaufTarget(null);
        }}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
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
