import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { CombinedChart } from "@/components/CombinedChart";
import { KPICard } from "@/components/KPICard";
import { ProjectionCard } from "@/components/ProjectionCard";
import { MetricRowCard } from "@/components/MetricRowCard";
import { PaceStatusCard } from "@/components/PaceStatusCard";
import { LiveSPKCard } from "@/components/LiveSPKCard";
import { TrendingUp, Users, Award, Search, DollarSign, PieChart } from "lucide-react";
import sparkLogo from "@/assets/spark-logo.svg";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalPoints: "0",
    rank: "-",
    percentile: "-",
    totalWallets: "-",
    pointsGrowth: "-",
    lastUpdated: "-",
    pointsChange: "-",
    rankChange: { value: "-", direction: 'neutral' as 'up' | 'down' | 'neutral' },
    percentileChange: { value: "-", direction: 'neutral' as 'up' | 'down' | 'neutral' },
    marketShare: "-",
    shareChange: "-",
    shareChangeObj: { value: "-", direction: 'neutral' as 'up' | 'down' | 'neutral' },
    paceStatus: "NEUTRAL",
    airdropEstimates: {
      "150M": "-",
      "200M": "-",
      "250M": "-"
    },
    spkPrice: null as number | null,
    totalPointsPool: "-",
    totalPointsPoolChange: "-",
    totalWalletsChange: "-",
    poolShareChangeNumeric: 0
  });

  const handleSearch = async () => {
    console.log('handleSearch called with address:', walletAddress);
    
    if (!walletAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    // Sanitize wallet address
    const sanitizedAddress = walletAddress.trim().toLowerCase();

    if (!/^0x[a-fA-F0-9]{40}$/.test(sanitizedAddress)) {
      toast.error("Invalid wallet address format");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      console.log('Calling track-wallet function...');
      // Call the backend function to get wallet data
      const { data, error } = await supabase.functions.invoke('track-wallet', {
        body: { 
          wallet_address: sanitizedAddress,
          action: 'get'
        }
      });

      console.log('Response received:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Received wallet data:', data);

      if (data.has_data && data.latest) {
        // Calculate points growth and advanced metrics
        const history = data.history || [];
        let pointsGrowth = "-";
        let pointsChange = "-";
        let rankChange = { value: "-", direction: 'neutral' as 'up' | 'down' | 'neutral' };
        let percentileChange = { value: "-", direction: 'neutral' as 'up' | 'down' | 'neutral' };
        let marketShare = "-";
        let shareChange = "-";
        let shareChangeObj = { value: "-", direction: 'neutral' as 'up' | 'down' | 'neutral' };
        let paceStatus = "NEUTRAL";
        let totalPointsPoolChange = "-";
        let totalWalletsChange = "-";
        let poolShareChangeNumeric = 0;
        
        if (history.length >= 2) {
          const latest = Number(history[history.length - 1].total_points);
          const previous = Number(history[history.length - 2].total_points);
          const pointsDiff = latest - previous;
          const growth = ((latest - previous) / previous * 100).toFixed(2);
          const growthNum = parseFloat(growth);
          pointsGrowth = growthNum > 0 ? `+${growth}%` : `${growth}%`;
          
          // Only set pointsChange if there's an actual change
          if (pointsDiff !== 0) {
            pointsChange = pointsDiff > 0 ? `+${pointsDiff.toLocaleString()}` : pointsDiff.toLocaleString();
          }
          
          // Rank change
          const latestRank = history[history.length - 1].rank;
          const previousRank = history[history.length - 2].rank;
          if (latestRank && previousRank) {
            const rankDiff = previousRank - latestRank;
            if (rankDiff !== 0) {
              rankChange = {
                value: `${Math.abs(rankDiff)}`,
                direction: rankDiff > 0 ? 'up' : 'down'
              };
            }
          }
        }

        // Calculate global average from actual total points pool
        const currentPoints = Number(data.latest.total_points);
        const totalWallets = data.latest.total_wallets || 0;
        
        // Find the most recent valid total_points_pool from history (not 0 or null)
        let totalPointsPool: number | null = null;
        let prevTotalPointsPool: number | null = null;
        for (let i = history.length - 1; i >= 0; i--) {
          const poolValue = history[i].total_points_pool;
          if (poolValue && Number(poolValue) > 0) {
            if (!totalPointsPool) {
              totalPointsPool = Number(poolValue);
            } else if (!prevTotalPointsPool) {
              prevTotalPointsPool = Number(poolValue);
              break;
            }
          }
        }
        
        // Calculate total points pool change
        if (totalPointsPool && prevTotalPointsPool) {
          const poolDiff = totalPointsPool - prevTotalPointsPool;
          if (poolDiff !== 0) {
            totalPointsPoolChange = poolDiff > 0 ? `+${poolDiff.toLocaleString()}` : poolDiff.toLocaleString();
          }
        }
        
        // Calculate total wallets change
        if (history.length >= 2) {
          const latestWallets = history[history.length - 1].total_wallets;
          const prevWallets = history[history.length - 2].total_wallets;
          if (latestWallets && prevWallets) {
            const walletsDiff = latestWallets - prevWallets;
            if (walletsDiff !== 0) {
              totalWalletsChange = walletsDiff > 0 ? `+${walletsDiff}` : `${walletsDiff}`;
            }
          }
        }
        
        // Calculate percentile change if we have history and rank data
        if (history.length >= 2 && totalWallets > 0) {
          const latestRank = history[history.length - 1].rank;
          const previousRank = history[history.length - 2].rank;
          
          if (latestRank && previousRank) {
            const currentPercentile = ((totalWallets - latestRank) / totalWallets) * 100;
            const previousPercentile = ((totalWallets - previousRank) / totalWallets) * 100;
            const percentileDiff = currentPercentile - previousPercentile;
            
            if (Math.abs(percentileDiff) > 0.01) {
              percentileChange = {
                value: `${Math.abs(percentileDiff).toFixed(2)}%`,
                direction: percentileDiff > 0 ? 'up' : 'down'
              };
            }
          }
        }
        
        // Calculate global average: total pool / total wallets
        const globalAverage = totalPointsPool && totalWallets > 0 
          ? totalPointsPool / totalWallets 
          : 0;
        
        if (totalWallets > 0 && totalPointsPool) {
          const share = (currentPoints / totalPointsPool) * 100;
          marketShare = share.toFixed(6) + "%";
          
          // Share change - find previous valid pool data
          let prevValidPool: number | null = null;
          let prevValidPoints: number | null = null;
          
          for (let i = history.length - 2; i >= 0; i--) {
            const poolValue = history[i].total_points_pool;
            if (poolValue && Number(poolValue) > 0) {
              prevValidPool = Number(poolValue);
              prevValidPoints = Number(history[i].total_points);
              break;
            }
          }
          
          if (prevValidPool && prevValidPoints) {
            const prevShare = (prevValidPoints / prevValidPool) * 100;
            const shareDiff = share - prevShare;
            poolShareChangeNumeric = shareDiff;
            shareChange = shareDiff >= 0 ? `+${shareDiff.toFixed(7)}%` : `${shareDiff.toFixed(7)}%`;
            
            // Create change object for Pool Share indicator - only if there's meaningful change
            if (Math.abs(shareDiff) > 0.0000001) {
              shareChangeObj = {
                value: `${Math.abs(shareDiff).toFixed(7)}%`,
                direction: shareDiff > 0 ? 'up' : shareDiff < 0 ? 'down' : 'neutral'
              };
            }
            
            // Pace Status calculation based on pool share changes (more accurate than rank)
            // Increasing share = gaining ground, decreasing share = losing ground
            if (shareDiff > 0.0000001) {
              paceStatus = "GAINING";
            } else if (shareDiff < -0.0000001) {
              paceStatus = "LOSING";
            } else {
              paceStatus = "STABLE";
            }
          }
        }

        // Fetch SPK price with caching
        let spkPrice: number | null = null;
        try {
          const { data: priceData, error: priceError } = await supabase.functions.invoke('get-spk-price');
          if (!priceError && priceData?.price) {
            spkPrice = Number(priceData.price);
          }
        } catch (priceError) {
          console.error('Error code: PRICE_FETCH_FAILED');
        }

        // Financial projections based on market share and current SPK price
        const share = parseFloat(marketShare) / 100 || 0;
        const effectivePrice = spkPrice || 0.07; // Fallback to $0.07 if price fetch fails
        
        const airdropEstimates = share > 0 ? {
          "150M": `$${Math.round(150000000 * share * effectivePrice).toLocaleString()}`,
          "200M": `$${Math.round(200000000 * share * effectivePrice).toLocaleString()}`,
          "250M": `$${Math.round(250000000 * share * effectivePrice).toLocaleString()}`
        } : {
          "150M": "-",
          "200M": "-",
          "250M": "-"
        };

        // Format last updated time
        const lastUpdated = new Date(data.latest.created_at).toLocaleString();
        
        // Update stats with real data
        setStats({
          totalPoints: Number(data.latest.total_points).toLocaleString(),
          rank: data.latest.rank ? `${data.latest.rank}` : '-',
          percentile: data.latest.percentile ? data.latest.percentile.replace('Top ', '') : '-',
          totalWallets: data.latest.total_wallets ? data.latest.total_wallets.toLocaleString() : '-',
          pointsGrowth,
          lastUpdated,
          pointsChange,
          rankChange,
          percentileChange,
          marketShare,
          shareChange,
          shareChangeObj,
          paceStatus,
          airdropEstimates,
          spkPrice,
          totalPointsPool: totalPointsPool ? totalPointsPool.toLocaleString() : '-',
          totalPointsPoolChange,
          totalWalletsChange,
          poolShareChangeNumeric
        });
        
        // Update history for chart with global average
        setHistoryData(history.map(item => ({
          ...item,
          globalAverage
        })));
        
        toast.success("Wallet data loaded successfully");
      } else {
        toast.info("No data found for this wallet yet. Connect your Python agent to start tracking!");
        setStats({
          totalPoints: "0",
          rank: "-",
          percentile: "-",
          totalWallets: "-",
          pointsGrowth: "-",
          lastUpdated: "-",
          pointsChange: "-",
          rankChange: { value: "-", direction: 'neutral' },
          percentileChange: { value: "-", direction: 'neutral' },
          marketShare: "-",
          shareChange: "-",
          shareChangeObj: { value: "-", direction: 'neutral' },
          paceStatus: "NEUTRAL",
          airdropEstimates: {
            "150M": "-",
            "200M": "-",
            "250M": "-"
          },
          spkPrice: null,
          totalPointsPool: "-",
          totalPointsPoolChange: "-",
          totalWalletsChange: "-",
          poolShareChangeNumeric: 0
        });
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Unable to load wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                    <span className="text-gradient">Spark Points</span>
                    <span className="text-muted-foreground/60"> | Season 2</span>
                  </h1>
                  <p className="text-muted-foreground/70 text-xs sm:text-sm mt-2 font-medium tracking-wide">
                    Real-Time DeFi Performance Analytics
                  </p>
                </div>
              </div>

              {/* Premium Search Interface */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary-glow to-secondary rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none" />
                <Card className="relative card-premium border shadow-elevated">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-30">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Enter wallet address (0x...)"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                          className="h-12 sm:h-14 text-sm sm:text-base focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-300"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={(e) => {
                            console.log('Track Wallet clicked!', { loading, walletAddress });
                            e.preventDefault();
                            if (!loading) {
                              handleSearch();
                            }
                          }}
                          disabled={loading}
                          type="button"
                          size="lg"
                          className="flex-1 sm:flex-none h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                              <span className="hidden sm:inline">Analyzing...</span>
                              <span className="sm:hidden">Loading...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              <span className="hidden sm:inline">Track Wallet</span>
                              <span className="sm:hidden">Track</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-5">
                      <div className="h-px w-8 bg-gradient-to-r from-transparent via-border to-transparent" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground/50 font-medium">
                        Powered by{" "}
                        <a 
                          href="https://points.spark.fi/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary/80 hover:text-primary transition-colors font-semibold"
                        >
                          points.spark.fi
                        </a>
                      </p>
                      <div className="h-px w-8 bg-gradient-to-l from-transparent via-border to-transparent" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </header>

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

              {/* KPI Cards Section - Matrix Layout */}
              <div className="space-y-3">
                {/* Headers Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-3 flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                      <Award className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-base tracking-tight">Performance</h3>
                  </div>
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-primary/20 shimmer">
                        <DollarSign className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-bold text-base tracking-tight">Projections</h3>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 font-medium leading-tight text-right">
                      Pool share × airdrop × live SPK
                    </p>
                  </div>
                </div>

                {/* 3x3 Matrix: 3 rows with aligned cards */}
                <div className="space-y-2">
                  {/* Row 1: Total Points + Total Wallets | Conservative */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                    <div className="lg:col-span-3">
                      <MetricRowCard 
                        leftLabel="Total Points"
                        leftValue={stats.totalPointsPool}
                        leftChange={stats.totalPointsPoolChange !== "-" ? parseFloat(stats.totalPointsPoolChange.replace(/,/g, '')) : undefined}
                        rightLabel="Total Wallets"
                        rightValue={stats.totalWallets}
                        rightChange={stats.totalWalletsChange !== "-" ? parseFloat(stats.totalWalletsChange) : undefined}
                      />
                    </div>
                    <ProjectionCard 
                      label="150M SPK Airdrop"
                      value={stats.airdropEstimates["150M"]}
                      badge="Conservative"
                      variant="conservative"
                    />
                  </div>

                  {/* Row 2: Wallet Points + Wallet Share | Moderate */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                    <div className="lg:col-span-3">
                      <MetricRowCard 
                        leftLabel="Wallet Points"
                        leftValue={stats.totalPoints}
                        leftChange={stats.pointsChange !== "-" ? parseFloat(stats.pointsChange.replace(/,/g, '')) : undefined}
                        rightLabel="Wallet Share"
                        rightValue={stats.marketShare.replace('%', '')}
                        rightChange={stats.shareChangeObj.value !== "-" ? parseFloat(stats.shareChangeObj.value.replace('%', '')) * (stats.shareChangeObj.direction === 'down' ? -1 : 1) : undefined}
                        rightSuffix="%"
                      />
                    </div>
                    <ProjectionCard 
                      label="200M SPK Airdrop"
                      value={stats.airdropEstimates["200M"]}
                      badge="Moderate"
                      variant="moderate"
                    />
                  </div>

                  {/* Row 3: Wallet Rank + Rank Percentile | Optimistic */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                    <div className="lg:col-span-3">
                      <MetricRowCard 
                        leftLabel="Wallet Rank"
                        leftValue={stats.rank !== "-" ? `#${stats.rank}` : "-"}
                        leftChange={stats.rankChange.value !== "-" ? parseFloat(stats.rankChange.value) * (stats.rankChange.direction === 'down' ? -1 : 1) : undefined}
                        rightLabel="Rank Percentile"
                        rightValue={stats.percentile.replace('%', '')}
                        rightChange={stats.percentileChange.value !== "-" ? parseFloat(stats.percentileChange.value.replace('%', '')) * (stats.percentileChange.direction === 'down' ? -1 : 1) : undefined}
                        rightSuffix="%"
                      />
                    </div>
                    <ProjectionCard 
                      label="250M SPK Airdrop"
                      value={stats.airdropEstimates["250M"]}
                      badge="Optimistic"
                      variant="optimistic"
                    />
                  </div>
                </div>

                {/* Bottom Row: Pace Status + Live SPK */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                  <div className="lg:col-span-3">
                    <PaceStatusCard poolShareChange={stats.poolShareChangeNumeric} />
                  </div>
                  <LiveSPKCard spkPrice={stats.spkPrice} />
                </div>
              </div>

              {/* Combined Performance Chart */}
              <div className="animate-in fade-in duration-700 delay-200">
                <CombinedChart data={historyData} loading={loading} />
              </div>

            </div>
          )}

          {/* Feature Highlights - Empty State */}
          {!hasSearched && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 animate-in fade-in duration-700">
                <h3 className="text-2xl font-semibold mb-2">Why Track Your Spark Points?</h3>
                <p className="text-muted-foreground">Real-time insights into your DeFi performance</p>
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
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Automated Updates</h4>
                  <p className="text-sm text-muted-foreground">Hourly tracking via GitHub Actions automation</p>
                </Card>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-20 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-sm text-muted-foreground">
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
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
