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
    firefox_options.add_argument('--window-size=1920,1080')
    firefox_options.set_preference('general.useragent.override', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0')
    
    # Set Firefox binary location (GitHub Actions path)
    firefox_options.binary_location = '/usr/bin/firefox'
    
    driver = webdriver.Firefox(options=firefox_options)
    return driver

def scrape_spark_points(wallet_address):
    """Scrape Spark Points data for the given wallet"""
    print(f"Starting scrape for wallet: {wallet_address}")
    
    driver = setup_firefox_driver()
    
    try:
        # Navigate to Spark Points page
        url = f"https://app.spark.fi/points?wallet={wallet_address}"
        print(f"Navigating to: {url}")
        driver.get(url)
        
        # Wait for page to load and content to render
        time.sleep(8)
        
        wait = WebDriverWait(driver, 30)
        
        # Extract Wallet Points (Total Points)
        try:
            wallet_points_selector = "#root > div > div.sc-Qotzb.dRXxJt.sc-gAqISa.gUfpTz > main > div > div.sc-Qotzb.gtSipa > div.sc-Qotzb.eMnBgD > div > div:nth-child(2) > div.sc-Qotzb.bASAzC > div > div > div > div > div > span:nth-child(3)"
            wallet_points_element = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, wallet_points_selector))
            )
            total_points = float(wallet_points_element.text.replace(',', '').strip())
            print(f"Found wallet points: {total_points}")
        except Exception as e:
            print(f"Could not find wallet points with primary selector: {e}")
            # Fallback: try to find by text content
            try:
                elements = driver.find_elements(By.XPATH, "//span[contains(@class, 'sc-Qotzb')]")
                for elem in elements:
                    text = elem.text.strip()
                    if text and ',' in text and text.replace(',', '').replace('.', '').isdigit():
                        total_points = float(text.replace(',', ''))
                        print(f"Found wallet points via fallback: {total_points}")
                        break
                else:
                    total_points = 0
            except:
                total_points = 0
        
        # Extract Rank
        try:
            rank_selector = "#root > div > div.sc-Qotzb.dRXxJt.sc-gAqISa.gUfpTz > main > div > div.sc-Qotzb.gtSipa > div.sc-Qotzb.eMnBgD > div > div:nth-child(2) > div.sc-Qotzb.elVobP > div"
            rank_element = driver.find_element(By.CSS_SELECTOR, rank_selector)
            rank_text = rank_element.text.replace(',', '').replace('#', '').strip()
            rank = int(rank_text)
            print(f"Found rank: {rank}")
        except Exception as e:
            print(f"Could not find rank with primary selector: {e}")
            # Fallback: look for elements containing rank-like numbers
            try:
                elements = driver.find_elements(By.XPATH, "//div[contains(@class, 'sc-Qotzb')]")
                for elem in elements:
                    text = elem.text.strip()
                    if text.startswith('#') or (text.isdigit() and len(text) <= 6):
                        rank = int(text.replace('#', '').replace(',', ''))
                        print(f"Found rank via fallback: {rank}")
                        break
                else:
                    rank = 0
            except:
                rank = 0
        
        # Extract Total Wallets
        try:
            total_wallets_selector = "#root > div > div.sc-Qotzb.dRXxJt.sc-gAqISa.gUfpTz > main > div > div.sc-Qotzb.kKIjLn > div:nth-child(2) > div > div > div.sc-Qotzb.fdPbwR > div > div.sc-Qotzb.fPnMAI > div > div > div > div > div > div.sc-Qotzb.bsZMvR > span"
            total_wallets_element = driver.find_element(By.CSS_SELECTOR, total_wallets_selector)
            total_wallets = int(total_wallets_element.text.replace(',', '').strip())
            print(f"Found total wallets: {total_wallets}")
        except Exception as e:
            print(f"Could not find total wallets: {e}")
            total_wallets = 0
        
        # Extract Total Points Pool
        try:
            total_points_selector = "#root > div > div.sc-Qotzb.dRXxJt.sc-gAqISa.gUfpTz > main > div > div.sc-Qotzb.kKIjLn > div:nth-child(1) > div > div > div.sc-Qotzb.fdPbwR > div > div.sc-Qotzb.fPnMAI > div > div > div > div > div > div.sc-Qotzb.bsZMvR > span.sc-Qotzb.jLxnRH"
            total_pool_element = driver.find_element(By.CSS_SELECTOR, total_points_selector)
            total_points_pool = float(total_pool_element.text.replace(',', '').strip())
            print(f"Found total points pool: {total_points_pool}")
        except Exception as e:
            print(f"Could not find total points pool: {e}")
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
