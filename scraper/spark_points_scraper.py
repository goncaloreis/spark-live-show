#!/usr/bin/env python3
"""
Spark Points Scraper for GitHub Actions
Scrapes wallet data from app.spark.fi/points and stores in Supabase
"""

import os
import sys
import json
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime

# Configuration from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
WALLET_ADDRESS = os.environ.get('WALLET_ADDRESS')

def setup_chrome_driver():
    """Configure Chrome driver for headless operation"""
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def scrape_spark_points(wallet_address):
    """Scrape Spark Points data for the given wallet"""
    print(f"Starting scrape for wallet: {wallet_address}")
    
    driver = setup_chrome_driver()
    
    try:
        # Navigate to Spark Points page
        url = f"https://app.spark.fi/points?wallet={wallet_address}"
        print(f"Navigating to: {url}")
        driver.get(url)
        
        # Wait for page to load
        time.sleep(5)
        
        # Wait for key elements to be present
        wait = WebDriverWait(driver, 20)
        
        # Extract data - adjust selectors based on actual HTML structure
        # These are example selectors - you'll need to inspect the page to get the correct ones
        try:
            total_points_element = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="total-points"], .points-value, .total-points'))
            )
            total_points = float(total_points_element.text.replace(',', '').strip())
        except:
            print("Could not find total points element")
            total_points = 0
        
        try:
            rank_element = driver.find_element(By.CSS_SELECTOR, '[data-testid="rank"], .rank-value, .rank')
            rank = int(rank_element.text.replace(',', '').replace('#', '').strip())
        except:
            print("Could not find rank element")
            rank = 0
        
        try:
            percentile_element = driver.find_element(By.CSS_SELECTOR, '[data-testid="percentile"], .percentile-value, .percentile')
            percentile = percentile_element.text.strip()
        except:
            print("Could not find percentile element")
            percentile = "N/A"
        
        try:
            total_wallets_element = driver.find_element(By.CSS_SELECTOR, '[data-testid="total-wallets"], .total-wallets-value, .total-wallets')
            total_wallets = int(total_wallets_element.text.replace(',', '').strip())
        except:
            print("Could not find total wallets element")
            total_wallets = 0
        
        try:
            total_pool_element = driver.find_element(By.CSS_SELECTOR, '[data-testid="total-pool"], .total-pool-value, .total-points-pool')
            total_points_pool = float(total_pool_element.text.replace(',', '').strip())
        except:
            print("Could not find total points pool element")
            total_points_pool = 0
        
        result = {
            'total_points': total_points,
            'rank': rank,
            'percentile': percentile,
            'total_wallets': total_wallets,
            'total_points_pool': total_points_pool
        }
        
        print(f"Scraped data: {result}")
        return result
        
    except Exception as e:
        print(f"Error during scraping: {e}")
        raise
    finally:
        driver.quit()

def store_data_in_supabase(wallet_address, data):
    """Store scraped data in Supabase via track-wallet function"""
    print("Storing data in Supabase...")
    
    url = f"{SUPABASE_URL}/functions/v1/track-wallet"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'apikey': SUPABASE_ANON_KEY
    }
    
    payload = {
        'action': 'store',
        'walletAddress': wallet_address,
        **data
    }
    
    print(f"Calling track-wallet function with payload: {payload}")
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        print("Data stored successfully!")
        print(f"Response: {response.json()}")
        return True
    else:
        print(f"Error storing data: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    """Main execution function"""
    print("=" * 60)
    print("Spark Points Scraper - GitHub Actions")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Validate environment variables
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not WALLET_ADDRESS:
        print("ERROR: Missing required environment variables!")
        print(f"SUPABASE_URL: {'✓' if SUPABASE_URL else '✗'}")
        print(f"SUPABASE_ANON_KEY: {'✓' if SUPABASE_ANON_KEY else '✗'}")
        print(f"WALLET_ADDRESS: {'✓' if WALLET_ADDRESS else '✗'}")
        sys.exit(1)
    
    try:
        # Scrape data
        data = scrape_spark_points(WALLET_ADDRESS)
        
        # Store in Supabase
        success = store_data_in_supabase(WALLET_ADDRESS, data)
        
        if success:
            print("\n✓ Scraping completed successfully!")
            sys.exit(0)
        else:
            print("\n✗ Failed to store data")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n✗ Scraping failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
