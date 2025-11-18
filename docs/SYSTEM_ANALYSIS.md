# Spark Points Season 2 - Complete System Analysis

## System Overview

This application tracks Spark Protocol Season 2 airdrop points for multiple wallets through automated scraping, data storage, and real-time visualization.

## Architecture Components

### 1. Database (Supabase)

#### Tables:
- **`tracked_wallets`**: Stores wallet addresses that should be tracked
  - `wallet_address` (text, primary): Ethereum address to track
  - `is_active` (boolean): Whether wallet is actively tracked
  - `expires_at` (timestamp): Auto-set to 2025-12-12 (Season 2 end)
  - `notes` (text): Optional label for wallet
  - `created_at` (timestamp): When tracking started

- **`wallet_tracking`**: Historical data points for each wallet
  - `wallet_address` (text): Associated wallet
  - `total_points` (numeric): Current points balance
  - `rank` (integer): Position on leaderboard
  - `total_wallets` (integer): Total participants
  - `percentile` (text): Percentile ranking
  - `total_points_pool` (numeric): Global points pool
  - `created_at` (timestamp): When data was captured

- **`rate_limits`**: Rate limiting tracking
  - `identifier` (text): IP address or wallet address
  - `action` (text): 'get', 'store', or 'global'
  - `request_count` (integer): Requests in current window
  - `window_start` (timestamp): When window started

- **`spk_price_cache`**: Cached SPK token prices
  - `price` (numeric): Current price
  - `change_24h` (numeric): 24h price change
  - `source` (text): Price data source
  - `created_at` (timestamp): Cache timestamp

#### Database Functions:
- `get_active_tracked_wallets()`: Returns all active wallets for scraper
- `get_latest_wallet_data(wallet_addr)`: Latest snapshot for wallet
- `get_wallet_history(wallet_addr, days_back)`: Historical data points
- `cleanup_old_rate_limits()`: Removes expired rate limit records
- `get_latest_spk_price()`: Recent cached price data
- `cleanup_old_price_cache()`: Removes old price cache

### 2. Backend (Edge Functions)

#### `track-wallet` Function:
**Purpose**: Handles wallet data retrieval and storage

**Actions**:
- **GET** (`action: 'get'`): 
  - Rate limit: 30 requests/minute per wallet
  - Returns latest data + 30-day history
  - Used by frontend to display dashboard
  
- **STORE** (`action: 'store'`):
  - Rate limit: 20 requests/minute per IP
  - Requires `x-scraper-secret` header authentication
  - Validates and inserts wallet data
  - Used by Python scraper

**Rate Limiting**:
- Global: 1000 requests/hour per IP (prevents abuse)
- Action-specific: Separate limits for GET/STORE
- Cleanup: Periodically removes old rate limit records

**Security**:
- CORS enabled for web access
- Scraper authentication via secret header
- Input validation (wallet format, numeric bounds)
- RLS policies protect database access

#### `get-spk-price` Function:
**Purpose**: Fetches and caches SPK token price from external APIs

**Features**:
- Checks cache first (2-minute TTL)
- Fetches from CoinGecko on cache miss
- Returns price + 24h change
- Used for airdrop USD value calculations

### 3. Scraper (Python)

#### Location: `scraper/spark_points_scraper.py`

**Trigger**: GitHub Actions cron job (hourly)

**Workflow**:
1. Fetch active wallets from `get_active_tracked_wallets()`
2. For each wallet:
   - Launch headless Firefox browser
   - Navigate to https://points.spark.fi/
   - Wait for React app to load (15s)
   - Extract global metrics (Total Points Pool, Total Wallets)
   - Search for specific wallet address
   - Extract wallet-specific data (points, rank, percentile)
   - Close browser
3. Store data via `track-wallet` function (action: 'store')
4. Report success/failure summary

**Key Features**:
- Headless Firefox with anti-detection measures
- Wallet address masking in logs for security
- Error handling and retry logic
- Screenshot capture for debugging
- Multi-wallet support (loops through all tracked wallets)

**Environment Variables**:
- `SUPABASE_URL`: Backend URL
- `SUPABASE_ANON_KEY`: Public API key
- `SCRAPER_SECRET`: Authentication secret

#### GitHub Actions Workflow:
- **File**: `.github/workflows/scrape-spark-points.yml`
- **Schedule**: Every hour (`0 * * * *`)
- **Manual trigger**: Available via workflow_dispatch
- **Dependencies**: Python 3.11, Firefox, geckodriver, selenium, requests
- **Secrets**: Injected from repository secrets

### 4. Frontend (React)

#### Main Components:

**`Index.tsx`** - Main dashboard page
- Displays wallet selector
- Shows all KPI cards and charts
- Manages wallet selection state
- Triggers data fetching on wallet selection

**`WalletSelector.tsx`** - Wallet dropdown
- Fetches tracked wallets from database
- Displays wallet address + notes
- No auto-selection (waits for user input)
- Shows loading/empty states

**`useWalletData.ts`** - Data fetching hook
- Calls `track-wallet` function (action: 'get')
- Processes raw data into display format
- Calculates derived metrics (growth, changes, projections)
- Handles rate limiting with countdown
- Prevents duplicate searches for same wallet

#### Data Flow:
1. User selects wallet from dropdown
2. `Index.tsx` useEffect triggers `searchWallet()`
3. Hook calls edge function with wallet address
4. Edge function fetches from database (latest + history)
5. Hook processes data and updates state
6. UI re-renders with new data

#### Key Metrics Displayed:
- Total Points (current balance)
- Rank (position on leaderboard)
- Percentile (top X%)
- Points Growth (% change + absolute)
- Market Share (% of total points pool)
- Airdrop Estimates (150M/200M/250M SPK scenarios)
- Historical charts (points, rank, market share over time)

