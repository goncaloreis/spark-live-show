-- Normalize all existing wallet addresses to lowercase
UPDATE public.wallet_tracking
SET wallet_address = LOWER(wallet_address)
WHERE wallet_address != LOWER(wallet_address);

-- Update get_latest_wallet_data function to be case-insensitive
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
  WHERE LOWER(wallet_address) = LOWER(wallet_addr)
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

-- Update get_wallet_history function to be case-insensitive
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
  WHERE LOWER(wallet_address) = LOWER(wallet_addr)
    AND created_at >= now() - (days_back || ' days')::INTERVAL
  ORDER BY created_at ASC;
$function$;