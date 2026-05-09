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

// ─── Marques puzzle connues (whitelist) ─────────────────────────────────────
// Si le titre contient une de ces marques → résultat accepté sans keyword puzzle
const PUZZLE_BRANDS_WHITELIST = [
  'ravensburger', 'clementoni', 'nathan', 'jumbo', 'educa', 'ceaco',
  'buffalo games', 'eurographics', 'cobble hill', 'galison', 'masterpieces',
  'white mountain', 'schmidt', 'heye', 'trefl', 'anatolian', 'castorland',
  'piatnik', 'd-toys', 'king puzzles', 'enjoy', 'magnolia', 'grafika',
  'pintoo', 'wrebbit', 'bopster', 'yazz', 'gibsons', 'winning moves',
  'diset', 'falcon', 'chronicles', 'aquarius', 'funko games',
  // Licences connues souvent en puzzle
  'disney', 'star wars', 'harry potter', 'marvel', 'pokémon', 'pokemon',
  'assassin\'s creed', 'lord of the rings', 'studio ghibli',
  // Séries puzzle spécifiques
  'villainous', 'wasgij', 'escape puzzle', 'panorama', 'impossible puzzle',
];

// ─── Mots-clés qui confirment que c'est un puzzle ───────────────────────────
const PUZZLE_KEYWORDS = [
  'puzzle', 'jigsaw', 'pièces', 'pieces', 'piezas', 'teile', 'puzzel',
  '500 pcs', '1000 pcs', '1500 pcs', '2000 pcs', '3000 pcs', '4000 pcs',
  '500pcs', '1000pcs', '1500pcs', '2000pcs',
];

// ─── Mots-clés qui excluent le résultat ─────────────────────────────────────
const EXCLUDE_KEYWORDS = [
  'sac poubelle', 'trash bag', 'garbage bag', 'bin bag',
  'nettoyage', 'cleaning', 'detergent', 'lessive',
  'vêtement', 'clothing', 'tshirt', 't-shirt', 'shirt', 'hoodie',
  'chaussure', 'shoe', 'sneaker', 'boot',
  'nourriture', 'food', 'drink', 'beverage',
  'shampoo', 'shampooing', 'cosmetic', 'cosmétique', 'parfum', 'perfume',
  'jouet électronique', 'electronic toy', 'figurine', 'action figure',
  'dvd', 'blu-ray', 'cd ', ' cd', 'vinyl', 'vinyle',
  'livre', 'book', 'roman', 'novel',
];

export function isPuzzleResult(result) {
  const title = (result.name || result.title || '').toLowerCase();
  const brand = (result.brand || '').toLowerCase();

  if (!title && !brand) return false;

  // Exclusion stricte
  if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;

  // Accepté si la marque est dans la whitelist
  if (PUZZLE_BRANDS_WHITELIST.some(b => title.includes(b) || brand.includes(b))) return true;

  // Accepté si un keyword puzzle est dans le titre
  if (PUZZLE_KEYWORDS.some(kw => title.includes(kw))) return true;

  return false;
}

