/**
 * scraperApi.js
 * Utilitaire pour appeler ScraperAPI (recherche Amazon puzzles)
 */
import { supabase } from './supabaseClient';

const SETTINGS_KEY = 'scraper_api_settings';

// Cache mémoire 5 minutes
let cachedApiKey = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getScraperApiKey() {
  if (cachedApiKey && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return cachedApiKey;
  }
  try {
    const { data } = await supabase
      .from('page_settings')
      .select('settings')
      .eq('page_name', SETTINGS_KEY)
      .limit(1);
    if (data && data.length > 0 && data[0].settings?.api_key) {
      cachedApiKey = data[0].settings.api_key;
      cacheTime = Date.now();
      return cachedApiKey;
    }
  } catch (e) {
    console.error('Erreur récupération clé ScraperAPI:', e);
  }
  return null;
}

export function invalidateScraperCache() {
  cachedApiKey = null;
  cacheTime = null;
}

/**
 * Recherche de puzzles Amazon via ScraperAPI
 * Utilise le endpoint Amazon Search de ScraperAPI
 */
export async function searchAmazon(searchTerm, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const targetUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(searchTerm)}&i=toys`;
  const url = `https://api.scraperapi.com/?api_key=${key}&url=${encodeURIComponent(targetUrl)}&autoparse=true`;

  const response = await fetch(url);
  if (response.status === 401) throw new Error('Clé API invalide');
  if (response.status === 429) throw new Error('Limite de requêtes atteinte');
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);

  return response.json();
}

/**
 * Récupère les détails d'un produit Amazon via ASIN
 */
export async function getProductByAsin(asin, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const targetUrl = `https://www.amazon.fr/dp/${asin}`;
  const url = `https://api.scraperapi.com/?api_key=${key}&url=${encodeURIComponent(targetUrl)}&autoparse=true`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);

  return response.json();
}

/**
 * Récupère les crédits restants du compte ScraperAPI
 */
export async function getScraperCredits(apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const response = await fetch(`https://api.scraperapi.com/account?api_key=${key}`);
  if (response.status === 401) throw new Error('Clé API invalide');
  if (!response.ok) throw new Error(`Erreur: ${response.status}`);

  return response.json();
}