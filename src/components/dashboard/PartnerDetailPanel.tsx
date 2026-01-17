import { Partner } from '@/types/partner';
import { X, TrendingUp, TrendingDown, Calendar, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryBadge } from './CategoryBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PartnerDetailPanelProps {
  partner: Partner | null;
  onClose: () => void;
  globalAverage?: number;
}

export const PartnerDetailPanel = ({ partner, onClose, globalAverage = 0.14 }: PartnerDetailPanelProps) => {
  if (!partner) return null;

  const formatPercent = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    // If value is already a percentage (>1), display as is, otherwise multiply by 100
    const displayValue = value > 1 ? value : value * 100;
    return `${displayValue.toFixed(1)}%`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return date;
  };

  const safeNumber = (value: number | undefined | null, decimals = 2) => {
    if (value === undefined || value === null || isNaN(Number(value))) return '—';
    return Number(value).toFixed(decimals);
  };

  // Normalize rate for comparison (if percentage, divide by 100)
  const normalizedRate = partner.korrigalt_sikeressegi_arany > 1 
    ? partner.korrigalt_sikeressegi_arany / 100 
    : partner.korrigalt_sikeressegi_arany;
  const isAboveAverage = normalizedRate > globalAverage;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l shadow-2xl z-50 overflow-y-auto animate-slide-in">
      <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{partner.partner}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Category & Status */}
        <div className="flex items-center gap-3">
          <CategoryBadge kategoria={partner.kategoria} />
          {partner.alvo && (
            <span className="px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium">
              Alvó partner
            </span>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Összes árajánlat</p>
            <p className="text-2xl font-bold">{partner.osszes_arajanlat}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Sikeres</p>
            <p className="text-2xl font-bold text-success">{partner.sikeres_arajanlatok}</p>
          </div>
        </div>

        {/* Success Rates */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Sikerességi mutatók</h3>
          
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nyers sikerességi arány</span>
              <span className="font-medium">{formatPercent(partner.sikeressegi_arany)}</span>
            </div>
            <div className="flex justify-between items-center">
              <Tooltip>
                <TooltipTrigger className="text-sm text-muted-foreground underline decoration-dotted cursor-help">
                  Korrigált arány
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Bayes/Laplace simított arány, amely figyelembe veszi a cég átlagát és a kis mintát is.</p>
                </TooltipContent>
              </Tooltip>
              <span className={cn(
                'font-semibold',
                isAboveAverage ? 'text-success' : 'text-destructive'
              )}>
                {formatPercent(partner.korrigalt_sikeressegi_arany)}
                {isAboveAverage ? (
                  <TrendingUp className="inline ml-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="inline ml-1 h-4 w-4" />
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Cég átlag: {formatPercent(globalAverage)}
            </div>
          </div>
        </div>

        {/* Value & Waste Scores */}
        <div className="grid grid-cols-2 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Érték pontszám</span>
                </div>
                <p className="text-2xl font-bold text-success">{safeNumber(partner.ertek_pontszam)}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Várható sikeres ajánlatok száma = korrigált arány × összes ajánlat. Minél magasabb, annál értékesebb a partner.</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Veszteség</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{safeNumber(partner.sikertelen_pontszam)}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Várható sikertelen ajánlatok száma = (1 - korrigált arány) × összes ajánlat. Magas érték = sok elpazarolt idő.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Időpontok</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Utolsó árajánlat</span>
              </div>
              <span className="font-medium">{formatDate(partner.legutobbi_arajanlat_datum)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Utolsó sikeres</span>
              </div>
              <span className="font-medium">{formatDate(partner.legutobbi_sikeres_datum)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Napok óta inaktív</span>
              <span className={cn(
                'font-semibold',
                partner.napok_a_legutobbi_arajanlat_ota >= 90 ? 'text-destructive' :
                partner.napok_a_legutobbi_arajanlat_ota >= 60 ? 'text-warning' : 'text-foreground'
              )}>
                {partner.napok_a_legutobbi_arajanlat_ota} nap
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
