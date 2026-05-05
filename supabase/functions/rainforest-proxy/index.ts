import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer la clé Rainforest depuis page_settings
    const { data } = await supabase
      .from('page_settings')
      .select('settings')
      .eq('page_name', 'rainforest_api_settings')
      .limit(1)
      .single()

    const apiKey = data?.settings?.api_key
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Clé Rainforest non configurée' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les paramètres de la requête
    const body = await req.json()
    const params = new URLSearchParams({
      api_key: apiKey,
      ...body
    })

    const response = await fetch(
      `https://api.rainforestapi.com/request?${params.toString()}`
    )

    const responseData = await response.json()

    return new Response(
      JSON.stringify(responseData),
      {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
