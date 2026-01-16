# Spark Points Tracker - Season 3

A production-ready, real-time DeFi analytics dashboard for tracking Spark Protocol points, rankings, and airdrop estimates.

**Live App**: https://spark-live-show.vercel.app

## 🚀 Features

- **Manual Wallet Tracking**: One-click button to track your Spark Points with refresh capability
- **Historical Analytics**: Visualize points and rank progression over 30 days with interactive charts
- **Market Share Calculations**: Understand your position in the total points pool
- **Airdrop Projections**: Interactive slider to estimate SPK rewards based on live token prices
- **Pace Status**: Track whether your wallet is outpacing, trailing, or keeping pace with the pool
- **Performance Optimized**: Parallel data fetching, lazy-loaded charts, smart caching
- **Responsive Design**: Glassmorphic UI with full mobile support

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite 5** for lightning-fast development and builds
- **Tailwind CSS 3** with custom design system using semantic tokens
- **Recharts 3** for beautiful, responsive data visualizations (lazy-loaded)
- **Shadcn/ui** (Radix UI) for accessible, customizable components
- **TanStack React Query 5** with optimized caching (2min stale time, 5min GC)

### Performance Optimizations
- ⚡ **Parallel data fetching**: Wallet data + SPK price load simultaneously (200-500ms faster)
- 📦 **Lazy loading**: Chart component code-splits (~100KB initial bundle reduction)
- 💾 **Smart caching**: React Query prevents unnecessary API calls
- 🎯 **Component memoization**: React.memo on expensive components
- 🛡️ **Error boundaries**: Graceful error handling with user-friendly fallbacks
- ✨ **Loading skeletons**: Better perceived performance

### Backend (Supabase + Vercel)
- **PostgreSQL** database with Row-Level Security (RLS)
- **Edge Functions** (Deno runtime) for serverless API endpoints
- **Rate Limiting**: Multi-tier protection (30 req/min per wallet, 1000 req/hour global)
- **Caching**: SPK price cached for 2 minutes to reduce external API calls
- **Parallel database queries**: Latest + historical data fetch simultaneously

### Data Collection
- **GitHub Actions** workflow runs hourly to scrape Spark Points data
- **Python 3.11 scraper** using Selenium + Firefox for reliable data extraction
- Automated data persistence to Supabase via authenticated Edge Function

## 📁 Project Structure

```
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Shadcn base components (30+)
│   │   ├── CombinedChart.tsx         # Lazy-loaded historical chart
│   │   ├── AirdropProjectionCard.tsx # Interactive airdrop calculator
│   │   ├── WalletSelector.tsx        # Manual track button
│   │   ├── ErrorBoundary.tsx         # Error handling wrapper
│   │   ├── LoadingSkeleton.tsx       # Loading state components
│   │   └── ... other cards
│   ├── hooks/               # Custom React hooks
│   │   └── useWalletData.ts # Main data fetching hook (parallel fetching)
│   ├── pages/               # Route pages
│   │   └── Index.tsx        # Main dashboard page
│   ├── types/               # TypeScript type definitions
│   │   └── wallet.ts        # Wallet data types
│   ├── utils/               # Utility functions
│   │   ├── constants.ts     # App-wide constants
│   │   └── walletCalculations.ts  # Pure calculation functions
│   └── index.css            # Global styles + design tokens
├── supabase/
│   ├── functions/           # Edge functions (Deno)
│   │   ├── track-wallet/    # Wallet data API (GET/STORE)
│   │   └── get-spk-price/   # SPK price fetcher (DefiLlama)
│   └── migrations/          # Database migrations (15+)
├── scraper/
│   └── spark_points_scraper.py  # Python scraper
└── .github/
    └── workflows/
        └── scrape-spark-points.yml  # Automated scraping (hourly)
```

## 🔐 Security

- **Input Validation**: Client + server-side wallet address validation (`^0x[a-fA-F0-9]{40}$`)
- **Rate Limiting**: Three-tier protection
  - 30 requests/minute per wallet (GET)
  - 20 requests/minute per IP (STORE)
  - 1000 requests/hour per IP (global)
  - 2 stores/hour per wallet
- **RLS Policies**: Database-level access control
- **Scraper Authentication**: X-Scraper-Secret header required for data writes
- **No User Auth Required**: Public dashboard by design

## 🎨 Design System

