// scraperApi.js — ScraperAPI avec recherche intelligente par EAN
import { supabase } from './supabaseClient';

const SCRAPER_BASE = 'https://api.scraperapi.com/structured/amazon/search';
const SCRAPER_PRODUCT_BASE = 'https://api.scraperapi.com/structured/amazon/product';

// ─── Normalisation EAN ───────────────────────────────────────────────────────
export function normalizeEAN(code) {
  const clean = code.replace(/\D/g, '');
  if (clean.length === 14 && clean.startsWith('0')) {
    return clean.slice(1);
  }
  return clean;
}

// ─── Validation résultat puzzle ───────────────────────────────────────────────
const PUZZLE_KEYWORDS = [
  'puzzle', 'jigsaw', 'pièces', 'pieces', 'piezas', 'teile',
  'ravensburger', 'clementoni', 'nathan', 'jumbo', 'educa',
  'ceaco', 'buffalo games', 'eurographics', 'cobble hill', 'galison',
  'masterpieces', 'white mountain'
];

const EXCLUDE_KEYWORDS = [
  'sac', 'poubelle', 'trash', 'bag', 'cleaning', 'nettoyage',
  'vêtement', 'clothing', 'shoe', 'chaussure', 'food', 'nourriture',
  'shampoo', 'shampooing', 'cosmetic', 'cosmétique'
];

export function isPuzzleResult(result) {
  const title = (result.name || result.title || '').toLowerCase();
  if (!title) return false;
  if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;
  return PUZZLE_KEYWORDS.some(kw => title.includes(kw));
}

// ─── Détection marque par préfixe EAN/UPC ────────────────────────────────────
const EAN_PREFIX_MAP = [
  { prefix: ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '419', '420', '421', '422', '423', '424', '425', '426', '427', '428', '429', '430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440'], brand: 'Ravensburger', country: 'fr' },
  { prefix: ['306', '307', '308', '309'], brand: 'Clementoni', country: 'fr' },
  { prefix: ['350', '351', '352', '353', '354', '355', '356', '357', '358', '359'], brand: 'Nathan', country: 'fr' },
  { prefix: ['871', '872', '873', '874', '875'], brand: 'Jumbo', country: 'fr' },
  { prefix: ['021', '022', '023', '210', '211', '212', '213'], brand: 'Ceaco', country: 'fr' },
  { prefix: ['814'], brand: 'MasterPieces', country: 'fr' },
  { prefix: ['076', '077'], brand: 'White Mountain Puzzles', country: 'fr' },
  { prefix: ['080', '081', '082', '083'], brand: 'puzzle', country: 'fr' },
  { prefix: ['074', '075'], brand: 'Buffalo Games', country: 'fr' },
  { prefix: ['601', '602', '603', '604', '605', '606', '607', '608', '609'], brand: 'Eurographics', country: 'fr' },
  { prefix: ['088'], brand: 'Cobble Hill', country: 'fr' },
  { prefix: ['625', '626'], brand: 'Galison', country: 'fr' },
  { prefix: ['800', '801', '802', '803', '804', '805', '806', '807', '808', '809'], brand: 'Clementoni', country: 'fr' },
  { prefix: ['841'], brand: 'Educa', country: 'fr' },
];

export function detectBrandFromEAN(ean) {
  const prefix3 = ean.slice(0, 3);
  const match = EAN_PREFIX_MAP.find(entry => entry.prefix.includes(prefix3));
  return match || null;
}

// ─── Clé ScraperAPI ──────────────────────────────────────────────────────────
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

// ─── Recherche Amazon avec timeout ───────────────────────────────────────────
async function searchAmazonRaw(query, key, countryCode = 'fr') {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=${countryCode}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`ScraperAPI ${countryCode} erreur ${response.status} pour: ${query}`);
      return [];
    }
    const data = await response.json();
    const allResults = data?.results ?? data?.organic_results ?? [];
    return allResults.filter(isPuzzleResult);
  } catch (e) {
    if (e.name === 'AbortError') {
      console.warn('ScraperAPI timeout pour:', query);
    } else {
      console.error('searchAmazonRaw erreur:', e);
    }
    return [];
  }
}

// ─── Recherche principale — 2 tentatives max ─────────────────────────────────
export async function searchAmazon(rawCode, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const ean = normalizeEAN(rawCode);
  console.log(`EAN normalisé: ${rawCode} → ${ean} (${ean.length} chiffres)`);

  const brandInfo = detectBrandFromEAN(ean);
  console.log('Marque détectée:', brandInfo);

  let results = [];

  // Tentative 1
  if (brandInfo) {
    console.log(`Tentative 1: "${brandInfo.brand} puzzle ${ean}"`);
    results = await searchAmazonRaw(`${brandInfo.brand} puzzle ${ean}`, key, 'fr');
    if (results.length > 0) return results;
  } else {
    console.log(`Tentative 1: EAN seul "${ean}"`);
    results = await searchAmazonRaw(ean, key, 'fr');
    if (results.length > 0) return results;
  }

  // Tentative 2
  console.log(`Tentative 2: "puzzle ${ean}"`);
  results = await searchAmazonRaw(`puzzle ${ean}`, key, 'fr');
  if (results.length > 0) return results;

  console.log('Aucun résultat puzzle valide trouvé pour:', ean);
  return null;
}

// ─── Détail produit par ASIN ──────────────────────────────────────────────────
export async function getProductByAsin(asin, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=fr`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  const data = await response.json();
  console.log('ScraperAPI getProductByAsin:', data);
  return data;
}

// ─── Crédits ScraperAPI ───────────────────────────────────────────────────────
export async function getScraperCredits(apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const url = `https://api.scraperapi.com/account?api_key=${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ScraperAPI erreur: ${response.status}`);
  const data = await response.json();
  console.log('ScraperAPI account:', data);
  const limit = data?.requestCount?.monthlyLimit ?? 0;
  const used = data?.requestCount?.thisMonthUsageCount ?? 0;
  return limit - used;
}

export function invalidateScraperCache() {}