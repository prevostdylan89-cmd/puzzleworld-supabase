/**
 * rainforestApi.js
 * Utilitaire pour appeler Rainforest API avec la clé stockée dans Supabase
 */
import { supabase } from './supabaseClient';

const SETTINGS_KEY = 'rainforest_api_settings';

// Cache la clé en mémoire pour éviter trop de requêtes Supabase
let cachedApiKey = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getRainforestApiKey() {
  // Retourner le cache si encore valide
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
    console.error('Erreur récupération clé Rainforest:', e);
  }
  return null;
}

// Invalide le cache (utile après changement de clé)
export function invalidateRainforestCache() {
  cachedApiKey = null;
  cacheTime = null;
}

export async function searchRainforest(params) {
  const apiKey = await getRainforestApiKey();
  if (!apiKey) throw new Error('Clé Rainforest API non configurée');
  
  const url = new URL('https://api.rainforestapi.com/request');
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Rainforest API error: ${response.status}`);
  return response.json();
}
