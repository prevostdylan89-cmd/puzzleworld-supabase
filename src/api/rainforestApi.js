/**
 * rainforestApi.js
 * Utilitaire pour appeler Rainforest API via la Supabase Edge Function (proxy CORS)
 */
import { supabase } from './supabaseClient';

const SETTINGS_KEY = 'rainforest_api_settings';

// Cache la clé en mémoire pour éviter trop de requêtes Supabase
let cachedApiKey = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getRainforestApiKey() {
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

export function invalidateRainforestCache() {
  cachedApiKey = null;
  cacheTime = null;
}

/**
 * Appel via Edge Function Supabase (contourne le blocage CORS de Rainforest)
 * La clé API est lue directement côté serveur → plus sécurisé
 */
export async function searchRainforest(params) {
  const { data, error } = await supabase.functions.invoke('rainforest-proxy', {
    body: params,
  });

  if (error) {
    // Fallback : essayer l'appel direct (marche en prod si CORS OK)
    console.warn('Edge function failed, trying direct call:', error);
    const apiKey = await getRainforestApiKey();
    if (!apiKey) throw new Error('Clé Rainforest API non configurée');

    const url = new URL('https://api.rainforestapi.com/request');
    url.searchParams.set('api_key', apiKey);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Rainforest API error: ${response.status}`);
    return response.json();
  }

  if (data?.error) throw new Error(data.error);
  return data;
}
