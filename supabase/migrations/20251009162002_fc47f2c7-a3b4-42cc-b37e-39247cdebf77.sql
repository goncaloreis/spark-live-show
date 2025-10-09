-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to invoke the scrape-spark-points edge function
CREATE OR REPLACE FUNCTION public.trigger_scrape_spark_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_address text := 'YOUR_WALLET_ADDRESS'; -- You'll need to update this with your actual wallet address
  function_url text;
  anon_key text;
BEGIN
  -- Get the Supabase URL and anon key from environment
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/scrape-spark-points';
  anon_key := current_setting('app.settings.supabase_anon_key', true);
  
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
$$;

-- Schedule the scrape to run every hour at minute 0
SELECT cron.schedule(
  'scrape-spark-points-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT public.trigger_scrape_spark_points();$$
);

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION public.trigger_scrape_spark_points() TO service_role;