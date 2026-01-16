import { Button } from "@/components/ui/button";
import { Search, Loader2, RefreshCw } from "lucide-react";

interface WalletSelectorProps {
  onWalletLoad: (wallet: string) => void;
  loading?: boolean;
  hasData?: boolean;
}

export const WalletSelector = ({ onWalletLoad, loading, hasData }: WalletSelectorProps) => {
  // Read wallet address from environment variable
  const walletAddress = import.meta.env.VITE_WALLET_ADDRESS;

  const handleTrack = () => {
    if (walletAddress) {
      onWalletLoad(walletAddress);
    }
  };

  return (
    <Button
      onClick={handleTrack}
      disabled={loading || !walletAddress}
      className="backdrop-blur-xl bg-primary/90 hover:bg-primary border border-primary/50 hover:border-primary transition-all duration-300 w-full sm:w-auto sm:min-w-[200px]"
      size="lg"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : hasData ? (
        <RefreshCw className="mr-2 h-4 w-4" />
      ) : (
        <Search className="mr-2 h-4 w-4" />
      )}
      {loading ? "Loading..." : hasData ? "Refresh Data" : "Track Wallet"}
    </Button>
  );
};
