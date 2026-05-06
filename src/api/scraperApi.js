// scraperApi.js — Utilitaire pour appeler Rainforest API (recherche Amazon puzzles)
import { supabase } from './supabaseClient';

const RAINFOREST_BASE = 'https://api.rainforestapi.com/request';

// Récupère la clé Rainforest depuis Supabase (table page_settings)
export async function getRainforestApiKey() {
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
    console.error('Erreur récupération clé Rainforest:', e);
    return null;
  }
}

// Recherche de puzzles Amazon via Rainforest API
export async function searchAmazon(query, apiKey) {
  let key = apiKey || await getRainforestApiKey();
  if (!key) throw new Error('Clé Rainforest non configurée');

  // Tentative 1 : requête directe
  const url = `${RAINFOREST_BASE}?api_key=${key}&type=search&amazon_domain=amazon.fr&search_term=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Rainforest API erreur: ${response.status}`);
  const data = await response.json();
  console.log('Rainforest searchAmazon raw response:', data);
  return data?.search_results ?? [];
}

// Fiche complète par ASIN (marque, pièces, image HD)
export async function getProductByAsin(asin, apiKey) {
  let key = apiKey || await getRainforestApiKey();
  if (!key) throw new Error('Clé Rainforest non configurée');

  const url = `${RAINFOREST_BASE}?api_key=${key}&type=product&amazon_domain=amazon.fr&asin=${asin}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Rainforest API erreur: ${response.status}`);
  const data = await response.json();
  console.log('Rainforest getProductByAsin raw response:', data);
  return data?.product ?? null;
}

// Crédits restants du compte Rainforest
export async function getScraperCredits(apiKey) {
  let key = apiKey || await getRainforestApiKey();
  if (!key) throw new Error('Clé Rainforest non configurée');

  const url = `${RAINFOREST_BASE}?api_key=${key}&type=account`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Rainforest API erreur: ${response.status}`);
  const data = await response.json();
  console.log('Rainforest account raw response:', data);
  return data?.account_info?.credits_remaining ?? null;
}

// Alias pour compatibilité
export function invalidateScraperCache() {}