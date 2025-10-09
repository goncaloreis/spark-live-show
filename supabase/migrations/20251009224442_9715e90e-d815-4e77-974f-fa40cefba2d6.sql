-- Create table for caching SPK price data
CREATE TABLE IF NOT EXISTS public.spk_price_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric NOT NULL,
  change_24h numeric,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spk_price_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached prices (public data)
CREATE POLICY "Anyone can view cached SPK prices"
ON public.spk_price_cache
FOR SELECT
USING (true);

-- Only service role can insert prices (via edge function)
CREATE POLICY "Service role can insert prices"
ON public.spk_price_cache
FOR INSERT
WITH CHECK (true);

-- Create index for efficient recent price lookups
CREATE INDEX idx_spk_price_recent ON public.spk_price_cache(created_at DESC);

-- Create function to get latest cached price
CREATE OR REPLACE FUNCTION public.get_latest_spk_price()
RETURNS TABLE(price numeric, change_24h numeric, source text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT price, change_24h, source, created_at
  FROM public.spk_price_cache
  WHERE created_at > now() - INTERVAL '2 minutes'
  ORDER BY created_at DESC
  LIMIT 1;
$function$;

-- Create function to clean old price cache (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_price_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  DELETE FROM public.spk_price_cache
  WHERE created_at < now() - INTERVAL '1 hour';
$function$;