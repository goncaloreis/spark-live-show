# Spark Points Scraper

Automated scraper that runs every hour via GitHub Actions to track Spark Points data.

## Setup

1. **Connect your Lovable project to GitHub:**
   - Click GitHub → Connect to GitHub in Lovable
   - Create a new repository

2. **Add GitHub Secrets:**
   Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   
   Add these three secrets:
   - `SUPABASE_URL`: `https://jubjoxthawbxyxajvlcv.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YmpveHRoYXdieHl4YWp2bGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDk5MjYsImV4cCI6MjA3NTU4NTkyNn0.YFHsGtwuOdzqL7rDRSlg6j5Xx4urvoRXLc4uFWNDcTE`
   - `WALLET_ADDRESS`: `0x6E65Ce4Cc07fEB24b7D0439422B7FE58b93b9Cf6`

3. **Update CSS Selectors:**
   - Open `scraper/spark_points_scraper.py`
   - Visit `https://app.spark.fi/points?wallet=YOUR_WALLET` in a browser
   - Right-click elements and "Inspect" to find the correct CSS selectors
   - Update the selectors in the `scrape_spark_points()` function

## Testing

### Test Locally (Optional)
```bash
export SUPABASE_URL="https://jubjoxthawbxyxajvlcv.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key"
export WALLET_ADDRESS="0x6E65Ce4Cc07fEB24b7D0439422B7FE58b93b9Cf6"
python scraper/spark_points_scraper.py
```

### Test on GitHub
- Go to Actions → Scrape Spark Points → Run workflow
- Click "Run workflow" to trigger a manual run

## Schedule

The scraper runs automatically:
- **Every hour** at minute 0 (e.g., 1:00 PM, 2:00 PM, 3:00 PM)
- Can also be triggered manually from GitHub Actions

## How It Works

1. GitHub Actions spins up a Ubuntu VM
2. Installs Chrome + ChromeDriver
3. Runs the Python scraper with Selenium
4. Scrapes data from app.spark.fi/points
5. Stores data in Supabase via the track-wallet function
6. Your dashboard automatically shows the new data

## Monitoring

- Check scraper runs: GitHub repo → Actions tab
- View logs: Click any workflow run to see detailed logs
- Check stored data: Your Lovable app dashboard or Lovable Cloud → Database

## Troubleshooting

**Scraper fails to find elements:**
- The CSS selectors may have changed
- Inspect the page and update selectors in the Python script

**Data not appearing in dashboard:**
- Check GitHub Actions logs for errors
- Verify secrets are set correctly
- Check Lovable Cloud → Logs for track-wallet function errors
