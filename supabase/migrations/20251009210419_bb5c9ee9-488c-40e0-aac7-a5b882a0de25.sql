-- Delete incorrect scraping data (rank 0 or points > 50M which indicates it grabbed the pool total)
DELETE FROM wallet_tracking 
WHERE rank = 0 
   OR total_points > 50000000;