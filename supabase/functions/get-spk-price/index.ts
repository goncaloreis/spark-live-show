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
    
    // Fetch SPK token price from CoinGecko
    // Using "spark" as the ID based on spark.fi protocol
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=spark&vs_currencies=usd&include_24hr_change=true',
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
    console.log('CoinGecko response:', data);

    // Extract price data
    const priceData = data.spark;
    
    if (!priceData || !priceData.usd) {
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

    return new Response(
      JSON.stringify({
        price: priceData.usd,
        change_24h: priceData.usd_24h_change || 0,
        source: 'coingecko',
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
