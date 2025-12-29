import { ReactNode } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardNav } from './DashboardNav';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardNav activeTab={activeTab} onTabChange={onTabChange} />
      
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        © 2025 Umbroll - Partner Analytics Dashboard
      </footer>
      
      <Toaster />
    </div>
  );
};
