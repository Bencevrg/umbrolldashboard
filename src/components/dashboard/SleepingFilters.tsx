import { cn } from '@/lib/utils';

interface SleepingFiltersProps {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}

const thresholds = [
  { value: 90, label: '90+ nap' },
  { value: 120, label: '120+ nap' },
  { value: 180, label: '180+ nap' },
];

export const SleepingFilters = ({ threshold, onThresholdChange }: SleepingFiltersProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Inaktivitás:</span>
      <div className="flex gap-1">
        {thresholds.map((t) => (
          <button
            key={t.value}
            onClick={() => onThresholdChange(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              threshold === t.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};
