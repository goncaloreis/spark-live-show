/**
 * Airdrop Projection Card with interactive conversion rate slider
 * Calculates SPK tokens based on: (walletPoints / 1M) × conversionRate × spkPrice
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { DollarSign, TrendingUp, Coins } from "lucide-react";
import { calculateSPKProjection, formatProjectionNumber } from "@/utils/walletCalculations";

interface AirdropProjectionCardProps {
  walletPoints: number;
  spkPrice: number | null;
}

export const AirdropProjectionCard = ({ walletPoints, spkPrice }: AirdropProjectionCardProps) => {
  const [conversionRate, setConversionRate] = useState(112.5);
  
  const { spkTokens, dollarValue } = calculateSPKProjection(
    walletPoints,
    conversionRate,
    spkPrice
  );

  const formattedPoints = formatProjectionNumber(walletPoints);
  const formattedSPK = formatProjectionNumber(spkTokens);
  
  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 transition-all duration-300 overflow-hidden">
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative p-5 sm:p-6">
        {/* Header with Title and Live SPK */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-primary/20 shimmer">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-foreground">Projections</h3>
              <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                Based on Season 2 conversion rates
              </p>
            </div>
          </div>
          
          {/* Live SPK Price Badge */}
          {spkPrice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="relative">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                SPK ${spkPrice.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Conversion Rate Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Conversion Rate</span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {conversionRate.toFixed(1)} SPK / 1M Points
            </span>
          </div>
          
          <div className="relative">
            <Slider
              value={[conversionRate]}
              onValueChange={(value) => setConversionRate(value[0])}
              min={75}
              max={150}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground/50">75</span>
              <span className="text-[10px] text-muted-foreground/50">112.5</span>
              <span className="text-[10px] text-muted-foreground/50">150</span>
            </div>
          </div>
        </div>

        {/* Projection Results */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Estimated SPK */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimated SPK</span>
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {formattedSPK}
            </div>
          </div>
          
          {/* Estimated Value */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimated Value</span>
            </div>
            <div className="text-2xl font-bold text-primary tabular-nums">
              {dollarValue !== null ? `$${dollarValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </div>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground/60 text-center font-mono">
            {formattedPoints} pts ÷ 1M × {conversionRate.toFixed(1)} SPK × ${spkPrice?.toFixed(4) || '0.00'}
          </p>
        </div>
      </div>
    </Card>
  );
};
