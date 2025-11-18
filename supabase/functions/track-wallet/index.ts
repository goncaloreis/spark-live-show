import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WalletData {
  wallet_address: string;
  total_points: number;
  rank?: number;
  total_wallets?: number;
  percentile?: string;
  total_points_pool?: number;
}

// Rate limiting configuration
const RATE_LIMITS = {
  get: { requests: 30, windowMinutes: 1 },  // 30 requests per minute for GET
  store: { requests: 20, windowMinutes: 1 }, // 20 requests per minute for STORE (scraper)
  global: { requests: 1000, windowMinutes: 60 } // 1000 requests per hour per IP (relaxed for development)
};

async function checkRateLimit(
  supabaseClient: any,
  identifier: string,
  action: string,
  limit: number,
  windowMinutes: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  // Get current count for this identifier and action
  const { data: existingLimits, error: fetchError } = await supabaseClient
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('identifier', identifier)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching rate limit:', fetchError);
    return { allowed: true }; // Fail open to avoid blocking legitimate requests
  }

  if (!existingLimits) {
    // First request in this window
    await supabaseClient.from('rate_limits').insert({
      identifier,
      action,
      request_count: 1,
      window_start: new Date().toISOString()
    });
    return { allowed: true };
  }

  const currentCount = existingLimits.request_count;

  if (currentCount >= limit) {
    const windowStartTime = new Date(existingLimits.window_start);
    const retryAfter = Math.ceil((windowStartTime.getTime() + windowMinutes * 60000 - Date.now()) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  await supabaseClient
    .from('rate_limits')
    .update({ request_count: currentCount + 1 })
    .eq('identifier', identifier)
    .eq('action', action)
    .eq('window_start', existingLimits.window_start);

  return { allowed: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client early for rate limiting
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check global IP rate limit
    const globalLimit = await checkRateLimit(
      supabaseClient,
      clientIP,
      'global',
      RATE_LIMITS.global.requests,
      RATE_LIMITS.global.windowMinutes
    );

    if (!globalLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Too many requests from your IP address.',
          retry_after: globalLimit.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(globalLimit.retryAfter || 60)
          } 
        }
      );
    }

    // Parse request body ONCE
    const body = await req.json();
    const { action = 'get', total_points, rank, total_wallets, percentile, total_points_pool } = body;
    
    // Sanitize wallet address input
    const wallet_address = String(body.wallet_address || '').trim().toLowerCase();

    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check action-specific rate limits
    const actionLimit = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    if (actionLimit) {
      const identifier = action === 'get' ? wallet_address : clientIP;
      const limitCheck = await checkRateLimit(
        supabaseClient,
        identifier,
        action,
        actionLimit.requests,
        actionLimit.windowMinutes
      );

      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: `Rate limit exceeded for ${action} action. Please try again later.`,
            retry_after: limitCheck.retryAfter 
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(limitCheck.retryAfter || 60)
            } 
          }
        );
      }
    }

    // Periodically cleanup old rate limit records (1% chance per request)
    if (Math.random() < 0.01) {
      supabaseClient.rpc('cleanup_old_rate_limits').then(() => {
        console.log('Rate limit cleanup triggered');
      });
    }

    if (action === 'get') {
      // Get latest data for wallet
      const { data: latestData, error: latestError } = await supabaseClient
        .rpc('get_latest_wallet_data', { wallet_addr: wallet_address });

      if (latestError) {
        console.error('Error code: DB_QUERY_FAILED');
      }

      // Get historical data for charts
      const { data: historyData, error: historyError } = await supabaseClient
        .rpc('get_wallet_history', { wallet_addr: wallet_address, days_back: 30 });

      if (historyError) {
        console.error('Error code: DB_QUERY_FAILED');
      }

      return new Response(
        JSON.stringify({
          latest: latestData?.[0] || null,
          history: historyData || [],
          has_data: latestData && latestData.length > 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'store') {
      // Store wallet data (called by Python agent or manual entry)
      
      // Check scraper secret authentication
      const scraperSecret = req.headers.get('x-scraper-secret');
      const expectedSecret = Deno.env.get('SCRAPER_SECRET');
      
      if (!scraperSecret || scraperSecret !== expectedSecret) {
        console.error('Unauthorized store attempt - invalid or missing secret');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!total_points) {
        return new Response(
          JSON.stringify({ error: 'total_points is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Input validation for numeric bounds
      if (total_points < 0 || total_points > 1e15) {
        return new Response(
          JSON.stringify({ error: 'Invalid total_points value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (rank && (rank < 1 || rank > 1000000)) {
        return new Response(
          JSON.stringify({ error: 'Invalid rank value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (percentile && !/^\d+\.\d+%$/.test(percentile)) {
        return new Response(
          JSON.stringify({ error: 'Invalid percentile format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (total_wallets && (total_wallets < 1 || total_wallets > 10000000)) {
        return new Response(
          JSON.stringify({ error: 'Invalid total_wallets value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (total_points_pool && (total_points_pool < 0 || total_points_pool > 1e18)) {
        return new Response(
          JSON.stringify({ error: 'Invalid total_points_pool value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add wallet-based rate limiting to prevent IP rotation bypass
      const walletLimit = await checkRateLimit(
        supabaseClient,
        wallet_address,
        'store_wallet',
        2, // Only 2 stores per hour per wallet
        60
      );

      if (!walletLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'This wallet has been updated too recently. Please try again later.',
            retry_after: walletLimit.retryAfter 
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': String(walletLimit.retryAfter || 3600)
            } 
          }
        );
      }

      const { data, error } = await supabaseClient
        .from('wallet_tracking')
        .insert({
          wallet_address,
          total_points,
          rank,
          total_wallets,
          percentile,
          total_points_pool
        })
        .select();

      if (error) {
        console.error('Error code: DB_INSERT_FAILED');
        return new Response(
          JSON.stringify({ error: 'Unable to process request' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "get" or "store"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error code: REQUEST_FAILED');
    return new Response(
      JSON.stringify({ error: 'Unable to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
