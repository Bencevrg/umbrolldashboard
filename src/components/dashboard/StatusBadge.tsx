import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

interface StatusBadgeProps {
  alvo: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ alvo, size = 'md' }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        alvo
          ? 'bg-muted text-muted-foreground'
          : 'bg-success/15 text-success',
        size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-3 text-sm'
      )}
    >
      {alvo ? (
        <>
          <Moon className="h-3 w-3" />
          Alvó
        </>
      ) : (
        <>
          <Sun className="h-3 w-3" />
          Aktív
        </>
      )}
    </span>
  );
};