// ─── Détection marque par préfixe EAN/UPC ────────────────────────────────────
const EAN_PREFIX_MAP = [
  { prefix: ['400', '401', '402', '403', '404', '405', '406', '407', '408', '409', '410', '411', '412', '413', '414', '415', '416', '417', '418', '419', '420', '421', '422', '423', '424', '425', '426', '427', '428', '429', '430', '431', '432', '433', '434', '435', '436', '437', '438', '439', '440'], brand: 'Ravensburger' },
  { prefix: ['306', '307', '308', '309'], brand: 'Clementoni' },
  { prefix: ['350', '351', '352', '353', '354', '355', '356', '357', '358', '359'], brand: 'Nathan' },
  { prefix: ['871', '872', '873', '874', '875'], brand: 'Jumbo' },
  { prefix: ['021', '022', '023', '210', '211', '212', '213'], brand: 'Ceaco' },
  { prefix: ['814'], brand: 'MasterPieces' },
  { prefix: ['076', '077'], brand: 'White Mountain Puzzles' },
  { prefix: ['080', '081', '082', '083'], brand: 'Puzzle' },
  { prefix: ['074', '075'], brand: 'Buffalo Games' },
  { prefix: ['601', '602', '603', '604', '605', '606', '607', '608', '609'], brand: 'Eurographics' },
  { prefix: ['088'], brand: 'Cobble Hill' },
  { prefix: ['625', '626'], brand: 'Galison' },
  { prefix: ['800', '801', '802', '803', '804', '805', '806', '807', '808', '809'], brand: 'Clementoni' },
  { prefix: ['841'], brand: 'Educa' },
  { prefix: ['827', '828'], brand: 'Winning Moves' },
  { prefix: ['033', '034'], brand: 'Schmidt' },
  { prefix: ['048', '049'], brand: 'Heye' },
  { prefix: ['590', '591', '592', '593'], brand: 'Trefl' },
  { prefix: ['005'], brand: 'Wrebbit' },
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
    const timeout = setTimeout(() => controller.abort(), 9000);

    const url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=${countryCode}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`ScraperAPI ${countryCode} erreur ${response.status} pour: ${query}`);
      return [];
    }
    const data = await response.json();
    const allResults = data?.results ?? data?.organic_results ?? [];

    // Filtrer les résultats puzzle
    const filtered = allResults.filter(isPuzzleResult);
    console.log(`searchAmazonRaw "${query}": ${allResults.length} résultats → ${filtered.length} puzzles`);
    return filtered;
  } catch (e) {
    if (e.name === 'AbortError') {
      console.warn('ScraperAPI timeout pour:', query);
    } else {
      console.error('searchAmazonRaw erreur:', e);
    }
    return [];
  }
}

// ─── Cascade de recherche — jusqu'à 3 tentatives intelligentes ───────────────
export async function searchAmazon(rawCode, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const ean = normalizeEAN(rawCode);
  console.log(`EAN normalisé: ${rawCode} → ${ean} (${ean.length} chiffres)`);

  const brandInfo = detectBrandFromEAN(ean);
  console.log('Marque détectée:', brandInfo);

  let results = [];

  // ── Tentative 1 : EAN exact ──────────────────────────────────────────────
  console.log(`Tentative 1: EAN exact "${ean}"`);
  results = await searchAmazonRaw(ean, key, 'fr');
  if (results.length > 0) return results;

  // ── Tentative 2 : marque + EAN (si marque connue) ────────────────────────
  if (brandInfo) {
    console.log(`Tentative 2: "${brandInfo.brand} puzzle ${ean}"`);
    results = await searchAmazonRaw(`${brandInfo.brand} puzzle ${ean}`, key, 'fr');
    if (results.length > 0) return results;
  } else {
    // Tentative 2 bis : "puzzle" + EAN
    console.log(`Tentative 2: "puzzle ${ean}"`);
    results = await searchAmazonRaw(`puzzle ${ean}`, key, 'fr');
    if (results.length > 0) return results;
  }

  // ── Tentative 3 : marque seule + "puzzle" (pour les puzzles très connus) ─
  if (brandInfo) {
    console.log(`Tentative 3: "puzzle ${ean}" (sans marque)`);
    results = await searchAmazonRaw(`puzzle ${ean}`, key, 'fr');
    if (results.length > 0) return results;
  }

  console.log('Aucun résultat puzzle valide trouvé pour:', ean);
  return null;
}

// ─── Recherche par nom libre (pour améliorer les résultats Villainous etc.) ──
// Appelé si l'EAN ne retourne rien et que l'utilisateur veut chercher par nom
export async function searchAmazonByName(name, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  console.log(`Recherche par nom: "${name}"`);
  const results = await searchAmazonRaw(`puzzle ${name}`, key, 'fr');
  if (results.length > 0) return results;

  // Tentative sans le mot puzzle (pour les marques connues comme Villainous)
  const results2 = await searchAmazonRaw(name, key, 'fr');
  return results2.length > 0 ? results2 : null;
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

  // Gérer les différents formats de réponse de l'API
  const limit = data?.requestCount?.monthlyLimit ?? data?.plan_request_credits ?? 0;
  const used = data?.requestCount?.thisMonthUsageCount ?? data?.usage ?? 0;
  return typeof limit === 'number' && typeof used === 'number' ? limit - used : limit;
}

export function invalidateScraperCache() {}