### 5. Rate Limiting Strategy

**Why Rate Limits?**
- Prevent abuse of free API
- Protect database from overload
- Limit costs (edge function invocations)
- Fair usage across users

**Current Configuration**:
- **Global**: 1000 req/hour per IP (relaxed for development)
- **GET**: 30 req/minute per wallet (frontend queries)
- **STORE**: 20 req/minute per IP (scraper writes)

**Rate Limit Flow**:
1. Request arrives at edge function
2. Extract client IP from headers
3. Check global IP rate limit first
4. If passed, check action-specific limit
5. If limit exceeded, return 429 with `retry_after`
6. Frontend displays countdown timer
7. Old rate limits cleaned up periodically

**Frontend Handling**:
- Stores `rateLimitUntil` timestamp in useRef
- Checks before making request
- Parses `retry_after` from 429 error
- Shows user-friendly toast with wait time
- Blocks requests until cooldown expires

## Data Processing Pipeline

### Scraper → Database:
```
Python Scraper
  ↓ (scrape_spark_points)
Extract: points, rank, percentile, pool, wallets
  ↓ (store_data_in_supabase)
POST /functions/v1/track-wallet
  ↓ (action: 'store', x-scraper-secret)
Edge Function validates & authenticates
  ↓
INSERT into wallet_tracking
```

### Database → Frontend:
```
User selects wallet
  ↓ (searchWallet)
POST /functions/v1/track-wallet
  ↓ (action: 'get', wallet_address)
Edge Function rate-limits & queries
  ↓ (get_latest_wallet_data, get_wallet_history)
Returns latest + 30-day history
  ↓ (processWalletData)
Calculate metrics, growth, projections
  ↓
Update UI state (stats, historyData)
  ↓
Render dashboard
```

## Security Measures

1. **Authentication**:
   - Scraper uses secret header (`x-scraper-secret`)
   - Frontend uses anon key (limited permissions)
   - Service role key only in edge functions (trusted environment)

2. **Rate Limiting**:
   - Prevents DDoS and abuse
   - Separate limits for different actions
   - IP-based global limit

3. **Input Validation**:
   - Wallet address format (0x + 40 hex chars)
   - Numeric bounds for points/pool values
   - Action type validation (get/store only)

4. **Row-Level Security (RLS)**:
   - `tracked_wallets`: Public read, service role write
   - `wallet_tracking`: Public read/insert, no delete
   - `rate_limits`: Service role only
   - `spk_price_cache`: Public read, service role write

5. **CORS**:
   - Enabled for web app access
   - Restricted to necessary headers

## Configuration Files

### Environment Variables (.env):
```bash
VITE_SUPABASE_URL=https://jubjoxthawbxyxajvlcv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=jubjoxthawbxyxajvlcv
```

### Supabase Config (supabase/config.toml):
- Project ID
- Edge function configurations
- JWT verification settings

### GitHub Secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SCRAPER_SECRET`

## Recent Fixes (2025-11-18)

### Issues Resolved:

1. **Auto-selection Infinite Loop**:
   - Problem: WalletSelector auto-selected first wallet on mount
   - Impact: Triggered immediate API call, exhausted rate limits
   - Fix: Removed auto-selection, added placeholder text
   - Result: User must explicitly select wallet

2. **Aggressive Rate Limits**:
   - Problem: 100 req/hour global limit too low for development
   - Impact: Rate limited after 3-4 page refreshes
   - Fix: Increased to 1000 req/hour, raised GET to 30/min
   - Result: Comfortable headroom for development + production

3. **useEffect Dependency Issues**:
   - Problem: Missing dependencies caused re-triggers
   - Impact: Multiple API calls for same wallet
   - Fix: Added proper dependencies, memoized searchWallet
   - Result: Single API call per wallet selection

4. **No Rate Limit Recovery UI**:
   - Problem: Blank screen when rate limited
   - Impact: User confused, no indication of issue
   - Fix: Parse retry_after, show countdown in toast
   - Result: Clear error message with wait time

## Monitoring & Debugging

### Edge Function Logs:
- View in Supabase dashboard
- Shows requests, errors, rate limits
- Includes timing information

### Network Requests:
- Browser DevTools Network tab
- Check response status (200, 429, etc.)
- Inspect request/response bodies

### Console Logs:
- Frontend errors logged to browser console
- Scraper output in GitHub Actions logs
- Edge function logs in Supabase

### Database Queries:
- Use Supabase SQL editor
- Check `wallet_tracking` for recent entries
- Verify `tracked_wallets` active status

## Future Improvements

1. **Performance**:
   - Cache frequently accessed wallet data in frontend
   - Batch multiple wallet queries
   - Add database indexes for faster queries

2. **Features**:
   - Real-time updates via Supabase realtime
   - Export data to CSV
   - Email alerts for rank changes
   - Historical comparison between wallets

3. **Monitoring**:
   - Add uptime monitoring for scraper
   - Track scraper success/failure rates
   - Alert on consecutive failures

4. **Scalability**:
   - Move to background job queue for scraping
   - Add horizontal scaling for edge functions
   - Implement caching layer (Redis)

## Conclusion

The system successfully:
✅ Scrapes wallet data hourly from Spark Points website
✅ Stores historical data with proper validation
✅ Displays real-time dashboard with calculations
✅ Handles rate limiting gracefully
✅ Supports multiple wallet tracking
✅ Maintains security through authentication & RLS

All components work together to provide automated, reliable wallet tracking for Spark Protocol Season 2 airdrop.
