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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative p-4">
        {/* Header Row - Compact */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-primary/20 shimmer">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">Projections</h3>
              <p className="text-[9px] text-muted-foreground/50">Based on Season 2 rates</p>
            </div>
          </div>
          
          {/* Live SPK Price Badge */}
          {spkPrice && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <div className="relative">
                <TrendingUp className="w-3 h-3 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-green-400 rounded-full animate-pulse" />
              </div>
              <span className="text-[10px] font-semibold text-foreground tabular-nums">
                SPK ${spkPrice.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="flex items-center gap-6">
          {/* Slider Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Conversion Rate</span>
              <span className="text-xs font-bold text-primary tabular-nums">
                {conversionRate.toFixed(1)} SPK / 1M pts
              </span>
            </div>
            <Slider
              value={[conversionRate]}
              onValueChange={(value) => setConversionRate(value[0])}
              min={75}
              max={150}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/40">75</span>
              <span className="text-[9px] text-muted-foreground/40">150</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          {/* Results Section */}
          <div className="flex items-center gap-4">
            {/* Estimated SPK */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Coins className="w-3 h-3 text-primary/60" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Est. SPK</span>
              </div>
              <div className="text-lg font-bold text-foreground tabular-nums">
                {formattedSPK}
              </div>
            </div>
            
            {/* Estimated Value */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <DollarSign className="w-3 h-3 text-primary" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Est. Value</span>
              </div>
              <div className="text-lg font-bold text-primary tabular-nums">
                {dollarValue !== null ? `$${dollarValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Formula - Minimal */}
        <div className="mt-3 pt-2 border-t border-white/5">
          <p className="text-[9px] text-muted-foreground/40 text-center font-mono">
            {formattedPoints} ÷ 1M × {conversionRate.toFixed(1)} × ${spkPrice?.toFixed(4) || '0.00'}
          </p>
        </div>
      </div>
    </Card>
  );
};
