-- Create tracked_wallets table for multi-wallet support
CREATE TABLE IF NOT EXISTS public.tracked_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT '2025-12-12 23:59:59+00'::TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.tracked_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view tracked wallets (public data)
CREATE POLICY "Anyone can view tracked wallets"
ON public.tracked_wallets
FOR SELECT
USING (true);

-- RLS Policy: Service role can manage tracked wallets
CREATE POLICY "Service role can manage tracked wallets"
ON public.tracked_wallets
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert the two wallets
INSERT INTO public.tracked_wallets (wallet_address, notes)
VALUES 
  ('0x5C69D773901ACbFeDbca92E15fBBed623E6d2E99', 'Original tracked wallet'),
  ('0xe014B004b5aD5831be1d1df4973050d27936c58d', 'Second tracked wallet')
ON CONFLICT (wallet_address) DO NOTHING;

-- Create function to get all active tracked wallets (for scraper)
CREATE OR REPLACE FUNCTION public.get_active_tracked_wallets()
RETURNS TABLE(wallet_address TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT wallet_address
  FROM public.tracked_wallets
  WHERE is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at ASC;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tracked_wallets_active ON public.tracked_wallets(is_active, expires_at) WHERE is_active = true;