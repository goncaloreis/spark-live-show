import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Loader2 } from "lucide-react";

interface TrackedWallet {
  wallet_address: string;
  notes: string | null;
}

interface WalletSelectorProps {
  selectedWallet: string;
  onWalletChange: (wallet: string) => void;
}

export const WalletSelector = ({ selectedWallet, onWalletChange }: WalletSelectorProps) => {
  const [wallet, setWallet] = useState<TrackedWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    const fetchTrackedWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('tracked_wallets')
          .select('wallet_address, notes')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (error) throw error;
        setWallet(data);
      } catch (error) {
        console.error('Error fetching tracked wallet:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedWallet();
  }, []);

  const handleTrackWallet = () => {
    if (wallet) {
      setTracking(true);
      onWalletChange(wallet.wallet_address);
      // Reset tracking state after a brief moment
      setTimeout(() => setTracking(false), 1000);
    }
  };

  const isTracking = selectedWallet === wallet?.wallet_address;

  if (loading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!wallet) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Wallet className="w-4 h-4" />
        No wallet configured
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleTrackWallet}
      disabled={tracking}
      variant={isTracking ? "default" : "outline"}
      className="gap-2"
    >
      {tracking ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      {isTracking ? (
        <span className="font-mono text-xs">
          {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
        </span>
      ) : (
        "Track Wallet"
      )}
    </Button>
  );
};
