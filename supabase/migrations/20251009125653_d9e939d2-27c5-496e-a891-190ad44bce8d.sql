-- Fix security warning: Update functions with proper search_path
DROP FUNCTION IF EXISTS public.get_latest_wallet_data(TEXT);
DROP FUNCTION IF EXISTS public.get_wallet_history(TEXT, INTEGER);

-- Recreate function to get latest wallet data with secure search_path
CREATE OR REPLACE FUNCTION public.get_latest_wallet_data(wallet_addr TEXT)
RETURNS TABLE (
  total_points NUMERIC,
  rank INTEGER,
  total_wallets INTEGER,
  percentile TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    total_points,
    rank,
    total_wallets,
    percentile,
    created_at
  FROM public.wallet_tracking
  WHERE wallet_address = wallet_addr
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Recreate function to get wallet history with secure search_path
CREATE OR REPLACE FUNCTION public.get_wallet_history(wallet_addr TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_points NUMERIC,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    total_points,
    rank,
    created_at
  FROM public.wallet_tracking
  WHERE wallet_address = wallet_addr
    AND created_at >= now() - (days_back || ' days')::INTERVAL
  ORDER BY created_at ASC;
$$;