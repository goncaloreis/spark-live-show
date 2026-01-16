# Database Schema Documentation

Complete database schema for the Spark Points Tracker application.

## Tables

### `tracked_wallets`

**Purpose**: Stores wallet addresses that should be automatically tracked by the hourly scraper.

**Important**: This table is used for scraper automation ONLY. It is NOT used for payment tracking or user authentication. The app is completely free to use.

```sql
CREATE TABLE tracked_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE tracked_wallets IS 'Wallets that should be automatically tracked by the scraper';
COMMENT ON COLUMN tracked_wallets.wallet_address IS 'Ethereum wallet address (case-insensitive)';
COMMENT ON COLUMN tracked_wallets.is_active IS 'Whether the scraper should actively track this wallet';
COMMENT ON COLUMN tracked_wallets.notes IS 'Optional label or description for the wallet';
```

**Usage**:
- Scraper queries this table hourly via `get_active_tracked_wallets()` RPC function
- Scraper loops through all active wallets and fetches data from Spark Protocol
- Data is stored in `wallet_tracking` table for historical analysis

### `wallet_tracking`

**Purpose**: Stores historical snapshots of wallet points data over time.

```sql
CREATE TABLE wallet_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  total_points NUMERIC NOT NULL,
  rank INTEGER,
  total_wallets INTEGER,
  percentile TEXT,
  total_points_pool NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wallet_tracking_address ON wallet_tracking(LOWER(wallet_address));
CREATE INDEX idx_wallet_tracking_created_at ON wallet_tracking(created_at DESC);
CREATE INDEX idx_wallet_tracking_composite ON wallet_tracking(wallet_address, created_at DESC);

-- Comments
COMMENT ON TABLE wallet_tracking IS 'Historical wallet points data';
COMMENT ON COLUMN wallet_tracking.wallet_address IS 'Ethereum wallet address';
COMMENT ON COLUMN wallet_tracking.total_points IS 'Spark Protocol points balance';
COMMENT ON COLUMN wallet_tracking.rank IS 'Position on leaderboard (1 = highest)';
COMMENT ON COLUMN wallet_tracking.total_wallets IS 'Total number of participants';
COMMENT ON COLUMN wallet_tracking.percentile IS 'Percentile ranking (e.g., "Top 10%")';
COMMENT ON COLUMN wallet_tracking.total_points_pool IS 'Total points across all participants';
```

**Usage**:
- Scraper writes to this table hourly for each tracked wallet
- Frontend reads from this table via `get_wallet_history()` RPC function
- Used for displaying historical charts and calculating growth metrics

### `rate_limits`

**Purpose**: Tracks API rate limiting to prevent abuse.

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- Comments
COMMENT ON TABLE rate_limits IS 'API rate limiting records';
COMMENT ON COLUMN rate_limits.identifier IS 'IP address or wallet address';
COMMENT ON COLUMN rate_limits.action IS 'Action type: get, store, or global';
COMMENT ON COLUMN rate_limits.request_count IS 'Number of requests in current window';
COMMENT ON COLUMN rate_limits.window_start IS 'When the rate limit window started';
```

**Rate Limits**:
- **Global**: 1000 requests/hour per IP
- **GET**: 30 requests/minute per wallet
- **STORE**: 20 requests/minute per IP, 2 stores/hour per wallet

**Usage**:
- Edge Functions check this table before processing requests
- Returns 429 status code with `retry_after` when limit exceeded
- Old records cleaned up periodically via `cleanup_old_rate_limits()`

### `spk_price_cache`

**Purpose**: Caches SPK token price data from DefiLlama to reduce external API calls.

```sql
CREATE TABLE spk_price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price NUMERIC NOT NULL,
  source TEXT DEFAULT 'defillama',
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE spk_price_cache IS 'Cached SPK token price data (2-minute TTL)';
COMMENT ON COLUMN spk_price_cache.price IS 'SPK token price in USD';
COMMENT ON COLUMN spk_price_cache.source IS 'Data source (defillama)';
COMMENT ON COLUMN spk_price_cache.cached_at IS 'When the price was cached';
```

**Usage**:
- Frontend fetches SPK price via `get-spk-price` Edge Function
- Cache is checked first (2-minute TTL)
- If expired, new price fetched from DefiLlama and cached
- Old records cleaned up periodically via `cleanup_old_price_cache()`

## Row Level Security (RLS) Policies

### `tracked_wallets`

```sql
-- Enable RLS
ALTER TABLE tracked_wallets ENABLE ROW LEVEL SECURITY;

-- Anyone can view tracked wallets (read-only)
CREATE POLICY "Anyone can view tracked wallets"
  ON tracked_wallets FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert/update (scraper management)
CREATE POLICY "Service role can manage tracked wallets"
  ON tracked_wallets FOR ALL
  TO service_role
  WITH CHECK (true);
