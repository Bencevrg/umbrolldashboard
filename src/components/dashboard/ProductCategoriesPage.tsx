import { useMemo, useState } from 'react';
import { PartnerProductStat } from '@/types/partner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshButton } from './RefreshButton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, LayoutGrid, BarChart3, Package } from 'lucide-react';

interface ProductCategoriesPageProps {
  data: PartnerProductStat[];
  isLoading: boolean;
  hasFetched?: boolean;
  onRefresh: () => void;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(215, 70%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(340, 65%, 55%)',
];

export const ProductCategoriesPage = ({ data, isLoading, hasFetched = true, onRefresh }: ProductCategoriesPageProps) => {
  const [searchPartner, setSearchPartner] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Unique partners and categories
  const uniquePartners = useMemo(() => {
    return [...new Set(data.map(d => d.partner2))].sort();
  }, [data]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(data.map(d => d.termekkategoria))].sort();
  }, [data]);

  // Filtered data based on search and category
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchesSearch = searchPartner === '' || 
        d.partner2.toLowerCase().includes(searchPartner.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
        d.termekkategoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data, searchPartner, selectedCategory]);

  // Pivot table data - rows = partners, columns = categories
  const pivotData = useMemo(() => {
    const partnerMap = new Map<string, Map<string, number>>();
    
    // Filter by search only for pivot
    const pivotFilteredData = data.filter(d => 
      searchPartner === '' || d.partner2.toLowerCase().includes(searchPartner.toLowerCase())
    );
    
    pivotFilteredData.forEach(d => {
      if (!partnerMap.has(d.partner2)) {
        partnerMap.set(d.partner2, new Map());
      }
      partnerMap.get(d.partner2)!.set(d.termekkategoria, d.db);
    });

    return Array.from(partnerMap.entries()).map(([partner, categories]) => ({
      partner,
      categories: Object.fromEntries(categories),
      total: Array.from(categories.values()).reduce((sum, val) => sum + val, 0),
    })).sort((a, b) => b.total - a.total);
  }, [data, searchPartner]);

  // Category totals for chart
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    data.forEach(d => {
      totals.set(d.termekkategoria, (totals.get(d.termekkategoria) || 0) + d.db);
    });
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Top partners in selected category
  const topPartnersInCategory = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return data
      .filter(d => d.termekkategoria === selectedCategory)
      .sort((a, b) => b.db - a.db)
      .slice(0, 10);
  }, [data, selectedCategory]);

  // Partner suggestions for autocomplete
  const partnerSuggestions = useMemo(() => {
    if (searchPartner.length < 1) return [];
    return uniquePartners
      .filter(p => p.toLowerCase().includes(searchPartner.toLowerCase()))
      .slice(0, 5);
  }, [uniquePartners, searchPartner]);

  if (isLoading && !hasFetched) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card><CardContent className="pt-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-[200px] w-full" /></CardContent></Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Árajánlatok kategóriák szerint</h2>
            <p className="text-muted-foreground">Partner és termékkategória szerinti bontás</p>
          </div>
          <RefreshButton onClick={onRefresh} isLoading={isLoading} />
        </div>
        
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nincs adat</h3>
            <p className="text-muted-foreground text-center max-w-md">
              A partner-termékkategória statisztikák még nem érhetők el. 
              Kattints a Frissítés gombra az adatok lekéréséhez.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Árajánlatok kategóriák szerint</h2>
          <p className="text-muted-foreground">Partner és termékkategória szerinti bontás</p>
        </div>
        <RefreshButton onClick={onRefresh} isLoading={isLoading} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Partner keresése..."
                value={searchPartner}
                onChange={(e) => setSearchPartner(e.target.value)}
                className="pl-9"
              />
              {partnerSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  {partnerSuggestions.map((partner) => (
                    <button
                      key={partner}
                      onClick={() => setSearchPartner(partner)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                    >
                      {partner}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Termékkategória" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Összes kategória</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Categories Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top kategóriák összesen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryTotals.slice(0, 10)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Sikeres árajánlat']}
                    contentStyle={{ 
                      background: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryTotals.slice(0, 10).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Partners in Selected Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {selectedCategory === 'all' 
                ? 'Top partnerek (válassz kategóriát)' 
                : `Top partnerek: ${selectedCategory}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCategory === 'all' ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Válassz egy termékkategóriát a szűrőben
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPartnersInCategory} layout="vertical">
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="partner2" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Sikeres árajánlat']}
                      contentStyle={{ 
                        background: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="db" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pivot Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Partner × Termékkategória mátrix
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {pivotData.length} partner, {uniqueCategories.length} kategória
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Partner</TableHead>
                  {uniqueCategories.map((cat) => (
                    <TableHead key={cat} className="text-center min-w-[100px] whitespace-nowrap">
                      {cat}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold min-w-[80px]">Össz.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pivotData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={uniqueCategories.length + 2} className="text-center py-8 text-muted-foreground">
                      Nincs találat a megadott szűrésre
                    </TableCell>
                  </TableRow>
                ) : (
                  pivotData.map((row) => (
                    <TableRow key={row.partner}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {row.partner}
                      </TableCell>
                      {uniqueCategories.map((cat) => (
                        <TableCell key={cat} className="text-center">
                          <span className={row.categories[cat] ? 'font-medium' : 'text-muted-foreground'}>
                            {row.categories[cat] ?? 0}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold bg-muted/30">
                        {row.total}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{uniquePartners.length}</div>
            <p className="text-sm text-muted-foreground">Partner</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{uniqueCategories.length}</div>
            <p className="text-sm text-muted-foreground">Termékkategória</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.db, 0).toLocaleString('hu-HU')}
            </div>
            <p className="text-sm text-muted-foreground">Összes sikeres árajánlat</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
