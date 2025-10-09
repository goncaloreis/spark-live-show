import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
      <Card className="card-premium border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Points Growth</h3>
          </div>
          <div className="h-[320px] flex items-center justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="card-premium border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Points Growth</h3>
          </div>
          <div className="h-[320px] flex items-center justify-center border border-dashed border-border/50 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No historical data</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Data will appear as it's tracked
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const avgPoints = data.length > 0 ? data[data.length - 1].total_points * 0.4 : 0;

  const chartData = data.map(item => ({
    date: format(new Date(item.created_at), 'MMM dd HH:mm'),
    points: Number(item.total_points),
    average: avgPoints
  }));

  return (
    <Card className="card-premium border-white/5">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Points Growth</h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
              <span className="text-muted-foreground">Your Points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <span className="text-muted-foreground">Average</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-card)',
                color: 'hsl(var(--foreground))',
                padding: '12px'
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(), 
                name === 'points' ? 'Your Points' : 'Average Points'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="average" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorAverage)"
              fillOpacity={1}
            />
            <Area 
              type="monotone" 
              dataKey="points" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="url(#colorPoints)"
              fillOpacity={1}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
