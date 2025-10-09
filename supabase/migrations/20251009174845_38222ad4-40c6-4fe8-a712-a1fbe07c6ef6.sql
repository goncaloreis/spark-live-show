-- Drop the old trigger function that required manual wallet address
DROP FUNCTION IF EXISTS public.trigger_scrape_spark_points();

-- Create a new trigger function that automatically gets the wallet address from existing data
CREATE OR REPLACE FUNCTION public.trigger_scrape_spark_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  wallet_address text;
  function_url text;
  anon_key text;
BEGIN
  -- Get the most recent wallet address from wallet_tracking table
  SELECT DISTINCT wallet_tracking.wallet_address 
  INTO wallet_address
  FROM public.wallet_tracking
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no wallet found, log and exit
  IF wallet_address IS NULL THEN
    RAISE NOTICE 'No wallet address found in wallet_tracking table';
    RETURN;
  END IF;
  
  -- Get the Supabase URL and anon key from environment
  function_url := 'https://jubjoxthawbxyxajvlcv.supabase.co/functions/v1/scrape-spark-points';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YmpveHRoYXdieHl4YWp2bGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDk5MjYsImV4cCI6MjA3NTU4NTkyNn0.YFHsGtwuOdzqL7rDRSlg6j5Xx4urvoRXLc4uFWNDcTE';
  
  -- Make HTTP POST request to the edge function
  PERFORM net.http_post(
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