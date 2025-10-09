import { Card } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface HistoryData {
  total_points: number;
  rank: number;
  created_at: string;
}

interface RankChartProps {
  data: HistoryData[];
  loading?: boolean;
}

export const RankChart = ({ data, loading }: RankChartProps) => {
  if (loading || !data || data.length === 0) {
    return null;
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.created_at), 'MMM dd HH:mm'),
    rank: item.rank
  }));

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
      <div className="p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          Your Rank Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              reversed={true}
              tickFormatter={(value) => `#${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [`#${value.toLocaleString()}`, 'Rank']}
            />
            <Line 
              type="monotone" 
              dataKey="rank" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
