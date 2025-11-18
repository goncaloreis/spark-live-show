/**
 * Custom hook for fetching and managing wallet data
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WalletStats, WalletResponse, HistoryDataPoint } from '@/types/wallet';
import {
  calculatePointsGrowth,
  calculateRankChange,
  calculatePercentileChange,
  findValidPoolValues,
  calculateMarketShare,
  calculateAirdropEstimates,
  calculateSimpleChange,
  formatTimestamp
} from '@/utils/walletCalculations';
import { APP_CONFIG } from '@/utils/constants';

const INITIAL_STATS: WalletStats = {
  totalPoints: '0',
  rank: '-',
  percentile: '-',
  totalWallets: '-',
  pointsGrowth: '-',
  lastUpdated: '-',
  pointsChange: '-',
  rankChange: { value: '-', direction: 'neutral' },
  percentileChange: { value: '-', direction: 'neutral' },
  marketShare: '-',
  shareChange: '-',
  shareChangeObj: { value: '-', direction: 'neutral' },
  airdropEstimates: { '150M': '-', '200M': '-', '250M': '-' },
  spkPrice: null,
  totalPointsPool: '-',
  totalPointsPoolChange: '-',
  totalWalletsChange: '-'
};

/**
 * Validates Ethereum wallet address format
 */
function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Hook for managing wallet data fetching and calculations
 */
