import { TrendingUp, TrendingDown, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  suffix?: string;
}

const MetricRow = ({ label, value, change, suffix = "" }: MetricProps) => {
  const hasChange = change !== undefined && change !== 0;
  const isPositive = change && change > 0;
  
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-b-0">
      <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2.5">
        <span className="text-lg font-bold text-foreground tabular-nums">
          {value}{suffix}
        </span>
        {hasChange && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
            isPositive 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={`text-[10px] font-bold tabular-nums ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : change}
              {suffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

interface MetricsCardProps {
  totalPoints: string;
  totalPointsChange?: number;
  walletPoints: string;
  walletPointsChange?: number;
  walletRank: string;
  walletRankChange?: number;
  totalWallets: string;
  totalWalletsChange?: number;
  walletShare: string;
  walletShareChange?: number;
  rankPercentile: string;
  rankPercentileChange?: number;
}

export const MetricsCard = ({
  totalPoints,
  totalPointsChange,
  walletPoints,
  walletPointsChange,
  walletRank,
  walletRankChange,
  totalWallets,
  totalWalletsChange,
  walletShare,
  walletShareChange,
  rankPercentile,
  rankPercentileChange,
}: MetricsCardProps) => {
  return (
    <Card className="card-premium border-white/5 group hover:border-primary/20 transition-all duration-500 h-full flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:scale-110 group-hover:border-primary/40 transition-all duration-500">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-bold text-base tracking-tight">Performance</h3>
        </div>
        
        {/* Metrics Grid */}
        <div className="relative flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div className="relative grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-1">
              <MetricRow 
                label="Total Points" 
                value={totalPoints} 
                change={totalPointsChange}
              />
              <MetricRow 
                label="Wallet Points" 
                value={walletPoints} 
                change={walletPointsChange}
              />
              <MetricRow 
                label="Wallet Rank" 
                value={walletRank} 
                change={walletRankChange}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-1 border-l border-white/5 pl-8">
              <MetricRow 
                label="Total Wallets" 
                value={totalWallets} 
                change={totalWalletsChange}
              />
              <MetricRow 
                label="Wallet Share" 
                value={walletShare} 
                change={walletShareChange}
                suffix="%"
              />
              <MetricRow 
                label="Rank Percentile" 
                value={rankPercentile} 
                change={rankPercentileChange}
                suffix="%"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
