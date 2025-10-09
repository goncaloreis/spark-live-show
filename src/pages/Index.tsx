import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { ProgressChart } from "@/components/ProgressChart";
import { RankChart } from "@/components/RankChart";
import { KPICard } from "@/components/KPICard";
import { AirdropEstimateCard } from "@/components/AirdropEstimateCard";
import { Star, TrendingUp, Users, Award, Search, DollarSign, PieChart, Zap } from "lucide-react";
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
    marketShare: "-",
    shareChange: "-",
    paceStatus: "NEUTRAL",
          airdropEstimates: {
            "150M": { low: "-", high: "-" },
            "200M": { low: "-", high: "-" },
            "250M": { low: "-", high: "-" }
          }
  });

  const handleSearch = async () => {
    console.log('handleSearch called with address:', walletAddress);
    
    if (!walletAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
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
          wallet_address: walletAddress,
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
        let marketShare = "-";
        let shareChange = "-";
        let paceStatus = "NEUTRAL";
        
        if (history.length >= 2) {
          const latest = Number(history[history.length - 1].total_points);
          const previous = Number(history[history.length - 2].total_points);
          const pointsDiff = latest - previous;
          const growth = ((latest - previous) / previous * 100).toFixed(2);
          const growthNum = parseFloat(growth);
          pointsGrowth = growthNum > 0 ? `+${growth}%` : `${growth}%`;
          pointsChange = pointsDiff > 0 ? `+${pointsDiff.toLocaleString()}` : pointsDiff.toLocaleString();
          
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
            
            // Pace calculation (improving rank = gaining)
            paceStatus = rankDiff > 0 ? "GAINING" : rankDiff < 0 ? "LOSING" : "STABLE";
          }
        }

        // Calculate global average from actual total points pool
        const currentPoints = Number(data.latest.total_points);
        const totalWallets = data.latest.total_wallets || 0;
        const totalPointsPool = data.latest.total_points_pool ? Number(data.latest.total_points_pool) : null;
        
        // Calculate global average: total pool / total wallets
        const globalAverage = totalPointsPool && totalWallets > 0 
          ? totalPointsPool / totalWallets 
          : 0;
        
        if (totalWallets > 0 && totalPointsPool) {
          const share = (currentPoints / totalPointsPool) * 100;
          marketShare = share.toFixed(6) + "%";
          
          // Share change (if we have history)
          if (history.length >= 2 && history[history.length - 2].total_points_pool) {
            const prevPoints = Number(history[history.length - 2].total_points);
            const prevPool = Number(history[history.length - 2].total_points_pool);
            const prevShare = (prevPoints / prevPool) * 100;
            const shareDiff = share - prevShare;
            shareChange = shareDiff >= 0 ? `+${shareDiff.toFixed(7)}%` : `${shareDiff.toFixed(7)}%`;
          }
        }

        // Financial projections based on market share
        // Token price range: $0.05 - $0.15 per SPK
        const share = parseFloat(marketShare) / 100 || 0;
        const lowPrice = 0.05;
        const highPrice = 0.15;
        
        const airdropEstimates = {
          "150M": share > 0 ? {
            low: `$${Math.round(150000000 * share * lowPrice).toLocaleString()}`,
            high: `$${Math.round(150000000 * share * highPrice).toLocaleString()}`
          } : { low: "-", high: "-" },
          "200M": share > 0 ? {
            low: `$${Math.round(200000000 * share * lowPrice).toLocaleString()}`,
            high: `$${Math.round(200000000 * share * highPrice).toLocaleString()}`
          } : { low: "-", high: "-" },
          "250M": share > 0 ? {
            low: `$${Math.round(250000000 * share * lowPrice).toLocaleString()}`,
            high: `$${Math.round(250000000 * share * highPrice).toLocaleString()}`
          } : { low: "-", high: "-" }
        };

        // Format last updated time
        const lastUpdated = new Date(data.latest.created_at).toLocaleString();
        
        // Update stats with real data
        setStats({
          totalPoints: Number(data.latest.total_points).toLocaleString(),
          rank: data.latest.rank ? `${data.latest.rank}` : '-',
          percentile: data.latest.percentile || '-',
          totalWallets: data.latest.total_wallets ? data.latest.total_wallets.toLocaleString() : '-',
          pointsGrowth,
          lastUpdated,
          pointsChange,
          rankChange,
          marketShare,
          shareChange,
          paceStatus,
          airdropEstimates
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
          marketShare: "-",
          shareChange: "-",
          paceStatus: "NEUTRAL",
          airdropEstimates: {
            "150M": { low: "-", high: "-" },
            "200M": { low: "-", high: "-" },
            "250M": { low: "-", high: "-" }
          }
        });
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast.error(`Failed to load wallet data: ${error.message || 'Please try again'}`);
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
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-glow to-secondary rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-700" />
                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl card-premium border border-border group-hover:scale-110 transition-all duration-500">
                    <Star className="w-6 h-6 sm:w-8 sm:h-8 text-foreground fill-foreground" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                    Spark Points | Season 2
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-normal">
                    Track Your DeFi Performance
                  </p>
                </div>
              </div>

              {/* Premium Search Interface */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary-glow to-secondary rounded-2xl blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none" />
                <Card className="relative card-premium border shadow-elevated">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex-1 relative z-10">
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
                      <Button 
                        onClick={(e) => {
                          console.log('Button clicked!', { loading, walletAddress });
                          e.preventDefault();
                          if (!loading) {
                            handleSearch();
                          }
                        }}
                        disabled={loading}
                        type="button"
                        size="lg"
                        className="relative z-20 h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-7xl">

          {/* Stats Grid */}
          {hasSearched && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

              {/* KPI Cards Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="card-premium border-white/5 group hover:border-primary/20 transition-all duration-500">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:scale-110 group-hover:border-primary/40 transition-all duration-500">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg tracking-tight">Performance</h3>
                    </div>
                    <div className="space-y-1">
                      <KPICard 
                        label="Current Rank" 
                        value={stats.rank !== "-" ? `#${stats.rank}` : "-"}
                        change={stats.rankChange.value !== "-" ? {
                          value: `${stats.rankChange.value} ${stats.rankChange.direction === 'up' ? 'UP' : 'DOWN'}`,
                          direction: stats.rankChange.direction
                        } : undefined}
                      />
                      <KPICard 
                        label="Current Points" 
                        value={stats.totalPoints}
                        change={stats.pointsChange !== "-" ? {
                          value: stats.pointsChange,
                          direction: stats.pointsChange.startsWith('+') ? 'up' : stats.pointsChange.startsWith('-') ? 'down' : 'neutral'
                        } : undefined}
                      />
                      <KPICard 
                        label="Percentile" 
                        value={stats.percentile !== "-" ? `Top ${stats.percentile}` : "-"}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="card-premium border-white/5 group hover:border-secondary/20 transition-all duration-500">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 group-hover:scale-110 group-hover:border-secondary/40 transition-all duration-500">
                        <PieChart className="w-5 h-5 text-secondary" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg tracking-tight">Market Position</h3>
                    </div>
                    <div className="space-y-1">
                      <KPICard 
                        label="Pool Share" 
                        value={stats.marketShare}
                      />
                       <KPICard 
                        label="Share Change" 
                        value={stats.shareChange}
                        change={stats.shareChange !== "-" ? {
                          value: stats.shareChange,
                          direction: stats.shareChange.startsWith('+') ? 'up' : stats.shareChange.startsWith('-') ? 'down' : 'neutral'
                        } : undefined}
                      />
                      <KPICard 
                        label="Pace Status" 
                        value={stats.paceStatus}
                        change={stats.paceStatus === "GAINING" ? {
                          value: "GAINING",
                          direction: 'up'
                        } : stats.paceStatus === "LOSING" ? {
                          value: "LOSING",
                          direction: 'down'
                        } : undefined}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="card-premium border-white/5 group hover:border-primary/20 transition-all duration-500">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 border border-primary/20 group-hover:scale-110 group-hover:border-primary/40 transition-all duration-500 shimmer">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg tracking-tight">Projections</h3>
                    </div>
                    <div className="space-y-1">
                      <AirdropEstimateCard 
                        label="150M SPK" 
                        lowValue={stats.airdropEstimates["150M"].low}
                        highValue={stats.airdropEstimates["150M"].high}
                      />
                      <AirdropEstimateCard 
                        label="200M SPK" 
                        lowValue={stats.airdropEstimates["200M"].low}
                        highValue={stats.airdropEstimates["200M"].high}
                      />
                      <AirdropEstimateCard 
                        label="250M SPK" 
                        lowValue={stats.airdropEstimates["250M"].low}
                        highValue={stats.airdropEstimates["250M"].high}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-700 delay-200">
                <ProgressChart data={historyData} loading={loading} />
                <RankChart data={historyData} loading={loading} />
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
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Automated Updates</h4>
                  <p className="text-sm text-muted-foreground">Set up hourly tracking with our Python agent</p>
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
