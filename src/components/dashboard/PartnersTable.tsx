import { Partner } from '@/types/partner';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface PartnersTableProps {
  partners: Partner[];
}

export const PartnersTable = ({ partners }: PartnersTableProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="rounded-lg border bg-card shadow-card animate-fade-in">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">Partner</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Státusz</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Kategória</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Árajánlatok</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Sikeresség</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Érték pontszám</TableHead>
              <TableHead className="font-semibold text-foreground text-center">Utolsó ajánlat</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Napok óta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner, index) => (
              <TableRow
                key={partner.partner}
                className={cn(
                  'transition-colors hover:bg-accent/50',
                  partner.alvo && 'bg-muted/30'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium">{partner.partner}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge alvo={partner.alvo} size="sm" />
                </TableCell>
                <TableCell className="text-center">
                  <CategoryBadge kategoria={partner.kategoria} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-semibold">{partner.osszes_arajanlat}</span>
                    <span className="text-xs text-muted-foreground">
                      {partner.sikeres_arajanlatok} ✓ / {partner.sikertelen_arajanlatok} ✗
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      'font-semibold',
                      partner.sikeressegi_arany >= 60 ? 'text-success' :
                      partner.sikeressegi_arany >= 40 ? 'text-warning' : 'text-destructive'
                    )}>
                      {formatPercent(partner.sikeressegi_arany)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      korr: {formatPercent(partner.korrigalt_sikeressegi_arany)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          partner.ertek_pontszam >= 80 ? 'bg-success' :
                          partner.ertek_pontszam >= 50 ? 'bg-primary' :
                          partner.ertek_pontszam >= 30 ? 'bg-warning' : 'bg-destructive'
                        )}
                        style={{ width: `${partner.ertek_pontszam}%` }}
                      />
                    </div>
                    <span className="font-semibold w-8">{partner.ertek_pontszam}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm">
                  {formatDate(partner.legutobbi_arajanlat_datum)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    'font-medium',
                    partner.napok_a_legutobbi_arajanlat_ota > 60 ? 'text-destructive' :
                    partner.napok_a_legutobbi_arajanlat_ota > 30 ? 'text-warning' : 'text-foreground'
                  )}>
                    {partner.napok_a_legutobbi_arajanlat_ota} nap
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
