// scraperApi.js — Rainforest API via Supabase Edge Function proxy
import { supabase } from './supabaseClient';

const PROXY_URL = 'https://ghbutltffpnrdkbtvlog.supabase.co/functions/v1/rainforest-proxy';

async function callRainforest(params) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`Rainforest proxy erreur: ${response.status}`);
  return await response.json();
}

export async function searchAmazon(query) {
  const data = await callRainforest({
    type: 'search',
    query: query,
    amazon_domain: 'amazon.com',
  });
  console.log('Rainforest search:', data);
  return data?.search_results ?? [];
}

export async function getProductByAsin(asin) {
  const data = await callRainforest({
    type: 'product',
    asin: asin,
    amazon_domain: 'amazon.com',
  });
  console.log('Rainforest product:', data);
  return data?.product ?? null;
}

export async function getScraperCredits() {
  return null;
}

export function invalidateScraperCache() {}

export async function getScraperApiKey() {
  return null;
}