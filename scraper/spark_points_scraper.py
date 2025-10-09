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
from selenium.webdriver.common.keys import Keys
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
    
    # Sanitize wallet address
    from urllib.parse import quote
    wallet_address = wallet_address.strip().lower()
    
    driver = setup_firefox_driver()
    
    try:
        # Navigate to Spark Points page with URL encoding
        url = f"https://points.spark.fi/?wallet={quote(wallet_address)}"
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
        
        # Extract Total Points Pool from the header
        try:
            print("Searching for total points pool...")
            total_points_pool = 0
            pool_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Total Points')]/following-sibling::*")
            
            for elem in pool_elements:
                text = elem.text.strip().replace(',', '')
                try:
                    # The pool is a very large number (145B+)
                    if text.replace('.', '').isdigit():
                        value = float(text)
                        if value > 1000000000:  # Greater than 1 billion
                            total_points_pool = value
                            print(f"✓ Found total points pool: {total_points_pool}")
                            break
                except ValueError:
                    continue
                    
            if total_points_pool == 0:
                print("Warning: Total points pool not found")
        except Exception as e:
            print(f"Error finding total points pool: {e}")
            total_points_pool = 0
        
        # Extract Total Wallets from the header
        try:
            print("Searching for total wallets...")
            total_wallets = 0
            wallet_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'N° of Wallets') or contains(text(), 'of Wallets')]/following-sibling::*")
            
            for elem in wallet_elements:
                text = elem.text.strip().replace(',', '')
                try:
                    if text.isdigit():
                        value = int(text)
                        if 1000 <= value <= 100000:  # Between 1K and 100K
                            total_wallets = value
                            print(f"✓ Found total wallets: {total_wallets}")
                            break
                except ValueError:
                    continue
                    
            if total_wallets == 0:
                print("Warning: Total wallets not found")
        except Exception as e:
            print(f"Error finding total wallets: {e}")
            total_wallets = 0
        
        # Use the search box to find the wallet (using working approach from original script)
        try:
            print(f"Using search box to find wallet {wallet_address}...")
            
            # Find the search input box using a more flexible selector
            search_input = wait.until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='Search']"))
            )
            
            print("✓ Found search input")
            
            # Clear and enter wallet address, then press Enter
            search_input.clear()
            search_input.send_keys(wallet_address)
            search_input.send_keys(Keys.ENTER)
            print(f"✓ Entered wallet address and pressed Enter")
            
            # Wait for search results to load
            time.sleep(3)
            
            # Take screenshot after search
            driver.save_screenshot('/tmp/spark_page_search.png')
            print("Screenshot saved to /tmp/spark_page_search.png")
            
            # Find the wallet row using the shortened format (like original script)
            wallet_substring = f"{wallet_address[:6]}...{wallet_address[-4:]}".lower()
            print(f"Looking for wallet substring: {wallet_substring}")
            
            your_row_xpath = f"//div[contains(., '{wallet_substring}')]/ancestor::div[@name='tableRow']"
            your_row_element = wait.until(
                EC.visibility_of_element_located((By.XPATH, your_row_xpath))
            )
            print(f"✓ Found wallet row")
            
            # Extract rank using class selector (from original script)
            rank = 0
            total_points = 0
            
            try:
                rank_element = your_row_element.find_element(By.XPATH, ".//div[contains(@class, 'elVobP')]")
                rank_text = rank_element.text.strip()
                rank = int(rank_text.replace('#', '').replace(',', ''))
                print(f"✓ Found rank: {rank}")
            except Exception as e:
                print(f"Could not extract rank: {e}")
            
            # Extract points using class selector (from original script)
            try:
                points_element = your_row_element.find_element(By.XPATH, ".//div[contains(@class, 'bASAzC')]")
                points_text = points_element.text.strip()
                
                # Parse using scientific notation method (from original script)
                points_text_converted = points_text.replace(',', '').replace('\n', '').replace('M', 'e6').replace('K', 'e3').replace('B', 'e9')
                total_points = float(points_text_converted)
                print(f"✓ Found total points: {total_points} (from text: {points_text})")
            except Exception as e:
                print(f"Could not extract points: {e}")
            
            if total_points == 0 or rank == 0:
                print("Warning: Could not extract valid wallet data")
                print(f"Current values - Points: {total_points}, Rank: {rank}")
                
        except Exception as e:
            print(f"Error searching for wallet: {e}")
            import traceback
            traceback.print_exc()
            total_points = 0
            rank = 0
        
        # Calculate percentile if we have rank and total wallets
        if rank > 0 and total_wallets > 0:
            percentile_value = ((total_wallets - rank) / total_wallets) * 100
            percentile = f"{100 - percentile_value:.2f}%"
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
        print("ERROR: Missing required environment variables")
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
