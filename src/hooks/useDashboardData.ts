import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Artikel, Kaeufer, Verkaeufer, Verkaeufe } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [kaeufer, setKaeufer] = useState<Kaeufer[]>([]);
  const [verkaeufer, setVerkaeufer] = useState<Verkaeufer[]>([]);
  const [verkaeufe, setVerkaeufe] = useState<Verkaeufe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [artikelData, kaeuferData, verkaeuferData, verkaeufeData] = await Promise.all([
        LivingAppsService.getArtikel(),
        LivingAppsService.getKaeufer(),
        LivingAppsService.getVerkaeufer(),
        LivingAppsService.getVerkaeufe(),
      ]);
      setArtikel(artikelData);
      setKaeufer(kaeuferData);
      setVerkaeufer(verkaeuferData);
      setVerkaeufe(verkaeufeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const artikelMap = useMemo(() => {
    const m = new Map<string, Artikel>();
    artikel.forEach(r => m.set(r.record_id, r));
    return m;
  }, [artikel]);

  const kaeuferMap = useMemo(() => {
    const m = new Map<string, Kaeufer>();
    kaeufer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kaeufer]);

  const verkaeuferMap = useMemo(() => {
    const m = new Map<string, Verkaeufer>();
    verkaeufer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [verkaeufer]);

  return { artikel, setArtikel, kaeufer, setKaeufer, verkaeufer, setVerkaeufer, verkaeufe, setVerkaeufe, loading, error, fetchAll, artikelMap, kaeuferMap, verkaeuferMap };
}