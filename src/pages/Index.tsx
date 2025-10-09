import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { ProgressChart } from "@/components/ProgressChart";
import { Sparkles, TrendingUp, Users, Award, Search } from "lucide-react";
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
    totalWallets: "-"
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
        // Update stats with real data
        setStats({
          totalPoints: Number(data.latest.total_points).toLocaleString(),
          rank: data.latest.rank ? `#${data.latest.rank}` : '-',
          percentile: data.latest.percentile || '-',
          totalWallets: data.latest.total_wallets ? data.latest.total_wallets.toLocaleString() : '-'
        });
        
        // Update history for chart
        setHistoryData(data.history || []);
        
        toast.success("Wallet data loaded successfully");
      } else {
        toast.info("No data found for this wallet yet. Connect your Python agent to start tracking!");
        setStats({
          totalPoints: "0",
          rank: "-",
          percentile: "-",
          totalWallets: "-"
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="relative">
        {/* Hero Section */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-glow">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                    Spark Points Tracker
                  </h1>
                  <p className="text-sm text-muted-foreground">Real-time wallet analytics</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* Search Section */}
          <Card className="mb-12 border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
            <div className="p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Track Your Spark Points</h2>
                  <p className="text-muted-foreground">
                    Enter your wallet address to view your points, rank, and progress
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Input
                    placeholder="0x..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="flex-1 h-12 bg-input border-border/50 focus-visible:ring-primary"
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-12 px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Data sourced from{" "}
                  <a 
                    href="https://points.spark.fi/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-glow transition-colors"
                  >
                    points.spark.fi
                  </a>
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          {hasSearched && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Points"
                  value={stats.totalPoints}
                  icon={Sparkles}
                  trend="+12.5% this week"
                  loading={loading}
                />
                <StatsCard
                  title="Your Rank"
                  value={stats.rank}
                  icon={Award}
                  trend={stats.percentile}
                  loading={loading}
                />
                <StatsCard
                  title="Total Wallets"
                  value={stats.totalWallets}
                  icon={Users}
                  loading={loading}
                />
                <StatsCard
                  title="Performance"
                  value="Excellent"
                  icon={TrendingUp}
                  trend="Above average"
                  loading={loading}
                />
              </div>

              {/* Progress Chart */}
              <ProgressChart data={historyData} loading={loading} />

              {/* Integration Info Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1">Connect Your Python Agent</h4>
                        <p className="text-sm text-muted-foreground">
                          To enable real-time tracking, modify your Python agent to send data to this backend API.
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono">
                        <p className="text-muted-foreground mb-2">Add this to your Python script:</p>
                        <code className="block text-foreground">
                          import requests<br/>
                          <br/>
                          url = "{import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-wallet"<br/>
                          data = {'{'}  <br/>
                          &nbsp;&nbsp;"wallet_address": "0x...",<br/>
                          &nbsp;&nbsp;"action": "store",<br/>
                          &nbsp;&nbsp;"total_points": 1234567,<br/>
                          &nbsp;&nbsp;"rank": 142,<br/>
                          &nbsp;&nbsp;"total_wallets": 6180,<br/>
                          &nbsp;&nbsp;"percentile": "Top 2.3%"<br/>
                          {'}'}<br/>
                          requests.post(url, json=data)
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!hasSearched && (
            <div className="text-center py-20 space-y-4 animate-in fade-in duration-700">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-muted-foreground">
                Enter a wallet address to get started
              </h3>
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
