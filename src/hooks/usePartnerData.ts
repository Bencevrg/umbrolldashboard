import { useState, useCallback, useEffect } from 'react';
import { Partner, TopPartner, SleepingPartner, DashboardData, PartnerProductStat } from '@/types/partner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Csak mezőnevek normalizálása - SEMMI számítás!
const normalizePartner = (p: Record<string, unknown>): Partner => ({
  partner: String(p.partner || p['Partner'] || ''),
  osszes_arajanlat: Number(p.osszes_arajanlat ?? p['összes_árajánlat'] ?? 0),
  sikeres_arajanlatok: Number(p.sikeres_arajanlatok ?? p['sikeres_árajánlatok'] ?? 0),
  sikertelen_arajanlatok: Number(p.sikertelen_arajanlatok ?? p['sikertelen_árajánlatok'] ?? 0),
  sikeressegi_arany: Number(p.sikeressegi_arany ?? p['sikerességi_arány'] ?? 0),
  legutobbi_sikeres_datum: (p.legutobbi_sikeres_datum ?? p['legutóbbi_sikeres_dátum'] ?? null) as string | null,
  legutobbi_arajanlat_datum: (p.legutobbi_arajanlat_datum ?? p['legutóbbi_árajánlat_dátum'] ?? null) as string | null,
  napok_a_legutobbi_arajanlat_ota: Number(p.napok_a_legutobbi_arajanlat_ota ?? p['napok_a_legutóbbi_árajánlat_óta'] ?? 0),
  alvo: p.alvo === true || p['alvó'] === true,
  letrehozva: String(p.letrehozva ?? p['létrehozva'] ?? ''),
  korrigalt_sikeressegi_arany: Number(p.korrigalt_sikeressegi_arany ?? p['korrigált_sikerességi_arány'] ?? 0),
  ertek_pontszam: Number(p.ertek_pontszam ?? p['érték_pontszám'] ?? 0),
  kategoria: String(p.kategoria ?? p['kategória'] ?? 'KÖZEPES'),
  sikertelen_pontszam: Number(p.sikertelen_pontszam ?? p['sikertelen_pontszám'] ?? 0),
});

// TopPartner normalizálása - helyezés mezővel
const normalizeTopPartner = (p: Record<string, unknown>): TopPartner => ({
  ...normalizePartner(p),
  rank: Number(p.helyezés ?? p.rank ?? p.row_number ?? 0),
});

// PartnerProductStat normalizálása
const normalizePartnerProductStat = (p: Record<string, unknown>): PartnerProductStat => ({
  partner2: String(p.partner2 ?? p['partner2'] ?? ''),
  termekkategoria: String(p.termekkategoria ?? p['termékkategória'] ?? p['termekkategória'] ?? ''),
  db: Number(p.db ?? 0),
});

// Module-level cache: survives component unmount/remount during navigation
let lastFetchedForUser: string | null = null;
let cachedHasFetched = false;
let cachedData: DashboardData = {
  partners: [],
  topBest: [],
  topWorst: [],
  sleeping: [],
  partnerProductStats: [],
};

export const usePartnerData = (userId?: string) => {
  const [data, setData] = useState<DashboardData>(cachedData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(cachedHasFetched);
  const { toast } = useToast();

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('get-partners');

      if (error) {
        throw new Error(`Edge function hiba: ${error.message}`);
      }
      
      // Nyers adatok - NINCS semmilyen számítás vagy szűrés!
      let partners: Partner[] = [];
      let topBest: TopPartner[] = [];
      let topWorst: TopPartner[] = [];
      let sleeping: SleepingPartner[] = [];
      let partnerProductStats: PartnerProductStat[] = [];

      // A webhook válasz egy tömb, az első elem tartalmazza az összes adatot
      const mainData = Array.isArray(responseData) ? responseData[0] : responseData;
      
      if (mainData) {
        const partnersRaw = mainData.partners || [];
        const topBestRaw = mainData.top_best_customers || [];
        const topWorstRaw = mainData.top_worst_customers || [];
        const sleepingRaw = mainData.sleeping_customers || [];
        const partnerProductStatsRaw = mainData.partner_product_stats || [];

        partners = (Array.isArray(partnersRaw) ? partnersRaw : []).map((p: Record<string, unknown>) => normalizePartner(p));
        topBest = (Array.isArray(topBestRaw) ? topBestRaw : []).map((p: Record<string, unknown>) => normalizeTopPartner(p));
        topWorst = (Array.isArray(topWorstRaw) ? topWorstRaw : []).map((p: Record<string, unknown>) => normalizeTopPartner(p));
        sleeping = (Array.isArray(sleepingRaw) ? sleepingRaw : []).map((p: Record<string, unknown>) => normalizeTopPartner(p));
        partnerProductStats = (Array.isArray(partnerProductStatsRaw) ? partnerProductStatsRaw : []).map((p: Record<string, unknown>) => normalizePartnerProductStat(p));
      }

      const newData = { partners, topBest, topWorst, sleeping, partnerProductStats };
      cachedData = newData;
      setData(newData);
      
      toast({
        title: 'Sikeres frissítés',
        description: `${partners.length} partner adat betöltve.`,
      });
    } catch (error) {
      console.error('Webhook hiba:', error);
      toast({
        title: 'Hiba történt',
        description: 'Nem sikerült lekérni az adatokat a webhookból.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      cachedHasFetched = true;
      setHasFetched(true);
    }
  }, [toast]);

  // Auto-fetch once per user session (resets on logout/login)
  useEffect(() => {
    if (userId && lastFetchedForUser !== userId) {
      lastFetchedForUser = userId;
      fetchPartners();
    }
    if (!userId) {
      lastFetchedForUser = null;
      cachedHasFetched = false;
      cachedData = { partners: [], topBest: [], topWorst: [], sleeping: [], partnerProductStats: [] };
    }
  }, [userId, fetchPartners]);

  return {
    partners: data.partners,
    topBest: data.topBest,
    topWorst: data.topWorst,
    sleeping: data.sleeping,
    partnerProductStats: data.partnerProductStats,
    isLoading,
    hasFetched,
    fetchPartners,
  };
};
