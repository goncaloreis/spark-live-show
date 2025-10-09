import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 60,
  windowMinutes: 1
};

// Check rate limit using existing rate_limits table
async function checkRateLimit(supabaseClient: any, identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60 * 1000);
    
    const { data: existing, error: fetchError } = await supabaseClient
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('action', 'get_price')
      .gte('window_start', windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error code: RATE_LIMIT_CHECK_FAILED');
      return { allowed: true };
    }

    if (existing) {
      if (existing.request_count >= RATE_LIMIT.maxRequests) {
        const retryAfter = Math.ceil((new Date(existing.window_start).getTime() + RATE_LIMIT.windowMinutes * 60 * 1000 - Date.now()) / 1000);
        return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
      }

      await supabaseClient
        .from('rate_limits')
        .update({ request_count: existing.request_count + 1 })
        .eq('id', existing.id);
    } else {
      await supabaseClient
        .from('rate_limits')
        .insert({
          identifier,
          action: 'get_price',
          window_start: new Date().toISOString(),
          request_count: 1
        });
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error code: RATE_LIMIT_ERROR');
    return { allowed: true };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateLimitCheck = await checkRateLimit(supabaseClient, clientIp);
    
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitCheck.retryAfter)
          } 
        }
      );
    }

    // Check database cache first (2-minute TTL)
    const { data: cachedPrice } = await supabaseClient.rpc('get_latest_spk_price');
    
    if (cachedPrice && cachedPrice.length > 0) {
      const cache = cachedPrice[0];
      return new Response(
        JSON.stringify({
          price: Number(cache.price),
          change_24h: Number(cache.change_24h),
          source: 'cache',
          timestamp: cache.created_at
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Fetch fresh price from DefiLlama (free, no API key, better for DeFi tokens)
    // SPK Token: 0xc20059e0317DE91738d13af027DfC4a50781b066 on Ethereum
    const timestamp = Date.now();
    const response = await fetch(
      `https://coins.llama.fi/prices/current/ethereum:0xc20059e0317DE91738d13af027DfC4a50781b066?_=${timestamp}`,
      {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      }
    );

    if (!response.ok) {
      console.error('Error code: DEFILLAMA_API_ERROR', response.status, response.statusText);
      // Return fallback price if API fails
      return new Response(
        JSON.stringify({ 
          price: 0.04,
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

    // Extract price data from DefiLlama API
    // Returns: { "coins": { "ethereum:0xc20...": { "price": 0.04, "timestamp": 1234567890, "confidence": 0.99 } } }
    // Note: DefiLlama returns addresses in mixed case, so we need to find the key case-insensitively
    const coinKeyLower = 'ethereum:0xc20059e0317de91738d13af027dfc4a50781b066';
    const coinKey = Object.keys(data?.coins || {}).find(key => key.toLowerCase() === coinKeyLower);
    const coinData = coinKey ? data.coins[coinKey] : null;
    
    if (!coinData || typeof coinData.price !== 'number') {
      console.error('Error code: INVALID_PRICE_DATA', 'Data received:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          price: 0.04, // Updated fallback for SPK token
          change_24h: 0,
          source: 'fallback'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const currentPrice = coinData.price;
    
    // DefiLlama doesn't provide 24h change in the current price endpoint
    // We'll calculate it from historical data or set to 0
    const priceChange24h = 0; // TODO: Could fetch from /chart endpoint if needed

    // Store price in cache
    await supabaseClient
      .from('spk_price_cache')
      .insert({
        price: currentPrice,
        change_24h: priceChange24h,
        source: 'defillama'
      });

    // Clean up old cache entries periodically (1% chance per request)
    if (Math.random() < 0.01) {
      await supabaseClient.rpc('cleanup_old_price_cache');
    }

    return new Response(
      JSON.stringify({
        price: currentPrice,
        change_24h: priceChange24h,
        source: 'defillama',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error code: PRICE_FETCH_FAILED');
    
    // Return fallback price on error
    return new Response(
      JSON.stringify({ 
        price: 0.04, // SPK token fallback
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
