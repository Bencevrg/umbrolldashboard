import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryChartProps {
  data: Record<string, number>;
}

const COLORS = [
  'hsl(145 60% 45%)',
  'hsl(356 90% 45%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(220 10% 60%)',
];

const LABELS: Record<string, string> = {
  'A': 'Kiváló',
  'B': 'Jó',
  'C': 'Közepes',
  'D': 'Gyenge',
  'MAGAS_ÉRTÉK': 'Magas érték',
  'ROSSZ_ARÁNY': 'Rossz arány',
  'KEVÉS_ÁRAJÁNLAT': 'Kevés ajánlat',
};

export const CategoryChart = ({ data }: CategoryChartProps) => {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value], index) => ({
      name: LABELS[key] || key,
      value,
      color: COLORS[index % COLORS.length],
    }));

  return (
    <div className="rounded-lg border bg-card p-6 shadow-card animate-fade-in">
      <h3 className="mb-4 text-lg font-semibold">Partner kategóriák</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} partner`, '']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
