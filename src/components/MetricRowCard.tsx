import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricRowCardProps {
  leftLabel: string;
  leftValue: string | number;
  leftChange?: number;
  leftSuffix?: string;
  rightLabel: string;
  rightValue: string | number;
  rightChange?: number;
  rightSuffix?: string;
}

export const MetricRowCard = ({
  leftLabel,
  leftValue,
  leftChange,
  leftSuffix = "",
  rightLabel,
  rightValue,
  rightChange,
  rightSuffix = "",
}: MetricRowCardProps) => {
  const renderMetric = (label: string, value: string | number, change?: number, suffix: string = "") => {
    const hasChange = change !== undefined && change !== 0;
    const isPositive = change && change > 0;
    
    // Format change value with thousands separators
    const formatChangeValue = (num: number) => {
      const absNum = Math.abs(num);
      if (suffix === '%') {
        return absNum.toFixed(2);
      }
      // For large numbers, use toLocaleString with 2 decimal places
      if (absNum >= 1000) {
        return absNum.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        });
      }
      return absNum.toFixed(2);
    };
    
    return (
      <div className="flex items-center justify-between flex-1 group/metric">
        <span className="metric-label text-[10px] transition-colors duration-200 group-hover/metric:text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="metric-value text-xl text-foreground transition-all duration-200 group-hover/metric:scale-105">
            {value}{suffix}
          </span>
          {hasChange && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-all duration-200 ${
              isPositive 
                ? 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/15' 
                : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/15'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-[10px] font-bold tabular-nums ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {isPositive ? '+' : ''}{typeof change === 'number' ? formatChangeValue(change) : change}
                {suffix}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 hover:shadow-lg transition-all duration-300 p-4 h-full">
      <div className="flex items-center gap-8 h-full">
        {renderMetric(leftLabel, leftValue, leftChange, leftSuffix)}
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        {renderMetric(rightLabel, rightValue, rightChange, rightSuffix)}
      </div>
    </Card>
  );
};
