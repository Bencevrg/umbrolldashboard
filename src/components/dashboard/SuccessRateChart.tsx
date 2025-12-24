import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Partner } from '@/types/partner';

interface SuccessRateChartProps {
  partners: Partner[];
}

export const SuccessRateChart = ({ partners }: SuccessRateChartProps) => {
  const chartData = partners
    .sort((a, b) => b.sikeressegi_arany - a.sikeressegi_arany)
    .slice(0, 8)
    .map((p) => ({
      name: p.partner.length > 15 ? p.partner.substring(0, 15) + '...' : p.partner,
      sikeresseg: p.sikeressegi_arany,
      kategoria: p.kategoria,
    }));

  const getBarColor = (kategoria: string) => {
    switch (kategoria) {
      case 'A': return 'hsl(145 60% 45%)';
      case 'B': return 'hsl(356 90% 45%)';
      case 'C': return 'hsl(38 92% 50%)';
      case 'D': return 'hsl(0 84% 60%)';
      default: return 'hsl(220 10% 45%)';
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-card animate-fade-in">
      <h3 className="mb-4 text-lg font-semibold">Top partnerek sikerességi aránya</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -4px hsl(220 15% 20% / 0.1)',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Sikeresség']}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
            />
            <Bar dataKey="sikeresseg" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.kategoria)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
