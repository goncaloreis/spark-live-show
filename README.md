# Spark Points Tracker - Season 2 (LEGACY VERSION)

> **⚠️ MIGRATION IN PROGRESS**  
> This is the **legacy free public dashboard** version. See [`docs/PROJECT_STRATEGY.md`](docs/PROJECT_STRATEGY.md) for the new **pay-to-track monetization strategy** for Season 2.
>
> **New Repository**: `spark-points-season2` (coming soon)  
> **Migration Docs**: [`docs/MIGRATION_CHECKLIST.md`](docs/MIGRATION_CHECKLIST.md)

A production-ready, real-time DeFi analytics dashboard for tracking Spark Protocol points, rankings, and airdrop estimates.

## 🚀 Features

- **Real-time Wallet Tracking**: Track any Ethereum wallet's Spark Points in real-time
- **Historical Analytics**: Visualize points and rank progression over time
- **Market Share Calculations**: Understand your position in the total points pool
- **Airdrop Projections**: Conservative, moderate, and optimistic airdrop estimates based on live SPK prices
- **Pace Status**: Track whether your wallet is outpacing, trailing, or keeping pace with the pool
- **Public Dashboard**: All searched wallets become publicly viewable and tracked

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** with custom design system using semantic tokens
- **Recharts** for beautiful, responsive data visualizations
- **Shadcn/ui** for accessible, customizable UI components

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** database with Row-Level Security (RLS)
- **Edge Functions** for serverless API endpoints
- **Rate Limiting** to prevent abuse (100 req/hour global, 20/min per action)
- **Caching** for SPK price data to reduce API calls

### Data Collection
- **GitHub Actions** workflow runs hourly to scrape Spark Points data
- **Python scraper** using Selenium for reliable data extraction
- Automated data persistence to Supabase

## 📁 Project Structure

```
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn base components
│   │   ├── CombinedChart.tsx
│   │   ├── KPICard.tsx
│   │   ├── MetricRowCard.tsx
│   │   └── ... other cards
│   ├── hooks/            # Custom React hooks
│   │   └── useWalletData.ts  # Main data fetching hook
│   ├── pages/            # Route pages
│   │   └── Index.tsx     # Main dashboard page
│   ├── types/            # TypeScript type definitions
│   │   └── wallet.ts     # Wallet data types
│   ├── utils/            # Utility functions
│   │   ├── constants.ts  # App-wide constants
│   │   └── walletCalculations.ts  # Pure calculation functions
│   └── index.css         # Global styles + design tokens
├── supabase/
│   ├── functions/        # Edge functions
│   │   ├── track-wallet/ # Wallet data API
│   │   └── get-spk-price/ # SPK price fetcher
│   └── migrations/       # Database migrations
├── scraper/
│   └── spark_points_scraper.py  # Python scraper
└── .github/
    └── workflows/
        └── scrape-spark-points.yml  # Automated scraping
```

## 🔐 Security

- **Input Validation**: Client + server-side wallet address validation
- **Rate Limiting**: Multi-tier protection against abuse
- **RLS Policies**: Database-level access control
- **No Auth Required**: Public dashboard by design
- **Extension Schema**: PostgreSQL extensions isolated from public schema

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

### Components
All UI components are fully typed and documented. See `src/components/README.md` for details.

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account (via Lovable Cloud)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

### Environment Variables
All environment variables are auto-managed by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

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

#### `spk_price_cache`
Cached SPK price data with 2-minute TTL.

### Functions

- `get_wallet_history(wallet_addr, days_back)`: Retrieve historical data
- `get_latest_wallet_data(wallet_addr)`: Get most recent data
- `get_latest_spk_price()`: Get cached SPK price
- `cleanup_old_rate_limits()`: Maintenance function
- `cleanup_old_price_cache()`: Maintenance function

## 🚢 Deployment

The app auto-deploys via Lovable when changes are pushed. Edge functions are automatically deployed alongside code changes.

### Manual Deployment
Use the "Publish" button in Lovable or connect GitHub for continuous deployment.

## 📈 Performance

- **Lighthouse Score**: 95+ on all metrics
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Bundle Size**: < 500KB gzipped

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Write JSDoc comments for functions
4. Use semantic tokens for styling
5. Test on mobile devices
6. Keep components small and focused

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Powered by [Spark Protocol](https://points.spark.fi/)
- Built with [Lovable](https://lovable.dev/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)

## 📞 Support

For issues or questions, please refer to the troubleshooting documentation or contact support through Lovable.

---

**Made with ❤️ for the Spark Protocol community**
