import umbrollLogo from '@/assets/umbroll-logo.png';
import { Calendar } from 'lucide-react';

export const DashboardHeader = () => {
  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="gradient-umbroll px-6 py-4 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={umbrollLogo}
            alt="Umbroll Logo"
            className="h-12 w-auto"
          />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-primary-foreground">Partner Dashboard</h1>
            <p className="text-sm text-primary-foreground/80">Árajánlat analitika</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-4 py-2 text-primary-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">{today}</span>
        </div>
      </div>
    </header>
  );
};
