// scraperApi.js — ScraperAPI (Amazon.com US)
import { supabase } from './supabaseClient';

const SCRAPER_BASE = 'https://api.scraperapi.com/structured/amazon/search';
const SCRAPER_PRODUCT_BASE = 'https://api.scraperapi.com/structured/amazon/product';

export async function getScraperApiKey() {
  try {
    const { data, error } = await supabase
      .from('page_settings')
      .select('settings')
      .eq('page_name', 'scraper_api_settings')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.settings?.api_key ?? null;
  } catch (e) {
    console.error('Erreur récupération clé ScraperAPI:', e);
    return null;
  }
}

export async function searchAmazon(query, apiKey) {
  let key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  // Tentative 1 : EAN direct sur Amazon.com
  let url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=us`;
  let response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  let data = await response.json();
  console.log('ScraperAPI Amazon.com (us):', data);
  let results = data?.results ?? data?.organic_results ?? [];

  // Tentative 2 : "puzzle " + EAN si aucun résultat
  if (results.length === 0) {
    url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent('puzzle ' + query)}&country_code=us`;
    response = await fetch(url);
    if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
    data = await response.json();
    console.log('ScraperAPI Amazon.com fallback puzzle+query:', data);
    results = data?.results ?? data?.organic_results ?? [];
  }

  return results;
}

export async function getProductByAsin(asin, apiKey) {
  let key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=us`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  const data = await response.json();
  console.log('ScraperAPI getProductByAsin response:', data);
  return data;
}

export async function getScraperCredits(apiKey) {
  let key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const url = `https://api.scraperapi.com/account?api_key=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  const data = await response.json();
  console.log('ScraperAPI account response:', data);
  const limit = data?.requestCount?.monthlyLimit ?? 0;
  const used = data?.requestCount?.thisMonthUsageCount ?? 0;
  return limit - used;
}

export function invalidateScraperCache() {}