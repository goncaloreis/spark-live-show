-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update trigger function to use extensions schema
CREATE OR REPLACE FUNCTION public.trigger_scrape_spark_points()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  wallet_address text;
  function_url text;
  anon_key text;
BEGIN
  -- Get the most recent wallet address from wallet_tracking table
  SELECT wallet_tracking.wallet_address 
  INTO wallet_address
  FROM public.wallet_tracking
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no wallet found, log and exit
  IF wallet_address IS NULL THEN
    RAISE NOTICE 'No wallet address found in wallet_tracking table';
    RETURN;
  END IF;
  
  -- Get the Supabase URL and anon key
  function_url := 'https://jubjoxthawbxyxajvlcv.supabase.co/functions/v1/scrape-spark-points';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YmpveHRoYXdieHl4YWp2bGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDk5MjYsImV4cCI6MjA3NTU4NTkyNn0.YFHsGtwuOdzqL7rDRSlg6j5Xx4urvoRXLc4uFWNDcTE';
  
  -- Make HTTP POST request to the edge function using extensions schema
  PERFORM extensions.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'walletAddress', wallet_address
    )
  );
  
  RAISE NOTICE 'Triggered scrape for wallet: %', wallet_address;
END;
$function$;