-- Create wallet_tracking table to store historical data
CREATE TABLE public.wallet_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  total_points NUMERIC NOT NULL,
  rank INTEGER,
  total_wallets INTEGER,
  percentile TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_wallet_tracking_address ON public.wallet_tracking(wallet_address);
CREATE INDEX idx_wallet_tracking_created_at ON public.wallet_tracking(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.wallet_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (public data)
CREATE POLICY "Anyone can view wallet tracking data"
  ON public.wallet_tracking
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert (for now - can be restricted later)
CREATE POLICY "Anyone can insert wallet tracking data"
  ON public.wallet_tracking
  FOR INSERT
  WITH CHECK (true);

-- Create function to get latest wallet data
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

-- Create function to get wallet history
CREATE OR REPLACE FUNCTION public.get_wallet_history(wallet_addr TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_points NUMERIC,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
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