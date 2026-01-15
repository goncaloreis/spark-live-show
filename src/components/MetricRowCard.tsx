import { memo } from "react";
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

export const MetricRowCard = memo(({
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
    const hasChange = change !== undefined;
    const isPositive = change !== undefined && change > 0;
    const isNeutral = change === 0;
    
    const formatChangeValue = (num: number) => {
      const absNum = Math.abs(num);
      if (suffix === '%') {
        return Math.round(absNum).toString();
      }
      return Math.round(absNum).toLocaleString('en-US');
    };
    
    return (
      <div className="flex items-center justify-between flex-1 group/metric">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground tabular-nums">
            {value}{suffix}
          </span>
          {hasChange && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tabular-nums ${
              isNeutral
                ? 'bg-muted/20 text-muted-foreground'
                : isPositive 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-red-500/10 text-red-500'
            }`}>
              {!isNeutral && (isPositive ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              ))}
              {isPositive ? '+' : ''}{typeof change === 'number' ? formatChangeValue(change) : change}{suffix}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="card-premium border-white/5 hover:border-primary/20 transition-all duration-300 p-3">
      <div className="flex items-center gap-6">
        {renderMetric(leftLabel, leftValue, leftChange, leftSuffix)}
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        {renderMetric(rightLabel, rightValue, rightChange, rightSuffix)}
      </div>
    </Card>
  );
});
