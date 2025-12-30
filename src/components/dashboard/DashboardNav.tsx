import { cn } from '@/lib/utils';
import { Users, Trophy, AlertTriangle, Moon, BookOpen, MessageCircle } from 'lucide-react';

interface DashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'partners', label: 'Partnerek', icon: Users },
  { id: 'best', label: 'Legértékesebb', icon: Trophy },
  { id: 'worst', label: 'Időhúzók', icon: AlertTriangle },
  { id: 'sleeping', label: 'Alvó partnerek', icon: Moon },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'docs', label: 'Leírás', icon: BookOpen },
];

export const DashboardNav = ({ activeTab, onTabChange }: DashboardNavProps) => {
  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
