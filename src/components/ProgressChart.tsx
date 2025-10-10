import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface HistoryData {
  total_points: number;
  rank: number;
  created_at: string;
  globalAverage?: number;
  total_points_pool?: number;
  total_wallets?: number;
}

interface ProgressChartProps {
  data: HistoryData[];
  loading?: boolean;
}

export const ProgressChart = ({ data, loading }: ProgressChartProps) => {
  if (loading) {
    return (
      <Card className="card-premium border">
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Points Growth</h3>
          </div>
          <div className="h-[250px] sm:h-[320px] flex items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="card-premium border">
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Points Growth</h3>
          </div>
          <div className="h-[250px] sm:h-[320px] flex items-center justify-center border border-dashed border-border rounded-xl bg-primary/5">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">No historical data</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/50 mt-1">
                  Data will appear as it's tracked
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.created_at), 'MMM dd HH:mm'),
    points: Number(item.total_points)
  }));

  return (
    <Card className="card-premium border">
      <div className="p-4 sm:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight">Points Growth</h3>
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:!h-[320px]">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={45}
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
              formatter={(value: number) => [value.toLocaleString(), 'Points']}
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