```

### `wallet_tracking`

```sql
-- Enable RLS
ALTER TABLE wallet_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone can view wallet data (public dashboard)
CREATE POLICY "Anyone can view wallet tracking"
  ON wallet_tracking FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert wallet data (allows manual data entry if needed)
CREATE POLICY "Anyone can insert wallet tracking"
  ON wallet_tracking FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No deletes allowed (preserve historical data)
```

### `rate_limits`

```sql
-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access (internal use only)
CREATE POLICY "Service role only"
  ON rate_limits FOR ALL
  TO service_role
  WITH CHECK (true);
```

### `spk_price_cache`

```sql
-- Enable RLS
ALTER TABLE spk_price_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can view cached prices
CREATE POLICY "Anyone can view price cache"
  ON spk_price_cache FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert (Edge Function only)
CREATE POLICY "Service role can insert prices"
  ON spk_price_cache FOR INSERT
  TO service_role
  WITH CHECK (true);
```

## RPC Functions

### `get_active_tracked_wallets()`

Returns all wallets that should be tracked by the scraper.

```sql
CREATE OR REPLACE FUNCTION get_active_tracked_wallets()
RETURNS TABLE (
  wallet_address TEXT,
  notes TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT wallet_address, notes
  FROM tracked_wallets
  WHERE is_active = true
  ORDER BY created_at ASC;
$$;
```

**Usage**: Called by Python scraper at the start of each hourly run.

### `get_latest_wallet_data(wallet_addr TEXT)`

Returns the most recent data point for a specific wallet.

```sql
CREATE OR REPLACE FUNCTION get_latest_wallet_data(wallet_addr TEXT)
RETURNS TABLE (
  wallet_address TEXT,
  total_points NUMERIC,
  rank INTEGER,
  total_wallets INTEGER,
  percentile TEXT,
  total_points_pool NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    wallet_address,
    total_points,
    rank,
    total_wallets,
    percentile,
    total_points_pool,
    created_at
  FROM wallet_tracking
  WHERE LOWER(wallet_address) = LOWER(wallet_addr)
  ORDER BY created_at DESC
  LIMIT 1;
$$;
```

**Usage**: Called by `track-wallet` Edge Function to fetch current wallet stats.

### `get_wallet_history(wallet_addr TEXT, days_back INTEGER DEFAULT 30)`

Returns historical data points for a wallet over the specified time period.

```sql
CREATE OR REPLACE FUNCTION get_wallet_history(
  wallet_addr TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  wallet_address TEXT,
  total_points NUMERIC,
  rank INTEGER,
  total_wallets INTEGER,
  percentile TEXT,
  total_points_pool NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    wallet_address,
    total_points,
    rank,
    total_wallets,
    percentile,
    total_points_pool,
    created_at
  FROM wallet_tracking
  WHERE LOWER(wallet_address) = LOWER(wallet_addr)
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY created_at ASC;
$$;
```

**Usage**: Called by `track-wallet` Edge Function to fetch historical data for charts.

### `get_latest_spk_price()`

Returns the most recent cached SPK price.

```sql
CREATE OR REPLACE FUNCTION get_latest_spk_price()
RETURNS TABLE (
  price NUMERIC,
  cached_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT price, cached_at
  FROM spk_price_cache
  ORDER BY cached_at DESC
  LIMIT 1;
$$;
```

**Usage**: Called by `get-spk-price` Edge Function to check cache before fetching from DefiLlama.

### `cleanup_old_rate_limits()`

Removes rate limit records older than 2 hours (maintenance function).

```sql
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

**Usage**: Called periodically by Edge Functions to prevent table bloat.

### `cleanup_old_price_cache()`

Removes price cache records older than 1 hour (maintenance function).

```sql
CREATE OR REPLACE FUNCTION cleanup_old_price_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM spk_price_cache
  WHERE cached_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

**Usage**: Called periodically by Edge Functions to prevent table bloat.

## Migration Notes

- All tables use UUID primary keys for scalability
- Case-insensitive indexes on wallet addresses (using LOWER())
- RLS policies ensure security without complex auth system
- RPC functions provide clean API for Edge Functions and scraper
- Maintenance functions prevent table bloat from rate limiting and caching

## Adding a Wallet to Track

To add a new wallet to the scraper's tracking list:

```sql
INSERT INTO tracked_wallets (wallet_address, is_active, notes)
VALUES ('0xYourWalletAddress', true, 'Optional description');
```

The scraper will pick up this wallet on its next hourly run.

## Viewing Tracked Data

To see what wallets are being tracked:

```sql
SELECT * FROM tracked_wallets WHERE is_active = true;
```

To see recent data for a specific wallet:

```sql
SELECT * FROM get_wallet_history('0xYourWalletAddress', 7);
```
