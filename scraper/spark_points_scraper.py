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
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime

# Configuration from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
WALLET_ADDRESS = os.environ.get('WALLET_ADDRESS')

def setup_firefox_driver():
    """Configure Firefox driver for headless operation"""
    firefox_options = Options()
    firefox_options.add_argument('--headless')
    firefox_options.add_argument('--no-sandbox')
    firefox_options.add_argument('--disable-dev-shm-usage')
    firefox_options.add_argument('--disable-gpu')
    firefox_options.add_argument('--window-size=1920,1080')
    
    # Set user agent
    firefox_options.set_preference('general.useragent.override', 
                                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0')
    
    # Disable automation flags
    firefox_options.set_preference('dom.webdriver.enabled', False)
    firefox_options.set_preference('useAutomationExtension', False)
    
    # Set log level to reduce noise
    service = Service('/usr/local/bin/geckodriver', log_path='/tmp/geckodriver.log')
    
    try:
        driver = webdriver.Firefox(service=service, options=firefox_options)
        print(f"Firefox driver initialized successfully")
        return driver
    except Exception as e:
        print(f"Failed to initialize Firefox driver: {e}")
        print("Attempting with explicit binary path...")
        
        # Try with explicit binary path as fallback
        firefox_options.binary_location = '/usr/bin/firefox'
        driver = webdriver.Firefox(service=service, options=firefox_options)
        print(f"Firefox driver initialized with explicit binary path")
        return driver

def scrape_spark_points(wallet_address):
    """Scrape Spark Points data for the given wallet"""
    print(f"Starting scrape for wallet: {wallet_address}")
    
    driver = setup_firefox_driver()
    
    try:
        # Navigate to Spark Points page
        url = f"https://points.spark.fi/?wallet={wallet_address}"
        print(f"Navigating to: {url}")
        driver.get(url)
        
        # Wait longer for page to fully load and JavaScript to execute
        print("Waiting for page to load...")
        time.sleep(15)  # Increased wait time for complex React app
        
        # Save a screenshot for debugging
        driver.save_screenshot('/tmp/spark_page.png')
        print("Screenshot saved to /tmp/spark_page.png")
        
        # Get page source for debugging
        page_source = driver.page_source
        print(f"Page title: {driver.title}")
        print(f"Page source length: {len(page_source)} characters")
        
        wait = WebDriverWait(driver, 30)
        
        # Extract all numeric values first
        print("Extracting all numeric values from page...")
        all_numbers = []
        try:
            numeric_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'sc-') or contains(@class, 'text-')]")
            
            for elem in numeric_elements:
                text = elem.text.strip()
                if text and (',' in text or text.replace('.', '').isdigit()):
                    try:
                        cleaned = text.replace(',', '').replace(' ', '')
                        if cleaned.replace('.', '').replace('#', '').isdigit():
                            value = float(cleaned.replace('#', ''))
                            if value > 0:
                                all_numbers.append(value)
                                print(f"Found numeric value: {value}")
                    except ValueError:
                        continue
        except Exception as e:
            print(f"Error extracting numbers: {e}")
        
        # Sort numbers to identify different metrics
        all_numbers.sort()
        print(f"All numbers found (sorted): {all_numbers}")
        
        # Extract Wallet Points (user's points - typically in millions, 1-10M range)
        try:
            print("Searching for wallet points...")
            total_points = 0
            for num in all_numbers:
                if 100000 < num < 50000000:  # Between 100K and 50M (user points range)
                    total_points = num
                    print(f"✓ Found wallet points: {total_points}")
                    break
            
            if total_points == 0:
                print("No valid points found, defaulting to 0")
                
        except Exception as e:
            print(f"Error finding wallet points: {e}")
            total_points = 0
        
        # Extract Rank
        try:
            print("Searching for rank...")
            # Look for numbers with # prefix or standalone numbers (typically 4-6 digits)
            rank_elements = driver.find_elements(By.XPATH, "//*[contains(text(), '#') or contains(@class, 'rank')]")
            
            for elem in rank_elements:
                text = elem.text.strip()
                if '#' in text:
                    try:
                        rank_text = text.replace('#', '').replace(',', '').strip()
                        if rank_text.isdigit():
                            rank = int(rank_text)
                            print(f"✓ Found rank: {rank}")
                            break
                    except ValueError:
                        continue
            else:
                print("No rank found, defaulting to 0")
                rank = 0
                
        except Exception as e:
            print(f"Error finding rank: {e}")
            rank = 0
        
        # Extract Total Wallets (typically 10,000-20,000 range)
        try:
            print("Searching for total wallets...")
            total_wallets = 0
            for num in all_numbers:
                if 5000 <= num <= 50000:  # Between 5K and 50K (wallet count range)
                    total_wallets = int(num)
                    print(f"✓ Found total wallets: {total_wallets}")
                    break
            
            if total_wallets == 0:
                print("No total wallets found, defaulting to 0")
                
        except Exception as e:
            print(f"Error finding total wallets: {e}")
            total_wallets = 0
        
        # Extract Total Points Pool (very large number, typically 100B+ range)
        try:
            print("Searching for total points pool...")
            total_points_pool = 0
            for num in reversed(all_numbers):  # Start from largest
                if num > 1000000000:  # Larger than 1 billion (pool range)
                    total_points_pool = num
                    print(f"✓ Found total points pool: {total_points_pool}")
                    break
            
            if total_points_pool == 0:
                print("No total points pool found, defaulting to 0")
                
        except Exception as e:
            print(f"Error finding total points pool: {e}")
            total_points_pool = 0
        
        # Calculate percentile if we have rank and total wallets
        if rank > 0 and total_wallets > 0:
            percentile_value = ((total_wallets - rank) / total_wallets) * 100
            percentile = f"Top {100 - percentile_value:.2f}%"
        else:
            percentile = "N/A"
        
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
        import traceback
        traceback.print_exc()
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
        'wallet_address': wallet_address,  # Use snake_case to match edge function
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
