# Spark Points Season 3 - Complete System Analysis

## System Overview

This application tracks Spark Protocol Season 3 airdrop points for wallets through automated scraping, data storage, and real-time visualization with manual tracking controls.

**Live App**: https://spark-live-show.vercel.app

## Architecture Components

### 1. Database (Supabase PostgreSQL)

#### Tables:
- **`tracked_wallets`**: Stores wallet addresses for automated scraper tracking
  - `wallet_address` (text, primary): Ethereum address to track
  - `is_active` (boolean): Whether wallet is actively tracked
  - `notes` (text): Optional label for wallet
  - `created_at` (timestamp): When tracking started
  - **Note**: Used by scraper to know which wallets to automatically track hourly

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
  - `cached_at` (timestamp): Cache timestamp (2-minute TTL)

#### Database Functions (RPC):
- `get_active_tracked_wallets()`: Returns all active wallets for scraper
- `get_latest_wallet_data(wallet_addr)`: Latest snapshot for wallet
- `get_wallet_history(wallet_addr, days_back)`: Historical data points (30 days default)
- `cleanup_old_rate_limits()`: Removes expired rate limit records
- `get_latest_spk_price()`: Recent cached price data
- `cleanup_old_price_cache()`: Removes old price cache

### 2. Backend (Supabase Edge Functions - Deno Runtime)

#### `track-wallet` Function:
**Purpose**: Handles wallet data retrieval and storage

**Actions**:
- **GET** (`action: 'get'`):
  - Rate limit: 30 requests/minute per wallet
  - Returns latest data + 30-day history via parallel RPC calls
  - Used by frontend to display dashboard

- **STORE** (`action: 'store'`):
  - Rate limit: 20 requests/minute per IP, 2 stores/hour per wallet
  - Requires `x-scraper-secret` header authentication
  - Validates and inserts wallet data
  - Used by Python scraper

**Rate Limiting**:
- Global: 1000 requests/hour per IP (prevents abuse)
- Action-specific: Separate limits for GET/STORE
- Cleanup: Periodically removes old rate limit records

**Performance Optimizations**:
- **Parallel database queries**: Latest + historical data fetch simultaneously via Promise.all
- Reduces response time by ~100-200ms

**Security**:
- CORS enabled for web access
- Scraper authentication via secret header
- Input validation (wallet format, numeric bounds)
- RLS policies protect database access

#### `get-spk-price` Function:
**Purpose**: Fetches and caches SPK token price from DefiLlama API

**Features**:
- Checks cache first (2-minute TTL)
- Fetches from DefiLlama on cache miss
- Returns price in USD
- Used for airdrop USD value calculations

### 3. Scraper (Python 3.11 + Selenium + Firefox)

#### Location: `scraper/spark_points_scraper.py`

**Trigger**: GitHub Actions cron job (hourly)

**Workflow**:
1. Fetch active wallets from `get_active_tracked_wallets()` RPC function
2. For each wallet:
   - Launch headless Firefox browser
   - Navigate to https://points.spark.fi/
   - Wait for React app to load (15s)
   - Extract global metrics (Total Points Pool, Total Wallets)
   - Search for specific wallet address
   - Extract wallet-specific data (points, rank, percentile)
   - Close browser
3. Store data via `track-wallet` Edge Function (action: 'store')
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

### 4. Frontend (React 18 + TypeScript + Vite 5)

#### Main Components:

**`Index.tsx`** - Main dashboard page (src/pages/Index.tsx)
- Displays manual wallet tracking button
- Shows all KPI cards and charts
- Manages wallet selection state
- Triggers data fetching on button click
- Shows empty state when no data loaded

**`WalletSelector.tsx`** - Manual track button (src/components/WalletSelector.tsx)
- Reads wallet address from `VITE_WALLET_ADDRESS` environment variable
- Shows "Track Wallet" button initially
- Changes to "Refresh Data" after data loads
- Displays loading spinner while fetching
- No input field - uses environment variable
- **User clicks button → data fetches and displays**

**`useWalletData.ts`** - Data fetching hook (src/hooks/useWalletData.ts)
- **Parallel fetching**: Calls track-wallet + SPK price simultaneously via Promise.all (200-500ms faster)
- Processes raw data into display format
- Calculates derived metrics (growth, changes, projections)
- Handles rate limiting with countdown
- Allows manual refresh (React Query cache prevents unnecessary network calls)
- Uses TanStack React Query with optimized caching:
  - 2-minute stale time (matches SPK price cache TTL)
  - 5-minute garbage collection time
  - No refetch on window focus (reduces API calls)

