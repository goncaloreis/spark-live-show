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
        # Navigate to Spark Points leaderboard page
        url = f"https://points.spark.fi/"
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
            
            # Look for the card containing "Total Points"
            pool_xpath = "//div[contains(text(), 'Total Points')]/following-sibling::div[1]"
            pool_element = wait.until(EC.presence_of_element_located((By.XPATH, pool_xpath)))
            
            # Remove commas, newlines, and whitespace - the DOM splits numbers across lines
            pool_text = pool_element.text.strip().replace(',', '').replace('\n', '').replace(' ', '')
            print(f"Total Points text found: {pool_text}")
            
            total_points_pool = float(pool_text)
            print(f"✓ Found total points pool: {total_points_pool}")
                    
        except Exception as e:
            print(f"Error finding total points pool: {e}")
            total_points_pool = 0
        
        # Extract Total Wallets from the header
        try:
            print("Searching for total wallets...")
            
            # Look for the card containing "N° of Wallets"
            wallets_xpath = "//div[contains(text(), 'of Wallets')]/following-sibling::div[1]"
            wallets_element = wait.until(EC.presence_of_element_located((By.XPATH, wallets_xpath)))
            
            wallets_text = wallets_element.text.strip().replace(',', '')
            total_wallets = int(wallets_text)
            print(f"✓ Found total wallets: {total_wallets}")
                    
        except Exception as e:
            print(f"Error finding total wallets: {e}")
            total_wallets = 0
        
        # Use the search box to find the wallet
        try:
            print(f"Using search box to find wallet {wallet_address}...")
            
            # Find the search input box - look for "Search by wallet"
            search_input = wait.until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='wallet']"))
            )
            
            print("✓ Found search input")
            
            # Clear and enter wallet address
            search_input.clear()
            search_input.send_keys(wallet_address)
            print(f"✓ Entered wallet address")
            
            # Wait for search results to load and table to update
            time.sleep(12)  # Longer wait for React to re-render
            
            # Take screenshot after search
            driver.save_screenshot('/tmp/spark_page_search.png')
            print("Screenshot saved to /tmp/spark_page_search.png")
            
            # Find the wallet data - search for shortened wallet format anywhere on page
            wallet_short = f"{wallet_address[:6]}...{wallet_address[-4:]}".lower()
            print(f"Looking for wallet format: {wallet_short}")
            
            # Try to find ANY element containing the wallet address
            wallet_elements = driver.find_elements(By.XPATH, f"//*[contains(translate(text(), 'ABCDEF', 'abcdef'), '{wallet_short}')]")
            
            if not wallet_elements:
                print(f"ERROR: Wallet {wallet_short} not found on page after search")
                print("Checking if search returned results...")
                page_text = driver.find_element(By.TAG_NAME, "body").text.lower()
                if "no" in page_text and "found" in page_text:
                    print("Search returned no results")
                raise Exception(f"Wallet {wallet_short} not found in search results")
            
            print(f"✓ Found {len(wallet_elements)} elements containing wallet")
            
            # Find the parent row/container with all the data
            # Look for the element that contains both the wallet AND numeric data
            wallet_row = None
            for elem in wallet_elements:
                try:
                    # Get the parent that likely contains all row data
                    parent = elem.find_element(By.XPATH, "./ancestor::*[contains(@class, 'row') or contains(@class, 'item') or self::tr or self::div[count(*)>2]]")
                    parent_text = parent.text
                    # Check if this parent contains numbers (rank/points)
                    if any(char.isdigit() for char in parent_text):
                        wallet_row = parent
                        print(f"✓ Found wallet row/container")
                        print(f"Row text: {parent_text[:200]}")
                        break
                except:
                    continue
            
            if not wallet_row:
                # Fallback: just use the first element and try to find data nearby
                wallet_row = wallet_elements[0].find_element(By.XPATH, "./ancestor::*[1]")
                print(f"Using fallback: first wallet element's parent")
            
            # Extract rank and points from the row
            rank = 0
            total_points = 0
            
            try:
                # Get all text from the wallet container
                row_text = wallet_row.text
                print(f"Extracting data from: {row_text}")
                
                # Split by newlines or spaces to get individual values
                parts = row_text.replace('\n', ' ').split()
                print(f"Text parts: {parts}")
                
                # Try to find rank (first number) and points (last number with B/M/K)
                numbers_found = []
                for i, part in enumerate(parts):
                    part_clean = part.replace(',', '').strip()
                    # Check if it's a rank (pure integer)
                    try:
                        num = int(part_clean)
                        numbers_found.append(('rank', num, i))
                    except:
                        pass
                    # Check if it's points (ends with B/M/K)
                    if any(part_clean.endswith(suffix) for suffix in ['B', 'M', 'K']):
                        numbers_found.append(('points', part_clean, i))
                
                print(f"Numbers found: {numbers_found}")
                
                # First integer is likely rank
                rank_candidates = [n for n in numbers_found if n[0] == 'rank']
                if rank_candidates:
                    rank = rank_candidates[0][1]
                    print(f"✓ Found rank: {rank}")
                
                # Last number with suffix is points
                points_candidates = [n for n in numbers_found if n[0] == 'points']
                if points_candidates:
                    points_text = points_candidates[-1][1]
                    # Convert B/M/K to actual number
                    points_converted = points_text.replace(',', '').replace('B', 'e9').replace('M', 'e6').replace('K', 'e3')
                    total_points = float(points_converted)
                    print(f"✓ Found total points: {total_points} (from text: {points_text})")
                
            except Exception as e:
                print(f"Could not extract rank/points: {e}")
                import traceback
                traceback.print_exc()
            
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
