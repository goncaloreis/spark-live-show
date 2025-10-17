/**
 * Type definitions for wallet tracking data
 */

export interface WalletData {
  wallet_address: string;
  total_points: number;
  rank: number | null;
  total_wallets: number | null;
  percentile: string | null;
  total_points_pool: number | null;
  created_at: string;
}

export interface HistoryDataPoint {
  total_points: number;
  rank: number;
  total_wallets: number;
  total_points_pool: number | null;
  created_at: string;
  globalAverage?: number;
}

export interface ChangeIndicator {
  value: string;
  direction: 'up' | 'down' | 'neutral';
}

export interface AirdropEstimates {
  '150M': string;
  '200M': string;
  '250M': string;
}

export interface WalletStats {
  totalPoints: string;
  rank: string;
  percentile: string;
  totalWallets: string;
  pointsGrowth: string;
  lastUpdated: string;
  pointsChange: string;
  rankChange: ChangeIndicator;
  percentileChange: ChangeIndicator;
  marketShare: string;
  shareChange: string;
  shareChangeObj: ChangeIndicator;
  airdropEstimates: AirdropEstimates;
  spkPrice: number | null;
  totalPointsPool: string;
  totalPointsPoolChange: string;
  totalWalletsChange: string;
}

export interface WalletResponse {
  has_data: boolean;
  latest: WalletData;
  history: HistoryDataPoint[];
}
