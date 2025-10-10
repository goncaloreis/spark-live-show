import { Card } from "@/components/ui/card";
import { TrendingUp, Award } from "lucide-react";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface HistoryData {
  total_points: number;
  rank: number;
  created_at: string;
  globalAverage?: number;
  total_points_pool?: number;
  total_wallets?: number;
}

interface CombinedChartProps {
  data: HistoryData[];
  loading?: boolean;
}

export const CombinedChart = ({ data, loading }: CombinedChartProps) => {
  if (loading) {
    return (
      <Card className="card-premium border col-span-1 lg:col-span-2">
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Performance Overview</h3>
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
      <Card className="card-premium border col-span-1 lg:col-span-2">
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Performance Overview</h3>
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

  // Find the min/max rank for better scaling (invert for visual appeal)
  const ranks = data.map(d => d.rank).filter(r => r > 0);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);
  const rankPadding = (maxRank - minRank) * 0.1;

  const chartData = data.map(item => ({
    date: format(new Date(item.created_at), 'MMM dd HH:mm'),
    points: Number(item.total_points),
    rank: item.rank,
    // Inverted rank for visual representation (lower rank = better = higher on chart)
    displayRank: maxRank - item.rank + minRank
  }));

  return (
    <Card className="card-premium border col-span-1 lg:col-span-2">
      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Performance Overview</h3>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Points</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-secondary" />
              <span className="text-muted-foreground">Rank</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:!h-[320px]">
          <ComposedChart data={chartData}>
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
            
            {/* Left Y-axis for Points */}
            <YAxis 
              yAxisId="points"
              stroke="hsl(var(--primary))"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              width={45}
              label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--primary))', fontSize: '11px', fontWeight: 600 } }}
            />
            
            {/* Right Y-axis for Rank (inverted display) */}
            <YAxis 
              yAxisId="rank"
              orientation="right"
              stroke="hsl(var(--secondary))"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickFormatter={(value) => {
                // Convert back to actual rank for display
                const actualRank = maxRank - value + minRank;
                return `#${Math.round(actualRank)}`;
              }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--secondary))', strokeWidth: 2 }}
              width={55}
              domain={[minRank - rankPadding, maxRank - minRank + rankPadding]}
              label={{ value: 'Rank', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--secondary))', fontSize: '11px', fontWeight: 600 } }}
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
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                
                const data = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-card)',
                    padding: '12px'
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: 'hsl(var(--muted-foreground))' }}>
                      {data.date}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))' }} />
                        <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>
                          <strong>Points:</strong> {data.points.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--secondary))' }} />
                        <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>
                          <strong>Rank:</strong> #{data.rank}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            
            {/* Points area chart */}
            <Area 
              yAxisId="points"
              type="monotone" 
              dataKey="points" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fill="url(#colorPoints)"
              fillOpacity={1}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
            
            {/* Rank line chart (using displayRank for inverted visual) */}
            <Line 
              yAxisId="rank"
              type="monotone" 
              dataKey="displayRank" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Points scale on left axis • Rank scale on right axis (↑ = improvement)
          </p>
        </div>
      </div>
    </Card>
  );
};