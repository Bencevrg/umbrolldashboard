import { useState, useCallback } from 'react';
import { Partner, TopPartner, SleepingPartner, DashboardData } from '@/types/partner';
import { mockPartners } from '@/data/mockPartners';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://n8nlocal.benceaiproject.uk/webhook/42275bdc-cab0-46a4-83be-989d0f937d52';

const normalizePartner = (p: Record<string, unknown>): Partner => ({
  partner: String(p.partner || p['Partner'] || ''),
  osszes_arajanlat: Number(p.osszes_arajanlat ?? p['összes_árajánlat'] ?? p.total_quotes ?? 0),
  sikeres_arajanlatok: Number(p.sikeres_arajanlatok ?? p['sikeres_árajánlatok'] ?? p.completed_quotes ?? 0),
  sikertelen_arajanlatok: Number(p.sikertelen_arajanlatok ?? p['sikertelen_árajánlatok'] ?? p.incomplete_quotes ?? 0),
  sikeressegi_arany: Number(p.sikeressegi_arany ?? p['sikerességi_arány'] ?? p.completion_rate ?? 0),
  legutobbi_sikeres_datum: (p.legutobbi_sikeres_datum ?? p['legutóbbi_sikeres_dátum'] ?? p.last_completed_date ?? null) as string | null,
  legutobbi_arajanlat_datum: (p.legutobbi_arajanlat_datum ?? p['legutóbbi_árajánlat_dátum'] ?? p.last_quote_date ?? null) as string | null,
  napok_a_legutobbi_arajanlat_ota: Number(p.napok_a_legutobbi_arajanlat_ota ?? p['napok_a_legutóbbi_árajánlat_óta'] ?? p.days_since_last_quote ?? 0),
  alvo: p.alvo === true || p.alvo === 'igaz' || p['alvó'] === 'igaz' || p['alvó(igaz/hamis)'] === 'igaz' || p.is_sleeping === true,
  letrehozva: String(p.letrehozva ?? p['létrehozva'] ?? p.generated_at ?? ''),
  korrigalt_sikeressegi_arany: Number(p.korrigalt_sikeressegi_arany ?? p['korrigált_sikerességi_arány'] ?? p.adjusted_completion_rate ?? 0),
  ertek_pontszam: Number(p.ertek_pontszam ?? p['érték_pontszám'] ?? p.value_score ?? 0),
  kategoria: String(p.kategoria ?? p['kategória'] ?? p.category ?? 'KÖZEPES'),
  sikertelen_pontszam: Number(p.sikertelen_pontszam ?? p['sikertelen_pontszám'] ?? p.waste_score ?? 0),
});

const normalizeArray = <T extends Partner>(data: unknown, normalizer: (p: Record<string, unknown>) => T = normalizePartner as (p: Record<string, unknown>) => T): T[] => {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : [];
  return arr.map((item, index) => ({
    ...normalizer(item as Record<string, unknown>),
    rank: index + 1,
  })) as T[];
};

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
      
      // Handle the response - could be structured with sheets or flat array
      let partners: Partner[] = [];
      let topBest: TopPartner[] = [];
      let topWorst: TopPartner[] = [];
      let sleeping: SleepingPartner[] = [];

      if (Array.isArray(responseData)) {
        // If it's a flat array, assume it's partners
        partners = normalizeArray(responseData);
      } else {
        // Handle structured response with multiple sheets
        partners = normalizeArray(responseData.partners || responseData.data || []);
        topBest = normalizeArray<TopPartner>(responseData.top_best_customers || responseData.topBest || []);
        topWorst = normalizeArray<TopPartner>(responseData.top_worst_customers || responseData.topWorst || []);
        sleeping = normalizeArray<SleepingPartner>(responseData.sleeping_customers || responseData.sleeping || []);
      }

      // If we got partners but no other sheets, derive them
      if (partners.length > 0) {
        if (topBest.length === 0) {
          // Sort by value_score descending for best partners
          topBest = [...partners]
            .sort((a, b) => b.ertek_pontszam - a.ertek_pontszam)
            .slice(0, 20)
            .map((p, i) => ({ ...p, rank: i + 1 }));
        }
        if (topWorst.length === 0) {
          // Sort by waste_score descending for worst partners
          topWorst = [...partners]
            .sort((a, b) => b.sikertelen_pontszam - a.sikertelen_pontszam)
            .slice(0, 20)
            .map((p, i) => ({ ...p, rank: i + 1 }));
        }
        if (sleeping.length === 0) {
          // Filter sleeping partners (90+ days)
          sleeping = partners
            .filter(p => p.alvo || p.napok_a_legutobbi_arajanlat_ota >= 90)
            .sort((a, b) => b.napok_a_legutobbi_arajanlat_ota - a.napok_a_legutobbi_arajanlat_ota)
            .map((p, i) => ({ ...p, rank: i + 1 }));
        }
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
