import { useMemo, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { PartnerDetailPanel } from '@/components/dashboard/PartnerDetailPanel';
import { ExplanationCard } from '@/components/dashboard/ExplanationCard';
import { SleepingFilters } from '@/components/dashboard/SleepingFilters';
import { DocumentationPage } from '@/components/dashboard/DocumentationPage';
import { ChatPage } from '@/components/dashboard/ChatPage';
import { ProductCategoriesPage } from '@/components/dashboard/ProductCategoriesPage';
import { usePartnerData } from '@/hooks/usePartnerData';
import { Partner, PartnerStats, ChatMessage } from '@/types/partner';
import { Users, TrendingUp, FileCheck, Moon, Target, AlertTriangle, Trophy, Clock } from 'lucide-react';

const Index = () => {
  const { partners, topBest, topWorst, sleeping, partnerProductStats, isLoading, fetchPartners } = usePartnerData();
  const [activeTab, setActiveTab] = useState('partners');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [sleepingThreshold, setSleepingThreshold] = useState(90);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const clearChatMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  const stats: PartnerStats = useMemo(() => {
    const osszesPartner = partners.length;
    const alvoPartner = partners.filter(p => p.alvo).length;
    const aktívPartner = osszesPartner - alvoPartner;
    const osszesArajanlat = partners.reduce((acc, p) => acc + (p.osszes_arajanlat || 0), 0);
    const sikeresArajanlat = partners.reduce((acc, p) => acc + (p.sikeres_arajanlatok || 0), 0);
    const atlagosSikerArany = osszesArajanlat > 0 ? (sikeresArajanlat / osszesArajanlat) : 0;
    
    const kategoriaEloszlas = partners.reduce<Record<string, number>>(
      (acc, p) => {
        const cat = p.kategoria || 'Ismeretlen';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {}
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

  // Normalize global average for display
  const globalAvgDisplay = (stats.atlagosSikerArany * 100).toFixed(1);

  // Filter sleeping partners by threshold
  const filteredSleeping = useMemo(() => {
    const source = sleeping.length > 0 ? sleeping : partners.filter(p => p.alvo);
    return source.filter(p => p.napok_a_legutobbi_arajanlat_ota >= sleepingThreshold);
  }, [sleeping, partners, sleepingThreshold]);

  const renderContent = () => {
    switch (activeTab) {
      case 'partners':
        return (
          <>
            {/* Stats Grid */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Áttekintés</h2>
                <RefreshButton onClick={fetchPartners} isLoading={isLoading} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatsCard
                  title="Partnerek száma"
                  value={stats.osszesPartner}
                  icon={Users}
                  variant="primary"
                />
                <StatsCard
                  title="Összes árajánlat"
                  value={stats.osszesArajanlat}
                  icon={FileCheck}
                  subtitle={`${stats.sikeresArajanlat} sikeres`}
                />
                <StatsCard
                  title="Sikeres árajánlat"
                  value={stats.sikeresArajanlat}
                  icon={Target}
                  variant="success"
                />
                <StatsCard
                  title="Globális sikerességi arány"
                  value={`${globalAvgDisplay}%`}
                  icon={TrendingUp}
                  subtitle="nyers arány"
                />
                <StatsCard
                  title="Alvó partnerek"
                  value={stats.alvoPartner}
                  icon={Moon}
                  subtitle="90+ napja inaktív"
                  variant="muted"
                />
              </div>
            </section>

            {/* Charts */}
            <section className="mb-8">
              <CategoryChart data={stats.kategoriaEloszlas} />
            </section>

            {/* Partners Table */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Partner részletek</h2>
              <DataTable 
                partners={partners} 
                onRowClick={setSelectedPartner}
                defaultSort={{ field: 'ertek_pontszam', direction: 'desc' }}
              />
            </section>
          </>
        );

      case 'best':
        return (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Legértékesebb partnerek</h2>
                <p className="text-muted-foreground">Magas value_score - sok sikeres árajánlat várható</p>
              </div>
              <RefreshButton onClick={fetchPartners} isLoading={isLoading} />
            </div>

            <ExplanationCard
              icon={Trophy}
              title="Miért kerültek ide?"
              description="Ezek a partnerek sok árajánlatot generálnak, és a cég átlagánál (14-15%) jobb korrigált sikerességi aránnyal rendelkeznek. Az érték pontszám = korrigált arány × összes ajánlat."
              variant="success"
            />

            <div className="mt-6">
            <DataTable 
                partners={(topBest.length > 0 ? topBest : partners.slice().sort((a, b) => b.ertek_pontszam - a.ertek_pontszam)).slice().sort((a, b) => a.partner.localeCompare(b.partner))}
                onRowClick={setSelectedPartner}
                showRank
                defaultSort={{ field: 'partner', direction: 'asc' }}
                variant="best"
              />
            </div>
          </>
        );

      case 'worst':
        return (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Időhúzó partnerek</h2>
                <p className="text-muted-foreground">Magas waste_score - sok sikertelen árajánlat várható</p>
              </div>
              <RefreshButton onClick={fetchPartners} isLoading={isLoading} />
            </div>

            <ExplanationCard
              icon={AlertTriangle}
              title="Miért kerültek ide?"
              description="Ezek a partnerek sok árajánlatot generálnak, de a cég átlagánál rosszabb korrigált sikerességi aránnyal. A veszteség pontszám = (1 - korrigált arány) × összes ajánlat."
              variant="destructive"
            />

            <div className="mt-6">
            <DataTable 
                partners={(topWorst.length > 0 ? topWorst : partners.slice().sort((a, b) => b.sikertelen_pontszam - a.sikertelen_pontszam)).slice().sort((a, b) => a.partner.localeCompare(b.partner))}
                onRowClick={setSelectedPartner}
                showRank
                defaultSort={{ field: 'partner', direction: 'asc' }}
                variant="worst"
              />
            </div>
          </>
        );

      case 'sleeping':
        return (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Alvó partnerek</h2>
                <p className="text-muted-foreground">Régóta inaktív partnerek - reaktiválásra várnak</p>
              </div>
              <div className="flex items-center gap-4">
                <SleepingFilters threshold={sleepingThreshold} onThresholdChange={setSleepingThreshold} />
                <RefreshButton onClick={fetchPartners} isLoading={isLoading} />
              </div>
            </div>

            <ExplanationCard
              icon={Clock}
              title="Mire figyelj?"
              description={`Ezek a partnerek ${sleepingThreshold}+ napja nem küldtek árajánlat kérést. Érdemes lehet kapcsolatba lépni velük, hogy újra aktiválódjanak.`}
              variant="warning"
            />

            <div className="mt-6">
              <DataTable 
                partners={filteredSleeping}
                onRowClick={setSelectedPartner}
                showRank
                defaultSort={{ field: 'napok_a_legutobbi_arajanlat_ota', direction: 'desc' }}
                variant="sleeping"
              />
            </div>
          </>
        );

      case 'categories':
        return (
          <ProductCategoriesPage 
            data={partnerProductStats} 
            isLoading={isLoading} 
            onRefresh={fetchPartners} 
          />
        );

      case 'docs':
        return <DocumentationPage />;

      case 'chat':
        return (
          <ChatPage 
            messages={chatMessages} 
            setMessages={setChatMessages} 
            onClearChat={clearChatMessages}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </DashboardLayout>

      {/* Partner Detail Panel */}
      <PartnerDetailPanel 
        partner={selectedPartner} 
        onClose={() => setSelectedPartner(null)}
        globalAverage={stats.atlagosSikerArany}
      />

      {/* Overlay when panel is open */}
      {selectedPartner && (
        <div 
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
          onClick={() => setSelectedPartner(null)}
        />
      )}
    </>
  );
};

export default Index;
