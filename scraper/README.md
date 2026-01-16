# Spark Points Scraper

Automated Python scraper that runs hourly via GitHub Actions to track Spark Protocol Season 3 points data.

## Overview

The scraper automatically fetches wallet data from the Spark Protocol points website and stores it in Supabase for historical tracking and analysis.

**Live Dashboard**: https://spark-live-show.vercel.app

## How It Works

1. **GitHub Actions** triggers the scraper hourly (or manually)
2. **Scraper queries** `tracked_wallets` table in Supabase to get active wallets
3. **For each wallet**, scraper:
   - Launches headless Firefox browser
   - Navigates to https://points.spark.fi/
   - Waits for React app to load
   - Extracts wallet data (points, rank, percentile)
   - Stores data in `wallet_tracking` table via Edge Function
4. **Dashboard** displays the historical data with charts and analytics

## Setup

### 1. GitHub Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these three secrets:

| Secret Name | Value | Purpose |
|------------|-------|---------|
| `SUPABASE_URL` | `https://jubjoxthawbxyxajvlcv.supabase.co` | Supabase backend URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase public API key |
| `SCRAPER_SECRET` | `your-secret-key` | Authentication for scraper writes |

**Note**: The `SCRAPER_SECRET` must match the secret configured in your Supabase Edge Function environment variables.

### 2. Add Wallets to Track

Connect to your Supabase database and run:

```sql
INSERT INTO tracked_wallets (wallet_address, is_active, notes)
VALUES ('0xYourWalletAddress', true, 'Optional description');
```

The scraper will automatically pick up this wallet on the next hourly run.

### 3. Verify Workflow File

The scraper workflow is defined in `.github/workflows/scrape-spark-points.yml`:

```yaml
name: Scrape Spark Points
on:
  schedule:
    - cron: '0 * * * *'  # Every hour at minute 0
  workflow_dispatch:      # Manual trigger
```

## Testing

### Test Manually via GitHub Actions

1. Go to your GitHub repository → **Actions** tab
2. Click **Scrape Spark Points** workflow
3. Click **Run workflow** button
4. Select the branch and click **Run workflow**
5. Wait for the workflow to complete
6. Check the logs for success/failure

### Test Locally (Optional)

**Requirements**:
- Python 3.11+
- Firefox browser installed
- Geckodriver installed

**Steps**:

```bash
# Install dependencies
pip install selenium requests

# Set environment variables
export SUPABASE_URL="https://jubjoxthawbxyxajvlcv.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key"
export SCRAPER_SECRET="your_scraper_secret"

# Run scraper
python scraper/spark_points_scraper.py
```

**Note**: Local testing will use your local Firefox browser. The GitHub Actions workflow uses a headless Firefox instance.

## Schedule

The scraper runs automatically:
- **Every hour** at minute 0 (1:00 AM, 2:00 AM, 3:00 AM, etc.)
- **Manual trigger** available via GitHub Actions UI
- **All times** are in UTC

## Monitoring

### Check Scraper Status

1. **GitHub Actions Logs**:
   - Go to repo → **Actions** tab
   - Click on any workflow run
   - View detailed logs of scraper execution
   - Check for errors or warnings

2. **Supabase Edge Function Logs**:
   - Go to Supabase dashboard
   - Navigate to **Edge Functions** → **track-wallet**
   - View recent invocations and errors

3. **Database Data**:
   - Query `wallet_tracking` table to see recent entries
   - Verify data is being inserted hourly

```sql
-- Check recent scraper runs
SELECT wallet_address, total_points, rank, created_at
FROM wallet_tracking
ORDER BY created_at DESC
LIMIT 10;
```

### Success Indicators

- ✅ Workflow completes without errors
- ✅ New entries appear in `wallet_tracking` table hourly
- ✅ Dashboard displays updated data
- ✅ No rate limit errors in logs

## Troubleshooting

### Scraper Fails to Find Elements

**Cause**: The CSS selectors in the scraper may have changed on the Spark Protocol website.

**Fix**:
1. Visit https://points.spark.fi/ in your browser
2. Right-click elements and select **Inspect**
3. Find the correct CSS selectors
4. Update `scraper/spark_points_scraper.py` with new selectors
5. Commit and push changes

### Data Not Appearing in Dashboard

**Checklist**:
- [ ] Check GitHub Actions logs for errors
- [ ] Verify secrets are set correctly in GitHub
- [ ] Check Supabase Edge Function logs for errors
- [ ] Verify wallet is in `tracked_wallets` table with `is_active = true`
- [ ] Check if rate limiting is blocking requests

### Rate Limit Errors

**Cause**: Too many requests to Edge Function or Spark Protocol website.

**Fix**:
- Wait for rate limit window to expire
- Check if multiple scrapers are running simultaneously
- Verify rate limit settings in Edge Function

### Authentication Errors

**Cause**: `SCRAPER_SECRET` mismatch between GitHub secret and Edge Function.

**Fix**:
1. Verify `SCRAPER_SECRET` in GitHub repository secrets
2. Verify matching secret in Supabase Edge Function environment variables
3. Update both to match if different

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                       │
│  (Runs hourly via cron schedule)                        │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Python Scraper                             │
│  1. Query tracked_wallets for active wallets           │
│  2. For each wallet:                                    │
│     - Launch Firefox (headless)                         │
│     - Navigate to points.spark.fi                       │
│     - Extract wallet data                               │
│     - Close browser                                     │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│          Supabase Edge Function                         │
│  (track-wallet with action: 'store')                    │
│  - Authenticates via x-scraper-secret header            │
│  - Validates wallet data                                │
│  - Inserts into wallet_tracking table                   │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│            Supabase PostgreSQL                          │
│  wallet_tracking table stores historical data           │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│               Vercel Dashboard                          │
│  (https://spark-live-show.vercel.app)                   │
│  Displays charts and analytics from historical data     │
└─────────────────────────────────────────────────────────┘
```

## Files

- **`.github/workflows/scrape-spark-points.yml`**: GitHub Actions workflow definition
- **`scraper/spark_points_scraper.py`**: Main scraper script (Python + Selenium)
- **`scraper/README.md`**: This file

## Dependencies

The GitHub Actions workflow automatically installs:
- **Python 3.11**
- **Firefox** browser
- **Geckodriver** (Selenium WebDriver for Firefox)
- **Python packages**: `selenium`, `requests`

## Security

- **Secrets Management**: All sensitive data stored in GitHub Secrets
- **Authentication**: Scraper authenticates via `x-scraper-secret` header
- **Rate Limiting**: Edge Function enforces rate limits on STORE action
- **Wallet Masking**: Wallet addresses are masked in logs for privacy

## Future Improvements

- Add retry logic for network failures
- Implement parallel scraping for multiple wallets
- Add alerting for consecutive failures
- Store screenshots on error for debugging
- Add Slack/Discord notifications on failure

## Support

For issues with the scraper:
1. Check GitHub Actions logs
2. Verify GitHub Secrets are set correctly
3. Check Supabase Edge Function logs
4. Open an issue on GitHub with error details
