import { useState, useCallback } from 'react';
import { Partner, TopPartner, SleepingPartner, DashboardData } from '@/types/partner';
import { mockPartners } from '@/data/mockPartners';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://n8nlocal.benceaiproject.uk/webhook-test/42275bdc-cab0-46a4-83be-989d0f937d52';

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

export const usePartnerData = () => {
  const [data, setData] = useState<DashboardData>({
    partners: mockPartners,
    topBest: [],
    topWorst: [],
    sleeping: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getPartners' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP hiba: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Nyers adatok - NINCS semmilyen számítás vagy szűrés!
      let partners: Partner[] = [];
      let topBest: TopPartner[] = [];
      let topWorst: TopPartner[] = [];
      let sleeping: SleepingPartner[] = [];

      // A webhook válasz egy tömb, az első elem tartalmazza az összes adatot
      const mainData = Array.isArray(responseData) ? responseData[0] : responseData;
      
      if (mainData) {
        const partnersRaw = mainData.partners || [];
        const topBestRaw = mainData.top_best_customers || [];
        const topWorstRaw = mainData.top_worst_customers || [];
        const sleepingRaw = mainData.sleeping_customers || [];

        partners = (Array.isArray(partnersRaw) ? partnersRaw : []).map((p: Record<string, unknown>) => normalizePartner(p));
        topBest = (Array.isArray(topBestRaw) ? topBestRaw : []).map((p: Record<string, unknown>) => normalizeTopPartner(p));
        topWorst = (Array.isArray(topWorstRaw) ? topWorstRaw : []).map((p: Record<string, unknown>) => normalizeTopPartner(p));
        sleeping = (Array.isArray(sleepingRaw) ? sleepingRaw : []).map((p: Record<string, unknown>) => normalizeTopPartner(p));
      }

      setData({ partners, topBest, topWorst, sleeping });
      
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
    }
  }, [toast]);

  return {
    partners: data.partners,
    topBest: data.topBest,
    topWorst: data.topWorst,
    sleeping: data.sleeping,
    isLoading,
    fetchPartners,
  };
};