**`CombinedChart.tsx`** - Historical chart (lazy-loaded)
- **Code splitting**: Lazy-loaded with React.lazy() to reduce initial bundle by ~100KB
- Displays points and rank progression over 30 days
- Uses Recharts 3 for responsive visualizations
- Only loads when user clicks "Track Wallet"

**`AirdropProjectionCard.tsx`** - Airdrop calculator
- Interactive slider to estimate SPK rewards
- Uses live SPK price from DefiLlama
- Shows USD value projections
- Memoized with React.memo for performance

**`ErrorBoundary.tsx`** - Error handling
- Catches React errors gracefully
- Shows user-friendly fallback UI
- Prevents entire app crashes

**`LoadingSkeleton.tsx`** - Loading states
- Skeleton components for better perceived performance
- Displays while data is fetching

#### Data Flow:
1. Page loads with empty state
2. User clicks "Track Wallet" button
3. `handleWalletLoad()` in Index.tsx triggers `searchWallet()`
4. Hook calls Edge Function with wallet address
5. Edge Function fetches from database (latest + history in parallel)
6. SPK price fetched in parallel via separate function
7. Hook processes data and updates state
8. UI re-renders with new data
9. Charts lazy-load on demand

#### Key Metrics Displayed:
- Total Points (current balance)
- Rank (position on leaderboard)
- Percentile (top X%)
- Points Growth (% change + absolute)
- Market Share (% of total points pool)
- Pace Status (outpacing/trailing/keeping pace with pool)
- Airdrop Estimates (interactive slider with SPK price)
- Historical charts (points, rank, market share over time)

### 5. Performance Optimizations

#### Frontend:
- ⚡ **Parallel data fetching**: Wallet data + SPK price load simultaneously (200-500ms faster)
- 📦 **Lazy loading**: CombinedChart component code-splits (~100KB initial bundle reduction)
- 💾 **Smart caching**: React Query prevents unnecessary API calls (2min stale, 5min GC)
- 🎯 **Component memoization**: React.memo on expensive components (AirdropProjectionCard, etc.)
- 🛡️ **Error boundaries**: Graceful error handling with user-friendly fallbacks
- ✨ **Loading skeletons**: Better perceived performance
- 🧹 **Removed unused dependencies**: Smaller bundle size

#### Backend:
- **Parallel database queries**: Latest + historical data fetch simultaneously in Edge Function
- **Price caching**: SPK price cached for 2 minutes to reduce external API calls
- **Efficient RPC functions**: Optimized database queries

### 6. Rate Limiting Strategy

**Why Rate Limits?**
- Prevent abuse of free API
- Protect database from overload
- Limit costs (Edge Function invocations)
- Fair usage across users

**Current Configuration**:
- **Global**: 1000 req/hour per IP
- **GET**: 30 req/minute per wallet (frontend queries)
- **STORE**: 20 req/minute per IP, 2 stores/hour per wallet (scraper writes)

**Rate Limit Flow**:
1. Request arrives at Edge Function
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

### Database → Frontend (Manual Trigger):
```
User clicks "Track Wallet" button
  ↓ (handleWalletLoad → searchWallet)
POST /functions/v1/track-wallet (in parallel with SPK price fetch)
  ↓ (action: 'get', wallet_address)
Edge Function rate-limits & queries
  ↓ (get_latest_wallet_data, get_wallet_history via Promise.all)
Returns latest + 30-day history
  ↓ (processWalletData)
Calculate metrics, growth, projections
  ↓
Update UI state (stats, historyData)
  ↓
Lazy-load CombinedChart component
  ↓
Render dashboard
```

## Security Measures

1. **Authentication**:
   - Scraper uses secret header (`x-scraper-secret`)
   - Frontend uses anon key (limited permissions)
   - Service role key only in Edge Functions (trusted environment)

2. **Rate Limiting**:
   - Prevents DDoS and abuse
   - Separate limits for different actions
   - IP-based global limit

3. **Input Validation**:
   - Wallet address format (`^0x[a-fA-F0-9]{40}$`)
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

