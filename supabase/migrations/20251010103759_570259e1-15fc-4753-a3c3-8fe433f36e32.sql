-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.get_wallet_history(text, integer);

-- Recreate get_wallet_history function with total_wallets included
CREATE OR REPLACE FUNCTION public.get_wallet_history(wallet_addr text, days_back integer DEFAULT 30)
 RETURNS TABLE(total_points numeric, rank integer, total_wallets integer, total_points_pool numeric, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    total_points,
    rank,
    total_wallets,
    total_points_pool,
    created_at
  FROM public.wallet_tracking
  WHERE LOWER(wallet_address) = LOWER(wallet_addr)
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY created_at ASC;
$function$;