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
            
            # Wait for search results to load
            time.sleep(5)
            
            # Take screenshot after search
            driver.save_screenshot('/tmp/spark_page_search.png')
            print("Screenshot saved to /tmp/spark_page_search.png")
            
            # Find the table row containing the wallet
            # The wallet shows as shortened: 0xf20b...0704
            wallet_short = f"{wallet_address[:6]}...{wallet_address[-4:]}".lower()
            print(f"Looking for wallet format: {wallet_short}")
            
            # Find any element containing the wallet text (more flexible than td-only)
            wallet_xpath = f"//*[contains(translate(text(), 'ABCDEF', 'abcdef'), '{wallet_short}')]"
            wallet_element = wait.until(
                EC.visibility_of_element_located((By.XPATH, wallet_xpath))
            )
            
            # Get the parent row (could be tr, div, or any container element)
            # Try different parent levels to find the actual row
            wallet_row = None
            for ancestor_level in range(1, 8):  # Try up to 7 levels up
                try:
                    parent = wallet_element.find_element(By.XPATH, f"./ancestor::*[{ancestor_level}]")
                    parent_text = parent.text
                    # Check if this parent has rank AND points
                    # Must contain wallet, have sufficient length, and have number indicators
                    has_wallet = wallet_short in parent_text.lower()
                    has_numbers = any(c in parent_text for c in ['B', 'M', 'K']) or any(char.isdigit() for char in parent_text)
                    is_substantial = len(parent_text.strip()) > 20  # More than just the wallet
                    
                    if has_wallet and has_numbers and is_substantial:
                        wallet_row = parent
                        print(f"✓ Found wallet row at ancestor level {ancestor_level}")
                        break
                except:
                    continue
            
            if not wallet_row:
                # Last resort: go up 5 levels
                wallet_row = wallet_element.find_element(By.XPATH, "./ancestor::*[5]")
                print(f"✓ Using ancestor level 5 as wallet row")
            
            # Debug: print the row text
            row_text = wallet_row.text
            print(f"Row text: {row_text}")
            parts = [p.strip() for p in row_text.split('\n') if p.strip()]
            print(f"Text parts: {parts}")
            
            # Extract rank and points from the row
            rank = 0
            total_points = 0
            
            # Find wallet position in parts
            wallet_idx = None
            for i, part in enumerate(parts):
                if wallet_short in part.lower():
                    wallet_idx = i
                    break
            
            try:
                # Try traditional table structure first (td elements)
                try:
                    rank_cell = wallet_row.find_element(By.XPATH, "./td[1]")
                    rank_text = rank_cell.text.strip()
                    rank = int(rank_text.replace(',', ''))
                    print(f"✓ Found rank: {rank}")
                except:
                    # Fallback: parse from text content - rank is before wallet
                    if wallet_idx is not None:
                        for i in range(wallet_idx - 1, -1, -1):
                            try:
                                rank = int(parts[i].replace(',', ''))
                                print(f"✓ Found rank: {rank} at index {i}")
                                break
                            except:
                                continue
            except Exception as e:
                print(f"Could not extract rank: {e}")
            
            # Extract points from the last column
            try:
                try:
                    points_cell = wallet_row.find_element(By.XPATH, "./td[last()]")
                    points_text = points_cell.text.strip()
                except:
                    # Fallback: find text ending with B/M/K after wallet
                    points_text = None
                    if wallet_idx is not None:
                        # Look for suffix (B/M/K) after wallet
                        for i in range(wallet_idx + 1, len(parts)):
                            if any(parts[i].endswith(suffix) for suffix in ['B', 'M', 'K']):
                                # Collect number parts before suffix
                                # Could be "9.97M" or separate "9" "." "97" "M"
                                suffix_idx = i
                                number_parts = []
                                
                                # Work backwards from suffix to collect number
                                for j in range(suffix_idx, wallet_idx, -1):
                                    part = parts[j]
                                    # Check if it's a number, decimal, or has the suffix
                                    if part.replace('.', '').replace(',', '').replace('B', '').replace('M', '').replace('K', '').isdigit() or part == '.':
                                        number_parts.insert(0, part)
                                    elif any(part.endswith(s) for s in ['B', 'M', 'K']):
                                        # Extract number from part with suffix
                                        num_part = part[:-1]
                                        if num_part:
                                            number_parts.insert(0, num_part)
                                        number_parts.append(part[-1])  # Add suffix
                                        break
                                
                                points_text = ''.join(number_parts)
                                break
                    
                    if not points_text:
                        raise Exception("Could not find points text")
                
                # Parse using scientific notation (B for billion, M for million)
                points_converted = points_text.replace(',', '').replace('B', 'e9').replace('M', 'e6').replace('K', 'e3')
                total_points = float(points_converted)
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
