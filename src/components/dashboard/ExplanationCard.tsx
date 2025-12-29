import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplanationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'success' | 'warning' | 'destructive' | 'default';
}

export const ExplanationCard = ({ 
  icon: Icon, 
  title, 
  description, 
  variant = 'default' 
}: ExplanationCardProps) => {
  const variants = {
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    destructive: 'border-destructive/30 bg-destructive/5',
    default: 'border-border bg-muted/30',
  };

  const iconVariants = {
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
    default: 'text-muted-foreground',
  };

  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', variants[variant])}>
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconVariants[variant])} />
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
};
