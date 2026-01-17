import { useState, useMemo } from 'react';
import { Partner } from '@/types/partner';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface DataTableProps {
  partners: Partner[];
  onRowClick?: (partner: Partner) => void;
  showRank?: boolean;
  defaultSort?: { field: keyof Partner | 'rank'; direction: 'asc' | 'desc' };
  variant?: 'default' | 'best' | 'worst' | 'sleeping';
}

type SortField = keyof Partner | 'rank';

export const DataTable = ({ 
  partners, 
  onRowClick, 
  showRank = false,
  defaultSort = { field: 'ertek_pontszam', direction: 'desc' },
  variant = 'default'
}: DataTableProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minQuotes, setMinQuotes] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>(defaultSort.field);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSort.direction);

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    const displayValue = value > 1 ? value : value * 100;
    return `${displayValue.toFixed(1)}%`;
  };

  const safeNumber = (value: number | undefined | null, defaultValue = 0) => {
    if (value === undefined || value === null || isNaN(Number(value))) return defaultValue;
    return Number(value);
  };

  const categories = useMemo(() => {
    const cats = new Set(partners.map(p => p.kategoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [partners]);

  const filteredAndSorted = useMemo(() => {
    let result = partners.filter(p => {
      const matchesSearch = p.partner.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.kategoria === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !p.alvo) || 
        (statusFilter === 'sleeping' && p.alvo);
      const matchesMinQuotes = !minQuotes || p.osszes_arajanlat >= parseInt(minQuotes);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesMinQuotes;
    });

    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortField === 'rank') {
        aVal = (a as { rank?: number }).rank || 0;
        bVal = (b as { rank?: number }).rank || 0;
      } else {
        aVal = a[sortField] as number | string;
        bVal = b[sortField] as number | string;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }

      const numA = safeNumber(aVal as number);
      const numB = safeNumber(bVal as number);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return result;
  }, [partners, search, categoryFilter, statusFilter, minQuotes, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Partner keresése..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {variant === 'default' && (
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Kategória" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Összes kategória</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Státusz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mind</SelectItem>
                <SelectItem value="active">Aktív</SelectItem>
                <SelectItem value="sleeping">Alvó</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min. árajánlat"
              value={minQuotes}
              onChange={(e) => setMinQuotes(e.target.value)}
              className="w-[130px]"
            />
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {showRank && (
                  <TableHead className="w-16 font-semibold text-foreground text-center">#</TableHead>
                )}
                <TableHead 
                  className="font-semibold text-foreground cursor-pointer hover:text-primary"
                  onClick={() => handleSort('partner')}
                >
                  <div className="flex items-center gap-2">
                    Partner
                    <SortIcon field="partner" />
                  </div>
                </TableHead>
                {variant === 'default' && (
                  <>
                    <TableHead className="font-semibold text-foreground text-center">Státusz</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Kategória</TableHead>
                  </>
                )}
                <TableHead 
                  className="font-semibold text-foreground text-right cursor-pointer hover:text-primary"
                  onClick={() => handleSort('osszes_arajanlat')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Árajánlatok
                    <SortIcon field="osszes_arajanlat" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-foreground text-right cursor-pointer hover:text-primary"
                  onClick={() => handleSort('korrigalt_sikeressegi_arany')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Korr. arány
                    <SortIcon field="korrigalt_sikeressegi_arany" />
                  </div>
                </TableHead>
                {(variant === 'best' || variant === 'default') && (
                  <TableHead 
                    className="font-semibold text-foreground text-right cursor-pointer hover:text-primary"
                    onClick={() => handleSort('ertek_pontszam')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Érték
                      <SortIcon field="ertek_pontszam" />
                    </div>
                  </TableHead>
                )}
                {(variant === 'worst' || variant === 'default') && (
                  <TableHead 
                    className="font-semibold text-foreground text-right cursor-pointer hover:text-primary"
                    onClick={() => handleSort('sikertelen_pontszam')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Veszteség
                      <SortIcon field="sikertelen_pontszam" />
                    </div>
                  </TableHead>
                )}
                {variant === 'sleeping' && (
                  <TableHead 
                    className="font-semibold text-foreground text-right cursor-pointer hover:text-primary"
                    onClick={() => handleSort('napok_a_legutobbi_arajanlat_ota')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Napok óta
                      <SortIcon field="napok_a_legutobbi_arajanlat_ota" />
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={showRank ? 8 : 7} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nincs találat
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map((partner, index) => (
                  <TableRow
                    key={partner.partner}
                    className={cn(
                      'transition-colors cursor-pointer',
                      onRowClick && 'hover:bg-accent/50',
                      partner.alvo && 'bg-muted/30'
                    )}
                    onClick={() => onRowClick?.(partner)}
                  >
                    {showRank && (
                      <TableCell className="text-center font-bold text-muted-foreground">
                        {(partner as { rank?: number }).rank || index + 1}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{partner.partner}</TableCell>
                    {variant === 'default' && (
                      <>
                        <TableCell className="text-center">
                          <StatusBadge alvo={partner.alvo} size="sm" />
                        </TableCell>
                        <TableCell className="text-center">
                          <CategoryBadge kategoria={partner.kategoria} size="sm" />
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">{safeNumber(partner.osszes_arajanlat)}</span>
                        <span className="text-xs text-muted-foreground">
                          {safeNumber(partner.sikeres_arajanlatok)} ✓ / {safeNumber(partner.sikertelen_arajanlatok)} ✗
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-semibold',
                        safeNumber(partner.korrigalt_sikeressegi_arany) >= 0.15 ? 'text-success' : 'text-destructive'
                      )}>
                        {formatPercent(partner.korrigalt_sikeressegi_arany)}
                      </span>
                    </TableCell>
                    {(variant === 'best' || variant === 'default') && (
                      <TableCell className="text-right">
                        <span className="font-semibold text-success">
                          {safeNumber(partner.ertek_pontszam).toFixed(2)}
                        </span>
                      </TableCell>
                    )}
                    {(variant === 'worst' || variant === 'default') && (
                      <TableCell className="text-right">
                        <span className="font-semibold text-destructive">
                          {safeNumber(partner.sikertelen_pontszam).toFixed(2)}
                        </span>
                      </TableCell>
                    )}
                    {variant === 'sleeping' && (
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-bold px-2 py-1 rounded',
                          partner.napok_a_legutobbi_arajanlat_ota >= 180 ? 'bg-destructive/20 text-destructive' :
                          partner.napok_a_legutobbi_arajanlat_ota >= 120 ? 'bg-warning/20 text-warning' : 
                          'bg-muted text-muted-foreground'
                        )}>
                          {partner.napok_a_legutobbi_arajanlat_ota} nap
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-right">
        {filteredAndSorted.length} / {partners.length} partner
      </p>
    </div>
  );
};
