// rainforestApi.js — Utilitaire pour appeler Rainforest API (recherche Amazon puzzles)
import { supabase } from './supabaseClient';

// Récupère la clé Rainforest depuis Supabase (table page_settings)
export async function getRainforestApiKey() {
  try {
    const { data, error } = await supabase
      .from('page_settings')
      .select('settings')
      .single();
    if (error) throw error;
    return data?.settings?.rainforestApiKey ?? null;
  } catch (e) {
    console.error('Erreur récupération clé Rainforest:', e);
    return null;
  }
}

const RAINFOREST_BASE = 'https://api.rainforestapi.com/request';

// Recherche de puzzles Amazon via Rainforest API
export async function searchAmazon(query, apiKey) {
  let key = apiKey || await getRainforestApiKey();
  if (!key) throw new Error('Clé Rainforest non configurée');

  const url = `${RAINFOREST_BASE}?api_key=${key}&type=search&amazon_domain=amazon.fr&search_term=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Rainforest API erreur: ${response.status}`);
  const data = await response.json();
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
  return data?.account_info?.credits_remaining ?? null;
}