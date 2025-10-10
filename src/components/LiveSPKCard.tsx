import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LiveSPKCardProps {
  spkPrice: number | null;
}

export const LiveSPKCard = ({ spkPrice }: LiveSPKCardProps) => {
  if (!spkPrice) return null;
  
  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 transition-all duration-500 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-lg" />
      
      <div className="relative flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
          Live SPK
        </span>
        
        <div className="flex items-center gap-2.5 text-primary">
          <div className="relative">
            <TrendingUp className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
          </div>
          <span className="text-base font-bold tabular-nums text-foreground">
            ${spkPrice.toFixed(4)}
          </span>
        </div>
      </div>
    </Card>
  );
};
