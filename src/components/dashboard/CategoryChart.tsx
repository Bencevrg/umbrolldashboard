import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryChartProps {
  data: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

export const CategoryChart = ({ data }: CategoryChartProps) => {
  const chartData = [
    { name: 'A - Kiváló', value: data.A, color: 'hsl(145 60% 45%)' },
    { name: 'B - Jó', value: data.B, color: 'hsl(356 90% 45%)' },
    { name: 'C - Közepes', value: data.C, color: 'hsl(38 92% 50%)' },
    { name: 'D - Gyenge', value: data.D, color: 'hsl(0 84% 60%)' },
  ].filter(item => item.value > 0);

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
                boxShadow: '0 4px 20px -4px hsl(220 15% 20% / 0.1)',
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
