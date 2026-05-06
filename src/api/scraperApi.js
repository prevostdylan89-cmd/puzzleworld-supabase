// scraperApi.js — ScraperAPI (Google Shopping → Amazon)
import { supabase } from './supabaseClient';

const SCRAPER_BASE = 'https://api.scraperapi.com/structured/amazon/search';
const SCRAPER_PRODUCT_BASE = 'https://api.scraperapi.com/structured/amazon/product';
const SCRAPER_GOOGLE_SHOPPING = 'https://api.scraperapi.com/structured/google/shopping';

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

// Recherche Google Shopping par EAN → retourne nom + marque + image
async function searchGoogleShopping(ean, key) {
  try {
    const url = `${SCRAPER_GOOGLE_SHOPPING}?api_key=${key}&query=${encodeURIComponent(ean)}&country_code=fr`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('ScraperAPI Google Shopping:', data);
    const results = data?.shopping_results ?? data?.results ?? [];
    if (results.length === 0) return null;
    const item = results[0];
    return {
      title: item.title || item.name || '',
      brand: item.source || item.brand || '',
      image: item.thumbnail || item.image || '',
      price: item.price || null,
    };
  } catch (e) {
    console.error('Google Shopping erreur:', e);
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

  // Tentative 2 : "puzzle " + EAN sur Amazon.com
  if (results.length === 0) {
    url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent('puzzle ' + query)}&country_code=us`;
    response = await fetch(url);
    if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
    data = await response.json();
    console.log('ScraperAPI Amazon.com fallback puzzle+query:', data);
    results = data?.results ?? data?.organic_results ?? [];
  }

  // Tentative 3 : Google Shopping → récupère le nom → recherche Amazon par nom
  if (results.length === 0) {
    console.log('Tentative Google Shopping pour EAN:', query);
    const googleResult = await searchGoogleShopping(query, key);
    if (googleResult?.title) {
      console.log('Google Shopping trouvé:', googleResult.title);
      // Recherche Amazon avec le nom trouvé sur Google Shopping
      url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(googleResult.title)}&country_code=us`;
      response = await fetch(url);
      if (response.ok) {
        data = await response.json();
        results = data?.results ?? data?.organic_results ?? [];
        console.log('ScraperAPI Amazon via nom Google Shopping:', results.length, 'résultats');

        // Si toujours rien, on crée un résultat minimal avec les données Google Shopping
        if (results.length === 0 && googleResult.title) {
          results = [{
            name: googleResult.title,
            title: googleResult.title,
            brand: googleResult.brand,
            image: googleResult.image,
            thumbnail: googleResult.image,
            asin: null,
            _fromGoogleShopping: true,
          }];
        }
      }
    }
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