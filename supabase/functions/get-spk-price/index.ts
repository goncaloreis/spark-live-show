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
    
    // Fetch SPK token price from CoinGecko using the detailed endpoint for real-time pricing
    // Using "spark" as the ID for Spark Protocol's SPK token
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/spark?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status, await response.text());
      // Return fallback price if API fails
      return new Response(
        JSON.stringify({ 
          price: 0.07, // Fallback price based on recent data
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
    console.log('CoinGecko detailed response received');

    // Extract price data from the detailed market_data object
    const marketData = data.market_data;
    
    if (!marketData || !marketData.current_price || !marketData.current_price.usd) {
      console.error('Invalid price data from CoinGecko');
      return new Response(
        JSON.stringify({ 
          price: 0.07,
          change_24h: 0,
          source: 'fallback'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const currentPrice = marketData.current_price.usd;
    const priceChange24h = marketData.price_change_percentage_24h || 0;

    console.log(`Real-time SPK Price: $${currentPrice}, 24h Change: ${priceChange24h.toFixed(2)}%`);

    return new Response(
      JSON.stringify({
        price: currentPrice,
        change_24h: priceChange24h,
        source: 'coingecko-realtime',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error fetching SPK price:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return fallback price on error
    return new Response(
      JSON.stringify({ 
        price: 0.07,
        change_24h: 0,
        source: 'fallback',
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
