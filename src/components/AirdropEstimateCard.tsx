import { TrendingUp } from "lucide-react";

interface AirdropEstimateCardProps {
  values: {
    "150M": string;
    "200M": string;
    "250M": string;
  };
  spkPrice: number | null;
}

export const AirdropEstimateCard = ({ values, spkPrice }: AirdropEstimateCardProps) => {
  const hasData = values["150M"] !== "-";
  
  return (
    <div className="flex flex-col h-full">
      {hasData ? (
        <>
          {/* Three Scenarios */}
          <div className="grid grid-cols-1 gap-2.5 flex-1">
            {/* 150M SPK */}
            <div className="group relative p-3 rounded-lg bg-card/40 border border-white/5 hover:border-white/10 hover:bg-card/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    150M SPK Airdrop
                  </div>
                  <div className="text-lg font-bold text-foreground/90 tabular-nums">
                    {values["150M"]}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Conservative</span>
                </div>
              </div>
            </div>

            {/* 200M SPK */}
            <div className="group relative p-3 rounded-lg bg-gradient-to-br from-primary/5 via-card/40 to-card/40 border border-primary/10 hover:border-primary/20 hover:from-primary/8 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">
                    200M SPK Airdrop
                  </div>
                  <div className="text-lg font-bold text-gradient-static tabular-nums">
                    {values["200M"]}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-primary/15 border border-primary/25">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Moderate</span>
                </div>
              </div>
            </div>

            {/* 250M SPK */}
            <div className="group relative p-3 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 hover:border-primary/30 hover:from-primary/15 hover:via-secondary/15 hover:to-primary/15 transition-all duration-300 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 shimmer" />
              
              <div className="relative flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider">
                    250M SPK Airdrop
                  </div>
                  <div className="text-lg font-bold text-gradient-static tabular-nums">
                    {values["250M"]}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)]">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Optimistic</span>
                </div>
              </div>
            </div>
          </div>

          {/* SPK Price Display - Moved to bottom */}
          {spkPrice && (
            <div className="flex items-center justify-center gap-2.5 pt-2.5 mt-2.5 border-t border-white/5">
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
          )}

          {/* Footer Note */}
          <div className="text-center pt-2">
            <p className="text-[9px] text-muted-foreground/50 font-medium leading-tight">
              Estimates based on your current pool share × total airdrop × live SPK price
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-12 space-y-3">
          <div className="text-2xl font-bold text-muted-foreground/20">—</div>
          <p className="text-sm text-muted-foreground/50">No projection data available</p>
          <p className="text-xs text-muted-foreground/40">Track a wallet to see estimates</p>
        </div>
      )}
    </div>
  );
};
