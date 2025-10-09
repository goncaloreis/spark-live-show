import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { Sparkles, TrendingUp, Users, Award, Search } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Mock data - will be replaced with real API calls
  const [stats, setStats] = useState({
    totalPoints: "1,234,567",
    rank: "#142",
    percentile: "Top 2.3%",
    totalWallets: "6,180"
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
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Wallet data loaded successfully");
    }, 1500);
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

              {/* Progress Chart Placeholder */}
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm shadow-card">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Points Progress
                  </h3>
                  <div className="h-[300px] flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/20">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-muted-foreground">Chart visualization coming soon</p>
                      <p className="text-xs text-muted-foreground/60">
                        Historical data will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Need Backend Integration?</h4>
                      <p className="text-sm text-muted-foreground">
                        This is currently displaying mock data. Connect the Python agent to enable real-time tracking, 
                        data persistence, and historical charts.
                      </p>
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
