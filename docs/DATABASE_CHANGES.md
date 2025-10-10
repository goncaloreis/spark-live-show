# Database Schema Changes

## New Table: `tracked_wallets`

Stores wallets that have paid for tracking.

```sql
-- Tracked wallets table (replaces need for auth system)
CREATE TABLE tracked_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  stripe_payment_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  paid_amount NUMERIC DEFAULT 19.90,
  currency TEXT DEFAULT 'EUR',
  payment_status TEXT DEFAULT 'completed',
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT '2025-12-12 23:59:59'::TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE tracked_wallets IS 'Wallets that have paid for Season 2 tracking';
COMMENT ON COLUMN tracked_wallets.wallet_address IS 'Ethereum wallet address (case-insensitive)';
COMMENT ON COLUMN tracked_wallets.stripe_payment_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN tracked_wallets.expires_at IS 'Tracking expires after Season 2 ends (2025-12-12)';
```

## Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE tracked_wallets ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a wallet is tracked (read-only)
CREATE POLICY "Anyone can view tracked wallets"
  ON tracked_wallets FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert (Stripe webhook only)
CREATE POLICY "Service role can insert tracked wallets"
  ON tracked_wallets FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No updates or deletes allowed (immutable payment records)
-- This prevents tampering with payment data
```

## Indexes

```sql
-- Fast lookups by wallet address (case-insensitive)
CREATE INDEX idx_tracked_wallets_address 
  ON tracked_wallets(LOWER(wallet_address));

-- Fast cleanup of expired wallets
CREATE INDEX idx_tracked_wallets_expires_at 
  ON tracked_wallets(expires_at);

-- Fast lookups by Stripe payment ID
CREATE INDEX idx_tracked_wallets_stripe_payment 
  ON tracked_wallets(stripe_payment_id);
```

## Helper Functions

### Check if Wallet is Tracked

```sql
CREATE OR REPLACE FUNCTION is_wallet_tracked(wallet_addr TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tracked_wallets
    WHERE LOWER(wallet_address) = LOWER(wallet_addr)
      AND expires_at > NOW()
      AND payment_status = 'completed'
  );
$$;
```

### Get Tracking Expiry Date

```sql
CREATE OR REPLACE FUNCTION get_tracking_expiry(wallet_addr TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT expires_at FROM tracked_wallets
  WHERE LOWER(wallet_address) = LOWER(wallet_addr)
    AND expires_at > NOW()
    AND payment_status = 'completed'
  ORDER BY expires_at DESC
  LIMIT 1;
$$;
```

## Existing Tables (No Changes)

### `wallet_tracking`
Remains unchanged. Stores historical tracking data for all wallets (tracked or not).

### `rate_limits`
Remains unchanged. Rate limiting for API calls.

### `spk_price_cache`
Remains unchanged. Caches SPK token price.

## Migration Notes

- No breaking changes to existing tables
- New table is additive only
- Existing scraper will need update to query `tracked_wallets`
- Frontend will need update to check tracking status
- No data migration needed from old schema
