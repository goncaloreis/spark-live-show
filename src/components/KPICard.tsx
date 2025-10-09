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
    <div className="group flex justify-between items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-200 rounded-lg px-2 -mx-2">
      <span className="text-sm text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {value}
          {suffix && <span className="text-sm text-muted-foreground/60 ml-1 font-normal">{suffix}</span>}
        </span>
        {change && change.direction !== 'neutral' && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm transition-all duration-200 ${
            change.direction === 'up' 
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
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
