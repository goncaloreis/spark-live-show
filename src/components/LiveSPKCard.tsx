import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LiveSPKCardProps {
  spkPrice: number | null;
}

export const LiveSPKCard = ({ spkPrice }: LiveSPKCardProps) => {
  if (!spkPrice) return null;
  
  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 transition-all duration-500 p-4">
      <div className="flex items-center justify-center gap-2.5">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="relative">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-wider">Live SPK</span>
            <span className="text-lg font-bold text-gradient-static tabular-nums">${spkPrice.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
