// scraperApi.js — ScraperAPI (Amazon.fr avec fallback us/com)
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

async function searchAmazonByCountry(query, key, countryCode) {
  const url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=${countryCode}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data?.results ?? data?.organic_results ?? [];
}

export async function searchAmazon(query, apiKey) {
  let key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  // Tentative 1 : Amazon.fr direct
  let results = await searchAmazonByCountry(query, key, 'fr');
  console.log('ScraperAPI Amazon.fr:', results.length, 'résultats');

  // Tentative 2 : Amazon.fr avec "puzzle " + query
  if (results.length === 0) {
    results = await searchAmazonByCountry('puzzle ' + query, key, 'fr');
    console.log('ScraperAPI Amazon.fr fallback puzzle+query:', results.length, 'résultats');
  }

  // Tentative 3 : Amazon.com (US)
  if (results.length === 0) {
    results = await searchAmazonByCountry(query, key, 'us');
    console.log('ScraperAPI Amazon.com (us):', results.length, 'résultats');
  }

  // Tentative 4 : Amazon.com avec "puzzle " + query
  if (results.length === 0) {
    results = await searchAmazonByCountry('puzzle ' + query, key, 'us');
    console.log('ScraperAPI Amazon.com fallback puzzle+query:', results.length, 'résultats');
  }

  // Tentative 5 : Amazon.de (Allemagne — souvent bien fourni en puzzles européens)
  if (results.length === 0) {
    results = await searchAmazonByCountry(query, key, 'de');
    console.log('ScraperAPI Amazon.de:', results.length, 'résultats');
  }

  return results;
}

export async function getProductByAsin(asin, apiKey) {
  let key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  // Essai sur Amazon.fr d'abord, puis us si échec
  let url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=fr`;
  let response = await fetch(url);
  
  if (!response.ok) {
    console.log('getProductByAsin fr échoué, tentative us...');
    url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=us`;
    response = await fetch(url);
  }

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