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
    
    // Use the coins/markets endpoint for more accurate real-time pricing
    const timestamp = Date.now();
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=spark&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h&_=${timestamp}`,
      {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
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

    // Extract price data from markets endpoint (returns an array)
    if (!Array.isArray(data) || data.length === 0) {
      console.error('Invalid price data received from CoinGecko');
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

    const coinData = data[0];
    const currentPrice = coinData.current_price;
    const priceChange24h = coinData.price_change_percentage_24h || 0;

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
    
    // Return fallback price on error (updated to current approximate price)
    return new Response(
      JSON.stringify({ 
        price: 0.0477,
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
