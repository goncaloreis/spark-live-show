/**
 * Application-wide constants
 */

export const APP_CONFIG = {
  APP_NAME: 'Spark Points Tracker',
  APP_DESCRIPTION: 'Real-Time DeFi Performance Analytics',
  SEASON: 'Season 2',
  POWERED_BY_URL: 'https://points.spark.fi/',
  POWERED_BY_TEXT: 'points.spark.fi'
} as const;

export const VALIDATION = {
  WALLET_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  WALLET_ADDRESS_PLACEHOLDER: 'Enter wallet address (0x...)'
} as const;

export const UI_TEXT = {
  SEARCH_BUTTON: 'Track Wallet',
  SEARCH_BUTTON_SHORT: 'Track',
  LOADING_TEXT: 'Analyzing...',
  LOADING_TEXT_SHORT: 'Loading...',
  NO_DATA_MESSAGE: 'No data found for this wallet yet. Connect your Python agent to start tracking!',
  SUCCESS_MESSAGE: 'Wallet data loaded successfully',
  ERROR_MESSAGE: 'Unable to load wallet data. Please try again.',
  PRIVACY_NOTICE: 'Searched wallet data is publicly viewable and tracked'
} as const;
