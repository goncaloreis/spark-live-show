import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Loader2 } from "lucide-react";

interface WalletSelectorProps {
  onWalletLoad: (wallet: string) => void;
}

export const WalletSelector = ({ onWalletLoad }: WalletSelectorProps) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndLoadWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('tracked_wallets')
          .select('wallet_address')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (error) throw error;
        
        if (data) {
          setWalletAddress(data.wallet_address);
          onWalletLoad(data.wallet_address);
        }
      } catch (error) {
        console.error('Error fetching tracked wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndLoadWallet();
  }, [onWalletLoad]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-xl">
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        <span className="text-sm text-muted-foreground">Loading wallet...</span>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-xl">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No wallet configured</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl">
      <Wallet className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-muted-foreground">Tracking:</span>
      <span className="font-mono text-sm font-semibold text-foreground">
        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </span>
    </div>
  );
};
