import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
  };
  suffix?: string;
}

export const KPICard = ({ label, value, change, suffix }: KPICardProps) => {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">
          {value}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </span>
        {change && change.direction !== 'neutral' && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            change.direction === 'up' 
              ? 'bg-emerald-500/10 text-emerald-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            {change.direction === 'up' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {change.value}
          </span>
        )}
      </div>
    </div>
  );
};