## Deployment

### Frontend (Vercel)
- **Production URL**: https://spark-live-show.vercel.app
- **Auto-deploy**: Pushes to main branch trigger automatic deployment
- **Environment Variables**:
  - `VITE_SUPABASE_PROJECT_ID`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_URL`
  - `VITE_WALLET_ADDRESS` (hard-coded wallet for manual tracking)

### Backend (Supabase)
- **Edge Functions**: Deno runtime, deployed separately if needed
- **Database**: PostgreSQL with RLS policies
- **Automatic migrations**: Managed through Supabase dashboard

### Scraper (GitHub Actions)
- Runs hourly automatically
- Uses repository secrets for credentials
- Logs available in GitHub Actions tab

## Configuration Files

### Environment Variables (.env):
```bash
VITE_SUPABASE_URL=https://jubjoxthawbxyxajvlcv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=jubjoxthawbxyxajvlcv
VITE_WALLET_ADDRESS=0x6E65Ce4Cc07fEB24b7D0439422B7FE58b93b9Cf6
```

### Vercel Environment Variables:
Set in Vercel dashboard → Settings → Environment Variables
- All VITE_* variables from .env file

### GitHub Secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SCRAPER_SECRET`

## Design System

### Semantic Tokens
All colors use HSL-based semantic tokens defined in `src/index.css`:
- `--primary` and `--primary-glow` for primary colors
- `--background` and `--foreground` for backgrounds/text
- **Never use direct colors** like `text-white` or `bg-black`
- Always use semantic tokens like `text-foreground` and `bg-background`

### UI Patterns
- **Glassmorphic cards** with backdrop blur and borders
- **Loading states** with skeleton components
- **Error states** with error boundary fallbacks
- **Responsive design** with mobile-first approach

## Monitoring & Debugging

### Edge Function Logs:
- View in Supabase dashboard
- Shows requests, errors, rate limits
- Includes timing information

### Scraper Logs:
- GitHub Actions logs show scraper output
- Check for errors and success rates
- View in repo → Actions tab

### Network Requests:
- Browser DevTools Network tab
- Check response status (200, 429, etc.)
- Inspect request/response bodies

### Database Queries:
- Use Supabase SQL editor
- Check `wallet_tracking` for recent entries
- Verify `tracked_wallets` active status

## Tech Stack Summary

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3
- **UI Library**: Shadcn/ui (Radix UI primitives)
- **Charts**: Recharts 3 (lazy-loaded)
- **Data Fetching**: TanStack React Query 5
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Automation**: GitHub Actions (hourly scraper)
- **Scraper**: Python 3.11, Selenium, Firefox

## Performance Metrics

- **Lighthouse Score**: 95+ on all metrics
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Initial Bundle Size**: ~150KB gzipped (main + CSS)
- **Chart Bundle** (lazy): ~98KB gzipped (loads on-demand)
- **Build Time**: ~13s

## Recent Improvements (2026-01)

### Performance Optimizations:
- ✅ Parallel data fetching (wallet data + SPK price)
- ✅ Lazy loading of CombinedChart component
- ✅ React Query cache optimization (2min stale, 5min GC)
- ✅ Component memoization (React.memo)
- ✅ Error boundaries for graceful error handling
- ✅ Loading skeletons for better UX
- ✅ Parallel database queries in Edge Function

### Feature Updates:
- ✅ Manual wallet tracking (button-triggered, not auto-load)
- ✅ Smart button states (Track Wallet → Refresh Data)
- ✅ Responsive button design (centered, full width on mobile)
- ✅ Removed duplicate search prevention (allows manual refresh)

### Infrastructure:
- ✅ Migrated from Lovable to Vercel deployment
- ✅ Full control over deployment pipeline
- ✅ Updated documentation to reflect current state

## Conclusion

The system successfully:
✅ Scrapes wallet data hourly from Spark Points website
✅ Stores historical data with proper validation
✅ Displays real-time dashboard with calculations
✅ Handles rate limiting gracefully
✅ Supports manual wallet tracking with refresh capability
✅ Maintains security through authentication & RLS
✅ Optimized for performance (parallel fetching, lazy loading, caching)
✅ Deployed on Vercel with automated CI/CD

All components work together to provide automated, reliable wallet tracking for Spark Protocol Season 3 airdrop.
