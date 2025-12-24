import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  kategoria: 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md';
}

export const CategoryBadge = ({ kategoria, size = 'md' }: CategoryBadgeProps) => {
  const colors = {
    A: 'bg-success/15 text-success border-success/30',
    B: 'bg-primary/15 text-primary border-primary/30',
    C: 'bg-warning/15 text-warning border-warning/30',
    D: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const labels = {
    A: 'Kiváló',
    B: 'Jó',
    C: 'Közepes',
    D: 'Gyenge',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-semibold',
        colors[kategoria],
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-3 text-sm'
      )}
    >
      {kategoria} - {labels[kategoria]}
    </span>
  );
};
