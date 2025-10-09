import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

  const latestRank = data[data.length - 1]?.rank;
  const earliestRank = data[0]?.rank;
  const rankImprovement = earliestRank - latestRank;

  return (
    <Card className="card-premium border">
      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-secondary/10 border border-secondary/20">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Rank Progress</h3>
          </div>
          {rankImprovement > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-success/10 border border-success/20">
              <span className="text-[10px] sm:text-xs font-bold text-success tabular-nums">
                +{rankImprovement.toLocaleString()} positions
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:!h-[320px]">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRank" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
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
              reversed={true}
              tickFormatter={(value) => `#${value.toLocaleString()}`}
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
              formatter={(value: number) => [`#${value.toLocaleString()}`, 'Rank']}
            />
            <Area 
              type="monotone" 
              dataKey="rank" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={3}
              fill="url(#colorRank)"
              fillOpacity={1}
              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
