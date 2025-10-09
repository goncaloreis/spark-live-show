import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching SPK price from CoinGecko...');
    
    // Try multiple approaches to get the most accurate SPK price
    // First, try the simple price API with cache-busting
    const timestamp = Date.now();
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=spark&vs_currencies=usd&include_24hr_change=true&precision=6&_=${timestamp}`,
      {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      // Return fallback price if API fails
      return new Response(
        JSON.stringify({ 
          price: 0.0475, // Updated fallback based on current market price
          change_24h: 0,
          source: 'fallback'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const data = await response.json();
    console.log('CoinGecko response:', JSON.stringify(data));

    // Extract price data from simple price endpoint
    const priceData = data.spark;
    
    if (!priceData || !priceData.usd) {
      console.error('Invalid price data received from CoinGecko');
      return new Response(
        JSON.stringify({ 
          price: 0.0475, // Updated fallback based on current market price
          change_24h: 0,
          source: 'fallback'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const currentPrice = priceData.usd;
    const priceChange24h = priceData.usd_24h_change || 0;

    console.log(`SPK Price: $${currentPrice}, 24h Change: ${priceChange24h}%`);

    return new Response(
      JSON.stringify({
        price: currentPrice,
        change_24h: priceChange24h,
        source: 'coingecko',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Unexpected error fetching SPK price:', error);
    
    // Return fallback price on error
    return new Response(
      JSON.stringify({ 
        price: 0.0475,
        change_24h: 0,
        source: 'fallback'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
