import { useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PartnersTable } from '@/components/dashboard/PartnersTable';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { SuccessRateChart } from '@/components/dashboard/SuccessRateChart';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { usePartnerData } from '@/hooks/usePartnerData';
import { PartnerStats } from '@/types/partner';
import { Users, TrendingUp, FileCheck, Moon, Target, AlertTriangle } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const { partners, isLoading, fetchPartners } = usePartnerData();

  const stats: PartnerStats = useMemo(() => {
    const osszesPartner = partners.length;
    const alvoPartner = partners.filter(p => p.alvo).length;
    const aktívPartner = osszesPartner - alvoPartner;
    const atlagosSikerArany = partners.length > 0 
      ? partners.reduce((acc, p) => acc + p.sikeressegi_arany, 0) / osszesPartner 
      : 0;
    const osszesArajanlat = partners.reduce((acc, p) => acc + p.osszes_arajanlat, 0);
    const sikeresArajanlat = partners.reduce((acc, p) => acc + p.sikeres_arajanlatok, 0);
    
    const kategoriaEloszlas = partners.reduce(
      (acc, p) => {
        acc[p.kategoria]++;
        return acc;
      },
      { A: 0, B: 0, C: 0, D: 0 }
    );

    return {
      osszesPartner,
      aktívPartner,
      alvoPartner,
      atlagosSikerArany,
      osszesArajanlat,
      sikeresArajanlat,
      kategoriaEloszlas,
    };
  }, [partners]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Áttekintés</h2>
            <RefreshButton onClick={fetchPartners} isLoading={isLoading} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatsCard
              title="Összes partner"
              value={stats.osszesPartner}
              icon={Users}
              variant="primary"
            />
            <StatsCard
              title="Aktív partnerek"
              value={stats.aktívPartner}
              icon={Target}
              subtitle={stats.osszesPartner > 0 ? `${((stats.aktívPartner / stats.osszesPartner) * 100).toFixed(0)}% aktív` : '0% aktív'}
            />
            <StatsCard
              title="Alvó partnerek"
              value={stats.alvoPartner}
              icon={Moon}
              subtitle="60+ napja inaktív"
              variant="muted"
            />
            <StatsCard
              title="Átlagos sikeresség"
              value={`${stats.atlagosSikerArany.toFixed(1)}%`}
              icon={TrendingUp}
            />
            <StatsCard
              title="Összes árajánlat"
              value={stats.osszesArajanlat}
              icon={FileCheck}
              subtitle={`${stats.sikeresArajanlat} sikeres`}
            />
            <StatsCard
              title="Gyenge partnerek"
              value={stats.kategoriaEloszlas.D}
              icon={AlertTriangle}
              subtitle="D kategóriás"
              variant="muted"
            />
          </div>
        </section>

        {/* Charts */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <CategoryChart data={stats.kategoriaEloszlas} />
          <SuccessRateChart partners={partners} />
        </section>

        {/* Partners Table */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Partner részletek</h2>
          <PartnersTable partners={partners} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        © 2024 Umbroll - Partner Dashboard
      </footer>
      
      <Toaster />
    </div>
  );
};

export default Index;
