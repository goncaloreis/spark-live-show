# Spark Points Season 2 - Pay-to-Track Strategy

## Business Model
- **Product**: One-time wallet tracking for Spark Protocol Season 2 airdrop
- **Price**: €19.90 per wallet (one-time payment)
- **Timeline**: Now until December 12, 2025 (Season 2 airdrop deadline)
- **Value**: ~€0.67/day for automated tracking and projections

## Technical Architecture

### Database Changes
- New `tracked_wallets` table to store paid wallets
- Links Stripe payment ID to wallet address
- Expires after Season 2 ends (2025-12-12)

### Payment Flow
1. User searches wallet → Wallet not found in `tracked_wallets`
2. Show "Start Tracking - €19.90" CTA
3. Stripe Checkout collects payment + wallet address
4. Webhook adds wallet to `tracked_wallets`
5. Scraper picks up wallet within 1 hour
6. User sees full dashboard

### Scraper Modifications
- Query `tracked_wallets` for active wallets
- Loop through each wallet hourly
- Store data in existing `wallet_tracking` table

## Key Decisions
- **No user accounts** - just wallet address + payment
- **No free tier** - pay to track, period
- **GitHub Actions** - hourly scraping for all tracked wallets
- **Stripe metadata** - wallet address passed via checkout session
- **Domain**: `spark-season2.saaatoshi.com`

## Implementation Timeline
- **Week 1** (Dec 5-11): Database + Stripe + Scraper
- **Week 2** (Dec 12-18): Frontend + Domain + Testing
- **Launch**: December 19, 2024

## Marketing Copy
**Hero Message**: "Track YOUR wallet's Spark airdrop in real-time. €19.90 one-time • Full Season 2 coverage • Hourly updates until Dec 12, 2025"

**Urgency**: "289 days until Season 2 snapshot. Start tracking now."

## Revenue Projections
- Conservative: 50 wallets = €995
- Moderate: 200 wallets = €3,980
- Optimistic: 500 wallets = €9,950
