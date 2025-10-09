import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  total_points: number;
  rank: number;
  total_wallets: number;
  percentile: string;
  total_points_pool: number;
}

async function scrapeSparkPoints(walletAddress: string): Promise<ScrapeResult> {
  console.log('Scraping Spark Points for wallet:', walletAddress);
  
  // Construct the URL - you'll need to update this with the actual Spark Points URL
  const url = `https://spark.particle.network/points?wallet=${walletAddress}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract data based on the Python script's selectors
    // You'll need to adjust these selectors based on the actual HTML structure
    const totalPointsElement = doc.querySelector('.total-points');
    const rankElement = doc.querySelector('.rank');
    const yourPointsElement = doc.querySelector('.your-points');
    const numWalletsElement = doc.querySelector('.total-wallets');
    const percentileElement = doc.querySelector('.percentile');

    if (!totalPointsElement || !rankElement || !yourPointsElement || !numWalletsElement || !percentileElement) {
      console.error('Missing elements in HTML');
      throw new Error('Failed to find required elements on page');
    }

    const total_points = parseFloat(totalPointsElement.textContent?.replace(/[^\d.]/g, '') || '0');
    const rank = parseInt(rankElement.textContent?.replace(/[^\d]/g, '') || '0');
    const your_points = parseFloat(yourPointsElement.textContent?.replace(/[^\d.]/g, '') || '0');
    const total_wallets = parseInt(numWalletsElement.textContent?.replace(/[^\d]/g, '') || '0');
    const percentile = percentileElement.textContent?.trim() || '';

    console.log('Extracted data:', {
      total_points,
      rank,
      your_points,
      total_wallets,
      percentile,
    });

    return {
      total_points: your_points,
      rank,
      total_wallets,
      percentile,
      total_points_pool: total_points,
    };
  } catch (error) {
    console.error('Error scraping Spark Points:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Ethereum wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Ethereum wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting scrape for wallet:', walletAddress);

    // Scrape the data
    const scrapedData = await scrapeSparkPoints(walletAddress);

    // Call the track-wallet function to store the data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const trackResponse = await fetch(`${supabaseUrl}/functions/v1/track-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action: 'store',
        walletAddress,
        ...scrapedData,
      }),
    });

    if (!trackResponse.ok) {
      const errorText = await trackResponse.text();
      console.error('Error calling track-wallet:', errorText);
      throw new Error('Failed to store scraped data');
    }

    const result = await trackResponse.json();
    console.log('Successfully stored data:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data scraped and stored successfully',
        data: scrapedData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-spark-points function:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
