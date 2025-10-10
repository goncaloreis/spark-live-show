import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LiveSPKCardProps {
  spkPrice: number | null;
}

export const LiveSPKCard = ({ spkPrice }: LiveSPKCardProps) => {
  if (!spkPrice) return null;
  
  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 hover:shadow-lg transition-all duration-300 p-4 h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-lg" />
      
      <div className="relative flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <div className="relative">
            <TrendingUp className="w-4 h-4 text-primary transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
          </div>
          <span className="metric-label text-[10px]">
            Live SPK
          </span>
        </div>
        
        <div className="metric-value text-xl text-foreground transition-all duration-200 group-hover:scale-105 group-hover:text-primary">
          ${spkPrice.toFixed(4)}
        </div>
      </div>
    </Card>
  );
};
