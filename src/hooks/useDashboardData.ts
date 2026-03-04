import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Verkaeufer, Artikel, Kaeufer, Verkaeufe } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [verkaeufer, setVerkaeufer] = useState<Verkaeufer[]>([]);
  const [artikel, setArtikel] = useState<Artikel[]>([]);
  const [kaeufer, setKaeufer] = useState<Kaeufer[]>([]);
  const [verkaeufe, setVerkaeufe] = useState<Verkaeufe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [verkaeuferData, artikelData, kaeuferData, verkaeufeData] = await Promise.all([
        LivingAppsService.getVerkaeufer(),
        LivingAppsService.getArtikel(),
        LivingAppsService.getKaeufer(),
        LivingAppsService.getVerkaeufe(),
      ]);
      setVerkaeufer(verkaeuferData);
      setArtikel(artikelData);
      setKaeufer(kaeuferData);
      setVerkaeufe(verkaeufeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const verkaeuferMap = useMemo(() => {
    const m = new Map<string, Verkaeufer>();
    verkaeufer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [verkaeufer]);

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

  return { verkaeufer, setVerkaeufer, artikel, setArtikel, kaeufer, setKaeufer, verkaeufe, setVerkaeufe, loading, error, fetchAll, verkaeuferMap, artikelMap, kaeuferMap };
}