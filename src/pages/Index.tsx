import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { ProgressChart } from "@/components/ProgressChart";
import { RankChart } from "@/components/RankChart";
import { KPICard } from "@/components/KPICard";
import { Sparkles, TrendingUp, Users, Award, Search, DollarSign, PieChart, Zap } from "lucide-react";
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
      "150M": "-",
      "200M": "-",
      "250M": "-",
      "300M": "-"
    }
  });

  const handleSearch = async () => {
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
      // Call the backend function to get wallet data
      const { data, error } = await supabase.functions.invoke('track-wallet', {
        body: { 
          wallet_address: walletAddress,
          action: 'get'
        }
      });

      if (error) throw error;

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

        // Market share calculation (approximate)
        const currentPoints = Number(data.latest.total_points);
        const totalWallets = data.latest.total_wallets || 0;
        if (totalWallets > 0) {
          const estimatedTotalPoints = totalWallets * 1000000; // rough estimate
          const share = (currentPoints / estimatedTotalPoints) * 100;
          marketShare = share.toFixed(6) + "%";
          
          // Share change (if we have history)
          if (history.length >= 2) {
            const prevPoints = Number(history[history.length - 2].total_points);
            const prevShare = (prevPoints / estimatedTotalPoints) * 100;
            const shareDiff = share - prevShare;
            shareChange = shareDiff >= 0 ? `+${shareDiff.toFixed(7)}%` : `${shareDiff.toFixed(7)}%`;
          }
        }

        // Financial projections based on market share
        const share = parseFloat(marketShare) / 100 || 0;
        const airdropEstimates = {
          "150M": share > 0 ? `€${(150000000 * share * 0.001).toFixed(2)}` : "-",
          "200M": share > 0 ? `€${(200000000 * share * 0.001).toFixed(2)}` : "-",
          "250M": share > 0 ? `€${(250000000 * share * 0.001).toFixed(2)}` : "-",
          "300M": share > 0 ? `€${(300000000 * share * 0.001).toFixed(2)}` : "-"
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
        
        // Update history for chart
        setHistoryData(history);
        
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
            "150M": "-",
            "200M": "-",
            "250M": "-",
            "300M": "-"
          }
        });
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error("Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-primary/20 rounded-full blur-[150px] opacity-30" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[150px] opacity-20" />
      </div>

      <div className="relative">
        {/* Hero Section with Search */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              {/* Logo and Title */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-glow animate-in zoom-in duration-500">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                    Spark Points Tracker
                  </h1>
                  <p className="text-muted-foreground mt-2">Monitor your DeFi rewards in real-time</p>
                </div>
              </div>

              {/* Prominent Search Bar */}
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl" />
                  <Card className="relative border-2 border-primary/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm shadow-2xl">
                    <div className="p-8">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter wallet address (0x...)"
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="h-14 text-lg bg-input/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>
                        <Button 
                          onClick={handleSearch}
                          disabled={loading}
                          size="lg"
                          className="h-14 px-12 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all hover:scale-105"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="w-5 h-5 mr-2" />
                              Track Wallet
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-center mt-4 text-muted-foreground">
                        Data sourced from{" "}
                        <a 
                          href="https://points.spark.fi/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-glow transition-colors font-medium"
                        >
                          points.spark.fi
                        </a>
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">

          {/* Stats Grid */}
          {hasSearched && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Last Updated Badge */}
              {stats.lastUpdated !== "-" && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Last updated: <span className="text-foreground font-medium">{stats.lastUpdated}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* KPIs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg">Your KPIs</h3>
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
                        label="Rank Percentile" 
                        value={stats.percentile !== "-" ? `Top ${stats.percentile}` : "-"}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <PieChart className="w-4 h-4 text-secondary" />
                      </div>
                      <h3 className="font-bold text-lg">Market Share</h3>
                    </div>
                    <div className="space-y-1">
                      <KPICard 
                        label="Your Share of Pool" 
                        value={stats.marketShare}
                      />
                      <KPICard 
                        label="Share Change" 
                        value={stats.shareChange}
                        change={stats.shareChange !== "-" && stats.shareChange.startsWith('+') ? {
                          value: stats.shareChange,
                          direction: 'up'
                        } : undefined}
                      />
                      <KPICard 
                        label="Pace vs. Ecosystem" 
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

                <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg">Financial Projections</h3>
                    </div>
                    <div className="space-y-1">
                      <KPICard 
                        label="150M Airdrop Est." 
                        value={stats.airdropEstimates["150M"]}
                      />
                      <KPICard 
                        label="200M Airdrop Est." 
                        value={stats.airdropEstimates["200M"]}
                      />
                      <KPICard 
                        label="250M Airdrop Est." 
                        value={stats.airdropEstimates["250M"]}
                      />
                      <KPICard 
                        label="300M Airdrop Est." 
                        value={stats.airdropEstimates["300M"]}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart data={historyData} loading={loading} />
                <RankChart data={historyData} loading={loading} />
              </div>

              {/* Automation Info Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Integration Info */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm">
                  <div className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div>
                          <h4 className="font-semibold mb-1">Python Agent Connected ✓</h4>
                          <p className="text-sm text-muted-foreground">
                            Your tracking agent is sending data to this dashboard automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Automation Setup */}
                <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent backdrop-blur-sm">
                  <div className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div>
                          <h4 className="font-semibold mb-1">Automate Tracking (Cron Job)</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Run your script every hour automatically with a cron job:
                          </p>
                          <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                            <code className="block text-foreground whitespace-nowrap">
                              0 * * * * cd /path/to/spark_agent && python3 spark_points_agent.py
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Run <code className="text-primary">crontab -e</code> to add this line
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
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
                    <Sparkles className="w-6 h-6 text-primary" />
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
