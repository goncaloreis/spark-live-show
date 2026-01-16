/**
 * Main index page for Spark Points Tracker
 * Displays wallet tracking data and analytics
 */

import { useState, useCallback, lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { MetricRowCard } from "@/components/MetricRowCard";
import { PaceStatusCard } from "@/components/PaceStatusCard";
import { AirdropProjectionCard } from "@/components/AirdropProjectionCard";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { WalletSelector } from "@/components/WalletSelector";
import { MetricRowSkeleton, ChartSkeleton, ProjectionSkeleton } from "@/components/LoadingSkeleton";
import { Award, TrendingUp, DollarSign } from "lucide-react";
import sparkLogo from "@/assets/spark-logo.svg";
import { useWalletData } from "@/hooks/useWalletData";
import { APP_CONFIG } from "@/utils/constants";

// Lazy load heavy chart component to reduce initial bundle size
const CombinedChart = lazy(() => import("@/components/CombinedChart").then(module => ({ default: module.CombinedChart })));

/**
 * Main application page component
 */
const Index = () => {
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const {
    loading,
    hasSearched,
    stats,
    historyData,
    searchWallet
  } = useWalletData(selectedWallet);

  const handleWalletLoad = useCallback((wallet: string) => {
    setSelectedWallet(wallet);
    searchWallet(wallet);
  }, [searchWallet]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-mesh)' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-primary/10 rounded-full blur-[180px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[900px] h-[900px] bg-secondary/8 rounded-full blur-[160px] animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Refined Header */}
        <header className="border-b border-white/5 backdrop-blur-3xl bg-gradient-to-b from-card/40 to-transparent">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="max-w-5xl mx-auto">
              {/* Logo and Title */}
              <div className="flex items-center justify-center gap-4 sm:gap-5 mb-8 sm:mb-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-secondary rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-700" />
                  <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl border border-white/10 group-hover:scale-105 group-hover:border-primary/30 transition-all duration-500 shadow-elevated p-3 sm:p-4">
                    <img src={sparkLogo} alt="Spark" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(79,172,254,0.4)]" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                    <span className="text-gradient">{APP_CONFIG.APP_NAME.split(' ').slice(0, 2).join(' ')}</span>
                    <span className="text-muted-foreground/60"> | {APP_CONFIG.SEASON}</span>
                  </h1>
                  <p className="text-muted-foreground/70 text-xs sm:text-sm mt-2 font-medium tracking-wide">
                    {APP_CONFIG.APP_DESCRIPTION}
                  </p>
                </div>
              </div>

              {/* Manual wallet tracker button */}
              <div className="flex justify-center">
                <WalletSelector onWalletLoad={handleWalletLoad} loading={loading} />
              </div>
              
              {/* Wallet address display */}
              {selectedWallet && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/30 bg-card/30 backdrop-blur-xl">
                    <span className="text-xs text-muted-foreground">Wallet:</span>
                    <span className="font-mono text-xs font-medium text-foreground">
                      {selectedWallet.slice(0, 6)}...{selectedWallet.slice(-4)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Season Countdown Banner */}
        <div className="container mx-auto px-4 sm:px-6 -mt-4 sm:-mt-6 relative z-20">
          <div className="max-w-5xl mx-auto">
            <SeasonCountdown />
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">

          {/* Stats Grid */}
          {hasSearched && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Live Status Indicator */}
              {stats.lastUpdated !== "-" && (
                <div className="flex justify-center animate-in fade-in duration-700">
                  <div className="glass border border-primary/20 px-6 py-3 rounded-full shadow-elevated backdrop-blur-3xl group hover:border-primary/40 transition-all duration-500">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary animate-ping opacity-75" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-muted-foreground/70">Live Update:</span>
                        <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">{stats.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Section - Full Width Stack */}
              <div className="space-y-2">
                {/* Performance Header */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <Award className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-foreground">Performance</h3>
                    <p className="text-[9px] text-muted-foreground/50">Real-time metrics</p>
                  </div>
                </div>

                {/* Performance Metrics - Stacked Full Width */}
                <MetricRowCard 
                  leftLabel="Total Points"
                  leftValue={stats.totalPointsPool}
                  leftChange={stats.totalPointsPoolChange !== "-" ? parseFloat(stats.totalPointsPoolChange.replace(/,/g, '')) : undefined}
                  rightLabel="Total Wallets"
                  rightValue={stats.totalWallets}
                  rightChange={stats.totalWalletsChange !== "-" ? parseFloat(stats.totalWalletsChange) : undefined}
                />
                
                <MetricRowCard 
                  leftLabel="Wallet Points"
                  leftValue={stats.totalPoints}
                  leftChange={stats.pointsChange !== "-" ? parseFloat(stats.pointsChange.replace(/,/g, '')) : undefined}
                  rightLabel="Wallet Share"
                  rightValue={stats.marketShare.replace('%', '')}
                  rightChange={stats.shareChangeObj.value !== "-" ? parseFloat(stats.shareChangeObj.value.replace('%', '')) * (stats.shareChangeObj.direction === 'down' ? -1 : 1) : undefined}
                  rightSuffix="%"
                />
                
                <MetricRowCard 
                  leftLabel="Wallet Rank"
                  leftValue={stats.rank !== "-" ? `#${stats.rank}` : "-"}
                  leftChange={stats.rankChange.value !== "-" ? parseFloat(stats.rankChange.value) * (stats.rankChange.direction === 'down' ? -1 : 1) : undefined}
                  rightLabel="Rank Percentile"
                  rightValue={stats.percentile.replace('%', '')}
                  rightChange={stats.percentileChange.value !== "-" ? parseFloat(stats.percentileChange.value.replace('%', '')) * (stats.percentileChange.direction === 'down' ? -1 : 1) : undefined}
                  rightSuffix="%"
                />
                
                <PaceStatusCard shareChangeDirection={stats.shareChangeObj.direction} />
              </div>

              {/* Projections Section - Full Width */}
              <AirdropProjectionCard 
                walletPoints={parseFloat(stats.totalPoints.replace(/,/g, '')) || 0}
                spkPrice={stats.spkPrice}
              />

              {/* Combined Performance Chart */}
              <div className="animate-in fade-in duration-700 delay-200">
                <Suspense fallback={<ChartSkeleton />}>
                  <CombinedChart data={historyData} loading={loading} />
                </Suspense>
              </div>


            </div>
          )}

          {/* Feature Highlights - Empty State */}
          {!hasSearched && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 animate-in fade-in duration-700">
                <h3 className="text-2xl font-semibold mb-2">Why Track Your Spark Points?</h3>
                <p className="text-muted-foreground">Click "Track Wallet" above to view your real-time DeFi performance</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Track Progress</h4>
                  <p className="text-sm text-muted-foreground">Monitor your points growth over time with detailed charts</p>
                </Card>
                
                <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-secondary" />
                  </div>
                  <h4 className="font-semibold mb-2">Compare Rankings</h4>
                  <p className="text-sm text-muted-foreground">See how you rank against thousands of other wallets</p>
                </Card>
                
                <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Airdrop Projections</h4>
                  <p className="text-sm text-muted-foreground">Estimate your potential SPK rewards across multiple scenarios</p>
                </Card>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-20 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>
                  Built for tracking Spark protocol points •{" "}
                  <a 
                    href="https://github.com/goncaloreis/spark-points-agent" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-glow transition-colors"
                  >
                    View on GitHub
                  </a>
                </p>
              </div>
              <div className="text-xs text-muted-foreground/70 max-w-2xl mx-auto">
                <p className="font-medium text-muted-foreground/90 mb-1">Privacy Notice</p>
                <p>
                  All wallet addresses and points data tracked on this platform are publicly visible. 
                  By searching a wallet, you acknowledge that its activity and rankings will be stored 
                  and displayed as part of the public leaderboard. This is similar to how the official 
                  Spark.fi leaderboard operates.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