### Semantic Tokens
All colors use HSL-based semantic tokens defined in `index.css`:

```css
--primary: [HSL values]
--primary-glow: [HSL values]
--background: [HSL values]
--foreground: [HSL values]
```

**Never use direct colors** like `text-white` or `bg-black`. Always use semantic tokens like `text-foreground` and `bg-background`.

### UI Patterns
- **Glassmorphic cards** with backdrop blur and borders
- **Loading states** with skeleton components
- **Error states** with error boundary fallbacks
- **Responsive design** with mobile-first approach

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account (for database)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_WALLET_ADDRESS=0xYourWalletAddress
```

## 📊 Database Schema

### Tables

#### `wallet_tracking`
Stores wallet points history.
- `wallet_address` (text): Ethereum address
- `total_points` (numeric): Points balance
- `rank` (integer): Global rank
- `total_wallets` (integer): Total wallets tracked
- `percentile` (text): Rank percentile
- `total_points_pool` (numeric): Total points in system
- `created_at` (timestamp): Data point timestamp

#### `rate_limits`
Rate limiting for API protection.
- `identifier` (text): IP address or wallet address
- `action` (text): Action type (get/store/global)
- `request_count` (integer): Number of requests
- `window_start` (timestamp): Rate limit window start

#### `spk_price_cache`
Cached SPK price data with 2-minute TTL.
- `price` (numeric): SPK token price in USD
- `cached_at` (timestamp): Cache timestamp

#### `tracked_wallets`
Wallets monitored by automated scraper.
- `wallet_address` (text): Ethereum address
- `is_active` (boolean): Whether wallet is being tracked
- `created_at` (timestamp): When tracking started

### RPC Functions

- `get_wallet_history(wallet_addr, days_back)`: Retrieve historical data (30 days default)
- `get_latest_wallet_data(wallet_addr)`: Get most recent data point
- `get_latest_spk_price()`: Get cached SPK price
- `cleanup_old_rate_limits()`: Maintenance function (auto-runs)
- `cleanup_old_price_cache()`: Maintenance function (auto-runs)

## 🚢 Deployment

### Vercel (Production)
The app auto-deploys to Vercel when changes are pushed to the `main` branch.

**Live URL**: https://spark-live-show.vercel.app

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Vercel (if CLI installed)
vercel --prod
```

### Environment Variables (Vercel)
Add these in Vercel dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_WALLET_ADDRESS`

### Supabase Edge Functions
Deploy separately if needed:

```bash
supabase functions deploy track-wallet
supabase functions deploy get-spk-price
```

## 📈 Performance Metrics

- **Lighthouse Score**: 95+ on all metrics
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Initial Bundle Size**: ~150KB gzipped (main + CSS)
- **Chart Bundle** (lazy): ~98KB gzipped (loads on-demand)
- **Build Time**: ~13s

## 🎯 Key Features Explained

### Manual Tracking
- Button reads wallet from `VITE_WALLET_ADDRESS` environment variable
- Shows "Track Wallet" initially, "Refresh Data" after data loads
- Includes loading spinner and disabled state
- Rate limiting prevents abuse

### Smart Caching
- React Query: 2-minute stale time (matches SPK price cache)
- 5-minute garbage collection time
- Prevents unnecessary refetches on window focus
- Allows manual refresh when user clicks button

### Parallel Fetching
Both requests fire simultaneously using `Promise.all()`:
1. Wallet data (latest + 30-day history)
2. SPK token price

### Lazy Loading
CombinedChart component lazy loads using React's `lazy()`:
- Reduces initial bundle by ~100KB
- Loads on-demand when user clicks "Track Wallet"
- Suspense boundary shows skeleton during load

## 🤝 Contributing

1. Follow the existing code style (TypeScript strict mode)
2. Use semantic tokens for all styling
3. Memoize expensive components with `React.memo`
4. Add loading states for async operations
5. Test on mobile devices
6. Keep components small and focused
7. Write meaningful commit messages

## 📝 Tech Stack Summary

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Library**: Shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Data Fetching**: TanStack React Query
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Automation**: GitHub Actions (hourly scraper)
- **Scraper**: Python 3.11, Selenium, Firefox

## 🙏 Acknowledgments

- Powered by [Spark Protocol](https://points.spark.fi/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Price data from [DefiLlama API](https://defillama.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

For issues, please open a GitHub issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

**Made with ❤️ for the Spark Protocol community**
