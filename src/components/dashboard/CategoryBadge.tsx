import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  kategoria: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge = ({ kategoria, size = 'md' }: CategoryBadgeProps) => {
  const getStyles = () => {
    const cat = (kategoria || '').toUpperCase();
    
    if (cat.includes('MAGAS') || cat.includes('ÉRTÉK') || cat === 'A' || cat === 'MAGAS_ÉRTÉK') {
      return 'bg-success/15 text-success border-success/30';
    }
    if (cat.includes('ROSSZ') || cat === 'D' || cat === 'ROSSZ_ARÁNY') {
      return 'bg-destructive/15 text-destructive border-destructive/30';
    }
    if (cat.includes('KÖZEPES') || cat === 'B' || cat === 'C') {
      return 'bg-warning/15 text-warning border-warning/30';
    }
    if (cat.includes('KEVÉS') || cat === 'KEVÉS_ÁRAJÁNLAT') {
      return 'bg-muted text-muted-foreground border-border';
    }
    
    return 'bg-primary/15 text-primary border-primary/30';
  };

  const getLabel = () => {
    const cat = (kategoria || '').toUpperCase();
    
    if (cat === 'A' || cat === 'MAGAS_ÉRTÉK' || (cat.includes('MAGAS') && cat.includes('ÉRTÉK'))) return 'Kiváló';
    if (cat === 'B') return 'Jó';
    if (cat === 'C' || cat === 'KÖZEPES') return 'Közepes';
    if (cat === 'D' || cat === 'ROSSZ_ARÁNY' || cat.includes('ROSSZ')) return 'Gyenge';
    if (cat === 'KEVÉS_ÁRAJÁNLAT' || cat.includes('KEVÉS')) return 'Kevés ajánlat';
    
    return kategoria || '—';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-semibold',
        getStyles(),
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-3 text-sm'
      )}
    >
      {getLabel()}
    </span>
  );
};
