-- Remove obsolete trigger_scrape_spark_points function
-- This function is no longer needed as GitHub Actions handles all scraping
-- Removing it also resolves:
-- 1. Hardcoded credentials (Supabase URL and anon key) in database code
-- 2. Unnecessary SECURITY DEFINER function that could bypass RLS

DROP FUNCTION IF EXISTS public.trigger_scrape_spark_points();