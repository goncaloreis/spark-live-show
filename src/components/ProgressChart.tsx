import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface HistoryData {
  total_points: number;
  rank: number;
  created_at: string;
}

interface ProgressChartProps {
  data: HistoryData[];
  loading?: boolean;
}

export const ProgressChart = ({ data, loading }: ProgressChartProps) => {
  if (loading) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
        <div className="p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Points Progress
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
        <div className="p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Points Progress
          </h3>
          <div className="h-[300px] flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/20">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">No historical data available yet</p>
              <p className="text-xs text-muted-foreground/60">
                Data will appear here as it's tracked over time
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.created_at), 'MMM dd'),
    points: Number(item.total_points),
    rank: item.rank
  }));

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
      <div className="p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Points Progress (Last 30 Days)
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
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Points']}
            />
            <Line 
              type="monotone" 
              dataKey="points" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
