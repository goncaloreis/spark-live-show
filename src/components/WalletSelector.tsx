import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WalletSelectorProps {
  onWalletLoad: (wallet: string) => void;
}

export const WalletSelector = ({ onWalletLoad }: WalletSelectorProps) => {
  useEffect(() => {
    const fetchAndLoadWallet = async () => {
      try {
        const { data, error } = await supabase
          .from('tracked_wallets')
          .select('wallet_address')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          onWalletLoad(data.wallet_address);
        }
      } catch (error) {
        console.error('Error fetching tracked wallet:', error);
      }
    };

    fetchAndLoadWallet();
  }, [onWalletLoad]);

  // No visible UI - just loads wallet data on mount
  return null;
};
