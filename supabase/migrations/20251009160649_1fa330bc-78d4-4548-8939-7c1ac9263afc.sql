-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_latest_wallet_data(text);
DROP FUNCTION IF EXISTS public.get_wallet_history(text, integer);

-- Recreate get_latest_wallet_data function with total_points_pool
CREATE OR REPLACE FUNCTION public.get_latest_wallet_data(wallet_addr text)
 RETURNS TABLE(total_points numeric, rank integer, total_wallets integer, percentile text, total_points_pool numeric, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    total_points,
    rank,
    total_wallets,
    percentile,
    total_points_pool,
    created_at
  FROM public.wallet_tracking
  WHERE wallet_address = wallet_addr
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

-- Recreate get_wallet_history function with total_points_pool
CREATE OR REPLACE FUNCTION public.get_wallet_history(wallet_addr text, days_back integer DEFAULT 30)
 RETURNS TABLE(total_points numeric, rank integer, total_points_pool numeric, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    total_points,
    rank,
    total_points_pool,
    created_at
  FROM public.wallet_tracking
  WHERE wallet_address = wallet_addr
    AND created_at >= now() - (days_back || ' days')::INTERVAL
  ORDER BY created_at ASC;
$function$;