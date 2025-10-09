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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body ONCE
    const body = await req.json();
    const { wallet_address, action = 'get', total_points, rank, total_wallets, percentile } = body;

    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Wallet address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'get') {
      // Get latest data for wallet
      const { data: latestData, error: latestError } = await supabaseClient
        .rpc('get_latest_wallet_data', { wallet_addr: wallet_address });

      if (latestError) {
        console.error('Error fetching latest data:', latestError);
      }

      // Get historical data for charts
      const { data: historyData, error: historyError } = await supabaseClient
        .rpc('get_wallet_history', { wallet_addr: wallet_address, days_back: 30 });

      if (historyError) {
        console.error('Error fetching history:', historyError);
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
      if (!total_points) {
        return new Response(
          JSON.stringify({ error: 'total_points is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('wallet_tracking')
        .insert({
          wallet_address,
          total_points,
          rank,
          total_wallets,
          percentile
        })
        .select();

      if (error) {
        console.error('Error storing wallet data:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store wallet data' }),
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
    console.error('Error in track-wallet function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
