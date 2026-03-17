import type { EnrichedArtikel, EnrichedVerkaeufe } from '@/types/enriched';
import type { Artikel, Kaeufer, Verkaeufe, Verkaeufer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface ArtikelMaps {
  verkaeuferMap: Map<string, Verkaeufer>;
}

export function enrichArtikel(
  artikel: Artikel[],
  maps: ArtikelMaps
): EnrichedArtikel[] {
  return artikel.map(r => ({
    ...r,
    verkaeuferName: resolveDisplay(r.fields.verkaeufer, maps.verkaeuferMap, 'vorname', 'nachname'),
  }));
}

interface VerkaeufeMaps {
  artikelMap: Map<string, Artikel>;
  kaeuferMap: Map<string, Kaeufer>;
}

export function enrichVerkaeufe(
  verkaeufe: Verkaeufe[],
  maps: VerkaeufeMaps
): EnrichedVerkaeufe[] {
  return verkaeufe.map(r => ({
    ...r,
    artikelName: resolveDisplay(r.fields.artikel, maps.artikelMap, 'artikelnummer'),
    kaeuferName: resolveDisplay(r.fields.kaeufer, maps.kaeuferMap, 'vorname', 'nachname'),
  }));
}
