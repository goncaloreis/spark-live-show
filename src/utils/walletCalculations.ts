/**
 * Utility functions for wallet data calculations
 * All pure functions with no side effects
 */

import { HistoryDataPoint, ChangeIndicator, AirdropEstimates } from '@/types/wallet';

/**
 * Constants for calculations
 */
export const CALCULATION_CONSTANTS = {
  SHARE_CHANGE_THRESHOLD: 0.0000001,
  PERCENTILE_THRESHOLD: 0.01,
  FALLBACK_SPK_PRICE: 0.07,
} as const;

/**
 * Calculate points growth between two data points
 */
export function calculatePointsGrowth(
  current: number,
  previous: number
): { growth: string; change: string } {
  const pointsDiff = current - previous;
  const growthPercent = ((current - previous) / previous * 100).toFixed(2);
  const growthNum = parseFloat(growthPercent);
  
  return {
    growth: growthNum > 0 ? `+${growthPercent}%` : `${growthPercent}%`,
    change: pointsDiff > 0 ? `+${pointsDiff.toLocaleString()}` : pointsDiff.toLocaleString()
  };
}

/**
 * Calculate rank change between two data points
 */
export function calculateRankChange(
  currentRank: number | null,
  previousRank: number | null
): ChangeIndicator {
  if (!currentRank || !previousRank) {
    return { value: '-', direction: 'neutral' };
  }
  
  const rankDiff = previousRank - currentRank;
  return {
    value: `${Math.abs(rankDiff)}`,
    direction: rankDiff > 0 ? 'up' : rankDiff < 0 ? 'down' : 'neutral'
  };
}

/**
 * Calculate percentile change between two data points
 */
export function calculatePercentileChange(
  currentRank: number | null,
  previousRank: number | null,
  totalWallets: number
): ChangeIndicator {
  if (!currentRank || !previousRank || totalWallets === 0) {
    return { value: '-', direction: 'neutral' };
  }
  
  const currentPercentile = ((totalWallets - currentRank) / totalWallets) * 100;
  const previousPercentile = ((totalWallets - previousRank) / totalWallets) * 100;
  const percentileDiff = currentPercentile - previousPercentile;
  
  if (Math.abs(percentileDiff) <= CALCULATION_CONSTANTS.PERCENTILE_THRESHOLD) {
    return { value: '-', direction: 'neutral' };
  }
  
  return {
    value: `${Math.abs(percentileDiff).toFixed(2)}%`,
    direction: percentileDiff > 0 ? 'up' : 'down'
  };
}

/**
 * Find the most recent valid total points pool from history
 */
export function findValidPoolValues(
  history: HistoryDataPoint[]
): { current: number | null; previous: number | null } {
  let current: number | null = null;
  let previous: number | null = null;
  
  for (let i = history.length - 1; i >= 0; i--) {
    const poolValue = history[i].total_points_pool;
    if (poolValue && Number(poolValue) > 0) {
      if (!current) {
        current = Number(poolValue);
      } else if (!previous) {
        previous = Number(poolValue);
        break;
      }
    }
  }
  
  return { current, previous };
}

/**
 * Calculate market share and related metrics
 */
export function calculateMarketShare(
  currentPoints: number,
  totalPointsPool: number | null,
  history: HistoryDataPoint[]
): {
  share: string;
  shareChange: string;
  shareChangeObj: ChangeIndicator;
} {
  if (!totalPointsPool || totalPointsPool === 0) {
    return {
      share: '-',
      shareChange: '-',
      shareChangeObj: { value: '-', direction: 'neutral' }
    };
  }
  
  const share = (currentPoints / totalPointsPool) * 100;
  const shareFormatted = share.toFixed(6) + '%';
  
  // Find previous valid pool data
  let prevValidPool: number | null = null;
  let prevValidPoints: number | null = null;
  
  for (let i = history.length - 2; i >= 0; i--) {
    const poolValue = history[i].total_points_pool;
    if (poolValue && Number(poolValue) > 0) {
      prevValidPool = Number(poolValue);
      prevValidPoints = Number(history[i].total_points);
      break;
    }
  }
  
  if (!prevValidPool || !prevValidPoints) {
    return {
      share: shareFormatted,
      shareChange: '-',
      shareChangeObj: { value: '-', direction: 'neutral' }
    };
  }
  
  const prevShare = (prevValidPoints / prevValidPool) * 100;
  const shareDiff = share - prevShare;
  
  const shareChangeObj = Math.abs(shareDiff) > CALCULATION_CONSTANTS.SHARE_CHANGE_THRESHOLD
    ? {
        value: `${Math.abs(shareDiff).toFixed(7)}%`,
        direction: (shareDiff > 0 ? 'up' : shareDiff < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral'
      }
    : { value: '-', direction: 'neutral' as const };
  
  return {
    share: shareFormatted,
    shareChange: shareDiff >= 0 ? `+${shareDiff.toFixed(7)}%` : `${shareDiff.toFixed(7)}%`,
    shareChangeObj
  };
}

/**
 * Calculate airdrop estimates based on market share and SPK price
 */
export function calculateAirdropEstimates(
  marketShare: string,
  spkPrice: number | null
): AirdropEstimates {
  const share = parseFloat(marketShare) / 100 || 0;
  
  if (share === 0) {
    return {
      '150M': '-',
      '200M': '-',
      '250M': '-'
    };
  }
  
  const effectivePrice = spkPrice || CALCULATION_CONSTANTS.FALLBACK_SPK_PRICE;
  
  return {
    '150M': `$${Math.round(150000000 * share * effectivePrice).toLocaleString()}`,
    '200M': `$${Math.round(200000000 * share * effectivePrice).toLocaleString()}`,
    '250M': `$${Math.round(250000000 * share * effectivePrice).toLocaleString()}`
  };
}

/**
 * Calculate simple change with formatting
 */
export function calculateSimpleChange(current: number, previous: number): string {
  const diff = current - previous;
  return diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString();
}

/**
 * Format timestamp to localized string
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}
