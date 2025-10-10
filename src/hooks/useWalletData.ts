/**
 * Custom hook for fetching and managing wallet data
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WalletStats, WalletResponse, HistoryDataPoint } from '@/types/wallet';
import {
  calculatePointsGrowth,
  calculateRankChange,
  calculatePercentileChange,
  findValidPoolValues,
  calculateMarketShare,
  calculatePaceStatus,
  calculateAirdropEstimates,
  calculateSimpleChange,
  formatTimestamp
} from '@/utils/walletCalculations';

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
  paceStatus: 'NEUTRAL',
  airdropEstimates: { '150M': '-', '200M': '-', '250M': '-' },
  spkPrice: null,
  totalPointsPool: '-',
  totalPointsPoolChange: '-',
  totalWalletsChange: '-',
  poolShareChangeNumeric: 0
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
export function useWalletData() {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState<WalletStats>(INITIAL_STATS);
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);

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

    // Find valid pool values
    const { current: totalPointsPool, previous: prevTotalPointsPool } = findValidPoolValues(history);

    // Calculate pool change
    if (totalPointsPool && prevTotalPointsPool) {
      totalPointsPoolChange = calculateSimpleChange(totalPointsPool, prevTotalPointsPool);
    }

    // Calculate market share metrics
    const marketShareData = calculateMarketShare(currentPoints, totalPointsPool, history);

    // Calculate pace status
    const paceStatus = calculatePaceStatus(marketShareData.poolShareChangeNumeric);

    // Fetch SPK price
    const spkPrice = await fetchSPKPrice();

    // Calculate airdrop estimates
    const airdropEstimates = calculateAirdropEstimates(marketShareData.share, spkPrice);

    // Calculate global average
    const globalAverage = totalPointsPool && totalWallets > 0 
      ? totalPointsPool / totalWallets 
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
      paceStatus,
      airdropEstimates,
      spkPrice,
      totalPointsPool: totalPointsPool ? totalPointsPool.toLocaleString() : '-',
      totalPointsPoolChange,
      totalWalletsChange,
      poolShareChangeNumeric: marketShareData.poolShareChangeNumeric
    });

    // Update history with global average
    setHistoryData(history.map(item => ({ ...item, globalAverage })));
  };

  /**
   * Search for wallet data
   */
  const searchWallet = async (): Promise<void> => {
    // Validation
    if (!walletAddress) {
      toast.error('Please enter a wallet address');
      return;
    }

    const sanitizedAddress = walletAddress.trim().toLowerCase();
    if (!isValidWalletAddress(sanitizedAddress)) {
      toast.error('Invalid wallet address format');
      return;
    }

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

      if (error) throw error;

      if (data?.has_data && data.latest) {
        await processWalletData(data);
        toast.success('Wallet data loaded successfully');
      } else {
        toast.info('No data found for this wallet yet. Connect your Python agent to start tracking!');
        setStats(INITIAL_STATS);
        setHistoryData([]);
      }
    } catch (error) {
      toast.error('Unable to load wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    walletAddress,
    setWalletAddress,
    loading,
    hasSearched,
    stats,
    historyData,
    searchWallet
  };
}
