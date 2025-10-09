-- Add total_points_pool column to wallet_tracking table
ALTER TABLE public.wallet_tracking 
ADD COLUMN total_points_pool numeric;

-- Add comment to explain the field
COMMENT ON COLUMN public.wallet_tracking.total_points_pool IS 'Total points pool across all wallets at the time of data collection';