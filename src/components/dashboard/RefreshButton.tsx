import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const RefreshButton = ({ onClick, isLoading }: RefreshButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg"
    >
      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      {isLoading ? 'Betöltés...' : 'Adatok frissítése'}
    </Button>
  );
};