export function useWalletData(walletAddress?: string) {
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState<WalletStats>(INITIAL_STATS);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const lastSearchedWallet = useRef<string | null>(null);
  const rateLimitUntil = useRef<number>(0);

  /**
   * Fetch SPK price from backend
   */
  const fetchSPKPrice = async (): Promise<number | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-spk-price');
      if (!error && data?.price) {
        return Number(data.price);
      }
    } catch (error) {
      // Silent fail - use fallback price
    }
    return null;
  };

  /**
   * Process wallet data and calculate all metrics
   */
  const processWalletData = async (data: WalletResponse): Promise<void> => {
    const { latest, history } = data;
    const totalWallets = latest.total_wallets || 0;
    const currentPoints = Number(latest.total_points);
    
    // Use latest.total_points_pool as the current pool value (most recent), rounded to remove decimals
    const currentTotalPointsPool = latest.total_points_pool ? Math.round(Number(latest.total_points_pool)) : null;

    // Initialize variables
    let pointsGrowth = '-';
    let pointsChange = '-';
    let rankChange: import('@/types/wallet').ChangeIndicator = { value: '-', direction: 'neutral' };
    let percentileChange: import('@/types/wallet').ChangeIndicator = { value: '-', direction: 'neutral' };
    let totalPointsPoolChange = '-';
    let totalWalletsChange = '-';

    // Calculate changes if we have sufficient history
    if (history.length >= 2) {
      const latestHistory = history[history.length - 1];
      const previousHistory = history[history.length - 2];

      // Points growth
      const growth = calculatePointsGrowth(
        Number(latestHistory.total_points),
        Number(previousHistory.total_points)
      );
      pointsGrowth = growth.growth;
      pointsChange = growth.change;

      // Rank change
      rankChange = calculateRankChange(latestHistory.rank, previousHistory.rank);

      // Percentile change
      percentileChange = calculatePercentileChange(
        latestHistory.rank,
        previousHistory.rank,
        totalWallets
      );

      // Total wallets change
      if (latestHistory.total_wallets && previousHistory.total_wallets) {
        totalWalletsChange = calculateSimpleChange(
          latestHistory.total_wallets,
          previousHistory.total_wallets
        );
      }
    }

    // Find previous pool value from history for change calculation
    const { previous: prevTotalPointsPool } = findValidPoolValues(history);

    // Calculate pool change using current (from latest) and previous (from history)
    if (currentTotalPointsPool && prevTotalPointsPool) {
      totalPointsPoolChange = calculateSimpleChange(currentTotalPointsPool, prevTotalPointsPool);
    }

    // Calculate market share metrics using current points and current pool (both from latest)
    const marketShareData = calculateMarketShare(currentPoints, currentTotalPointsPool, history);

    // Fetch SPK price
    const spkPrice = await fetchSPKPrice();

    // Calculate airdrop estimates
    const airdropEstimates = calculateAirdropEstimates(marketShareData.share, spkPrice);

    // Calculate global average using current pool value
    const globalAverage = currentTotalPointsPool && totalWallets > 0 
      ? currentTotalPointsPool / totalWallets 
      : 0;

    // Update stats
    setStats({
      totalPoints: currentPoints.toLocaleString(),
      rank: latest.rank ? `${latest.rank}` : '-',
      percentile: latest.percentile ? latest.percentile.replace('Top ', '') : '-',
      totalWallets: totalWallets ? totalWallets.toLocaleString() : '-',
      pointsGrowth,
      lastUpdated: formatTimestamp(latest.created_at),
      pointsChange,
      rankChange,
      percentileChange,
      marketShare: marketShareData.share,
      shareChange: marketShareData.shareChange,
      shareChangeObj: marketShareData.shareChangeObj,
      airdropEstimates,
      spkPrice,
      totalPointsPool: currentTotalPointsPool ? currentTotalPointsPool.toLocaleString() : '-',
      totalPointsPoolChange,
      totalWalletsChange
    });

    // Update history with global average
    setHistoryData(history.map(item => ({ ...item, globalAverage })));
  };

  /**
   * Search for wallet data by address
   */
  const searchWallet = useCallback(async (walletAddress: string): Promise<void> => {
    // Validation
    if (!walletAddress) {
      toast.error('Wallet address not provided');
      return;
    }

    const sanitizedAddress = walletAddress.trim().toLowerCase();
    
    // Check if we're currently rate limited
    const now = Date.now();
    if (rateLimitUntil.current > now) {
      const secondsLeft = Math.ceil((rateLimitUntil.current - now) / 1000);
      toast.error(`Rate limited. Please wait ${secondsLeft} seconds before trying again.`);
      return;
    }
    
    // Prevent duplicate searches
    if (lastSearchedWallet.current === sanitizedAddress) {
      return;
    }
    
    if (!isValidWalletAddress(sanitizedAddress)) {
      toast.error('Invalid wallet address format');
      return;
    }

    lastSearchedWallet.current = sanitizedAddress;
    setLoading(true);
    setHasSearched(true);

    try {
      // Fetch wallet data
      const { data, error } = await supabase.functions.invoke<WalletResponse>('track-wallet', {
        body: {
          wallet_address: sanitizedAddress,
          action: 'get'
        }
      });

      if (error) {
        // Handle rate limit errors specifically
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          // Try to parse retry_after from the error
          let retryAfter = 60; // Default to 60 seconds
          
          // The error might have the response data in different places
          try {
            const errorBody = (error as any).context?.body;
            if (errorBody && typeof errorBody === 'string') {
              const parsed = JSON.parse(errorBody);
              retryAfter = parsed.retry_after || 60;
            } else if (errorBody?.retry_after) {
              retryAfter = errorBody.retry_after;
            }
          } catch (e) {
            console.error('Could not parse retry_after from error:', e);
          }
          
          rateLimitUntil.current = Date.now() + (retryAfter * 1000);
          const minutes = Math.ceil(retryAfter / 60);
          toast.error(`Rate limited. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`);
          lastSearchedWallet.current = null;
          return;
        }
        throw error;
      }

      if (data?.has_data && data.latest) {
        await processWalletData(data);
        toast.success('Wallet data loaded successfully');
      } else {
        toast.info('No data found for this wallet yet. Connect your Python agent to start tracking!');
        setStats(INITIAL_STATS);
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Wallet search error:', error);
      toast.error('Unable to load wallet data. Please try again.');
      lastSearchedWallet.current = null; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    hasSearched,
    stats,
    historyData,
    searchWallet
  };
}
