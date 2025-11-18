import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";

interface TrackedWallet {
  wallet_address: string;
  notes: string | null;
}

interface WalletSelectorProps {
  selectedWallet: string;
  onWalletChange: (wallet: string) => void;
}

export const WalletSelector = ({ selectedWallet, onWalletChange }: WalletSelectorProps) => {
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackedWallets = async () => {
      try {
        const { data, error } = await supabase
          .from('tracked_wallets')
          .select('wallet_address, notes')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setWallets(data);
          // Don't auto-select - let user choose to avoid unnecessary API calls
        }
      } catch (error) {
        console.error('Error fetching tracked wallets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedWallets();
  }, []);

  const formatWalletLabel = (address: string, notes: string | null) => {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return notes ? `${short} - ${notes}` : short;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/50">
        <Wallet className="w-4 h-4 text-muted-foreground animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading wallets...</span>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/50">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No tracked wallets found</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Tracking:</span>
      </div>
      <Select value={selectedWallet} onValueChange={onWalletChange}>
        <SelectTrigger className="w-[280px] border-primary/20 bg-card/80 backdrop-blur-xl hover:border-primary/40 transition-colors">
          <SelectValue placeholder="Select a wallet to track..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-border backdrop-blur-xl">
          {wallets.map((wallet) => (
            <SelectItem 
              key={wallet.wallet_address} 
              value={wallet.wallet_address}
              className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
            >
              <div className="flex flex-col">
                <span className="font-mono text-sm">{wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}</span>
                {wallet.notes && (
                  <span className="text-xs text-muted-foreground">{wallet.notes}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
