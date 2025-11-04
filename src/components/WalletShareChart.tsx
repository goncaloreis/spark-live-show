import { Card } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface HistoryData {
  total_points: number;
  rank: number;
  created_at: string;
  total_points_pool?: number;
}

interface WalletShareChartProps {
  data: HistoryData[];
  loading?: boolean;
}

export const WalletShareChart = ({ data, loading }: WalletShareChartProps) => {
  if (loading) {
    return (
      <Card className="card-premium border">
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Wallet Share Progression</h3>
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

  // Filter data points that have total_points_pool
  const validData = data.filter(item => item.total_points_pool && item.total_points_pool > 0);

  if (!validData || validData.length === 0) {
    return (
      <Card className="card-premium border">
        <div className="p-4 sm:p-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">Wallet Share Progression</h3>
          </div>
          <div className="h-[250px] sm:h-[320px] flex items-center justify-center border border-dashed border-border rounded-xl bg-primary/5">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <PieChart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">No share data</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/50 mt-1">
                  Share data will appear as it's tracked
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate wallet share percentage for each data point
  const chartData = validData.map(item => {
    const sharePercentage = ((item.total_points / item.total_points_pool!) * 100);
    return {
      date: format(new Date(item.created_at), 'MMM dd HH:mm'),
      share: sharePercentage,
      shareFormatted: sharePercentage.toFixed(6)
    };
  });

  // Find min/max for better scaling
  const shares = chartData.map(d => d.share);
  const minShare = Math.min(...shares);
  const maxShare = Math.max(...shares);
  const sharePadding = (maxShare - minShare) * 0.1;

  return (
    <Card className="card-premium border">
      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight">Wallet Share Progression</h3>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Your percentage of total points pool over time</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:!h-[320px]">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorShare" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
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
              stroke="hsl(var(--primary))"
              style={{ fontSize: '10px', fontWeight: 500 }}
              tickFormatter={(value) => value.toFixed(4) + '%'}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              width={70}
              domain={[minShare - sharePadding, maxShare + sharePadding]}
              label={{ value: 'Wallet Share %', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--primary))', fontSize: '11px', fontWeight: 600 } }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary))' }} />
                      <span style={{ fontSize: '12px', color: 'hsl(var(--foreground))' }}>
                        <strong>Wallet Share:</strong> {data.shareFormatted}%
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            
            <Line 
              type="monotone" 
              dataKey="share" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3, stroke: 'hsl(var(--background))' }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Higher share = larger portion of total points pool (↑ = gaining share)
          </p>
        </div>
      </div>
    </Card>
  );
};