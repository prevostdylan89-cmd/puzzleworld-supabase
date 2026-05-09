// scraperApi.js — Recherche puzzle multi-pays ultra-optimisée
import { supabase } from './supabaseClient';

const SCRAPER_BASE = 'https://api.scraperapi.com/structured/amazon/search';
const SCRAPER_PRODUCT_BASE = 'https://api.scraperapi.com/structured/amazon/product';

// ─── Normalisation EAN ───────────────────────────────────────────────────────
export function normalizeEAN(code) {
  const clean = code.replace(/\D/g, '');
  if (clean.length === 14 && clean.startsWith('0')) return clean.slice(1);
  return clean;
}

// ─── Marques puzzle — whitelist complète ────────────────────────────────────
const PUZZLE_BRANDS_WHITELIST = [
  // Grandes marques mondiales
  'ravensburger', 'clementoni', 'nathan', 'jumbo', 'educa', 'ceaco',
  'buffalo games', 'eurographics', 'cobble hill', 'galison', 'masterpieces',
  'white mountain', 'schmidt', 'heye', 'trefl', 'anatolian', 'castorland',
  'piatnik', 'd-toys', 'king puzzles', 'enjoy puzzle', 'magnolia puzzle',
  'grafika', 'pintoo', 'wrebbit', 'yazz puzzle', 'gibsons', 'winning moves',
  'diset', 'falcon', 'aquarius puzzles', 'funko games', 'cloudberries',
  'pomegranate', 'new york puzzle', 'sunsout', 'springbok', 'bits and pieces',
  'tomax', 'bluebird puzzle', 'art puzzle', 'step puzzle', 'trefl',
  'larsen puzzle', 'dino puzzle', 'cztery puzzle', 'play fun',
  // Marques françaises / européennes
  'editions philibert', 'hachette', 'france cartes', 'djeco',
  // Séries spécifiques très recherchées
  'villainous', 'wasgij', 'escape puzzle', 'escape room puzzle',
  'panorama puzzle', 'impossible puzzle', 'mystery puzzle',
  'photomosaic', 'neon puzzle', 'glow puzzle',
  // Licences connues en puzzle
  'disney', 'star wars', 'harry potter', 'marvel', 'dc comics',
  'pokemon', 'pokémon', 'studio ghibli', 'lord of the rings',
  'assassin creed', 'minecraft', 'zelda', 'nintendo',
];

// ─── Mots-clés puzzle dans le titre ─────────────────────────────────────────
const PUZZLE_KEYWORDS = [
  'puzzle', 'jigsaw', 'jig saw',
  'pièces', 'pieces', 'piezas', 'teile', 'puzzel', 'peças',
  '100 pc', '200 pc', '300 pc', '500 pc', '750 pc', '1000 pc',
  '1500 pc', '2000 pc', '3000 pc', '4000 pc', '5000 pc', '6000 pc',
  '100pc', '200pc', '300pc', '500pc', '750pc', '1000pc',
  '1500pc', '2000pc', '3000pc', '4000pc', '5000pc',
  '100-piece', '200-piece', '300-piece', '500-piece', '1000-piece',
  '1500-piece', '2000-piece', '3000-piece',
];

// ─── Mots-clés d'exclusion ───────────────────────────────────────────────────
const EXCLUDE_KEYWORDS = [
  // Déchets / nettoyage
  'poubelle', 'trash bag', 'garbage bag', 'bin bag', 'bin liner',
  'nettoyage', 'cleaning spray', 'detergent', 'lessive',
  // Vêtements
  'vêtement', 'clothing', 'tshirt', 't-shirt', 'shirt', 'hoodie',
  'chaussure', 'shoe', 'sneaker', 'boot', 'socks', 'chaussettes',
  // Nourriture / boisson
  'nourriture', 'food', 'snack', 'drink', 'beverage', 'sauce',
  // Cosmétiques
  'shampoo', 'shampooing', 'cosmetic', 'parfum', 'perfume', 'makeup',
  // Électronique
  'laptop', 'tablet', 'phone', 'keyboard', 'mouse', 'headphone',
  // Livres / médias
  'dvd', 'blu-ray', 'vinyl', 'roman', 'novel', 'magazine',
  // Jouets non-puzzle
  'action figure', 'figurine', 'lego set', 'doll', 'poupée',
  // Autres
  'sticker', 'poster', 'wallpaper', 'tapisserie',
];

export function isPuzzleResult(result) {
  const title = (result.name || result.title || '').toLowerCase();
  const brand = (result.brand || '').toLowerCase();
  const category = (result.category || result.categories || '').toLowerCase();

  if (!title) return false;

  // Exclusion stricte
  if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;

  // Accepté si catégorie Amazon contient puzzle/jigsaw
  if (category.includes('puzzle') || category.includes('jigsaw')) return true;

  // Accepté si marque connue dans titre ou brand
  if (PUZZLE_BRANDS_WHITELIST.some(b => title.includes(b) || brand.includes(b))) return true;

  // Accepté si keyword puzzle dans le titre
  if (PUZZLE_KEYWORDS.some(kw => title.includes(kw))) return true;

  return false;
}

// ─── Détection marque par préfixe EAN ────────────────────────────────────────
const EAN_PREFIX_MAP = [
  { prefix: ['400','401','402','403','404','405','406','407','408','409','410','411','412','413','414','415','416','417','418','419','420','421','422','423','424','425','426','427','428','429','430','431','432','433','434','435','436','437','438','439','440'], brand: 'Ravensburger' },
  { prefix: ['306','307','308','309'], brand: 'Clementoni' },
  { prefix: ['800','801','802','803','804','805','806','807','808','809'], brand: 'Clementoni' },
  { prefix: ['350','351','352','353','354','355','356','357','358','359'], brand: 'Nathan' },
  { prefix: ['871','872','873','874','875'], brand: 'Jumbo' },
  { prefix: ['021','022','023','210','211','212','213'], brand: 'Ceaco' },
  { prefix: ['814'], brand: 'MasterPieces' },
  { prefix: ['076','077'], brand: 'White Mountain Puzzles' },
  { prefix: ['074','075'], brand: 'Buffalo Games' },
  { prefix: ['601','602','603','604','605','606','607','608','609'], brand: 'Eurographics' },
  { prefix: ['088'], brand: 'Cobble Hill' },
  { prefix: ['625','626'], brand: 'Galison' },
  { prefix: ['841'], brand: 'Educa' },
  { prefix: ['827','828'], brand: 'Winning Moves' },
  { prefix: ['033','034'], brand: 'Schmidt' },
  { prefix: ['048','049'], brand: 'Heye' },
  { prefix: ['590','591','592','593'], brand: 'Trefl' },
  { prefix: ['005'], brand: 'Wrebbit' },
  { prefix: ['3558380','3558'], brand: 'Ravensburger' },
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

// ─── Requête brute sur un pays ───────────────────────────────────────────────
async function searchAmazonRaw(query, key, countryCode = 'fr', timeoutMs = 10000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=${countryCode}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`ScraperAPI [${countryCode}] erreur ${response.status} pour: "${query}"`);
      return [];
    }
    const data = await response.json();
    const allResults = data?.results ?? data?.organic_results ?? [];
    const filtered = allResults.filter(isPuzzleResult);
    console.log(`[${countryCode}] "${query}": ${allResults.length} résultats → ${filtered.length} puzzles`);
    return filtered;
  } catch (e) {
    if (e.name === 'AbortError') console.warn(`[${countryCode}] Timeout pour: "${query}"`);
    else console.error(`[${countryCode}] Erreur:`, e);
    return [];
  }
}

// ─── Recherche sur plusieurs pays en parallèle ───────────────────────────────
async function searchMultiCountry(query, key, countries = ['fr', 'com', 'de']) {
  const promises = countries.map(c => searchAmazonRaw(query, key, c));
  const results = await Promise.all(promises);
  // Fusionner + dédupliquer par ASIN
  const merged = [];
  const seen = new Set();
  for (const countryResults of results) {
    for (const item of countryResults) {
      const id = item.asin || item.name || item.title;
      if (id && !seen.has(id)) {
        seen.add(id);
        merged.push(item);
      }
    }
  }
  return merged;
}

// ─── Cascade de recherche principale ─────────────────────────────────────────
export async function searchAmazon(rawCode, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const ean = normalizeEAN(rawCode);
  console.log(`=== Scan EAN: ${ean} ===`);

  const brandInfo = detectBrandFromEAN(ean);
  console.log('Marque détectée:', brandInfo?.brand || 'inconnue');

  let results = [];

  // ── Étape 1 : EAN exact sur amazon.fr (le plus rapide) ──────────────────
  console.log('Étape 1: EAN exact sur amazon.fr');
  results = await searchAmazonRaw(ean, key, 'fr');
  if (results.length > 0) return results;

  // ── Étape 2 : EAN exact sur amazon.com + .de en parallèle ───────────────
  console.log('Étape 2: EAN exact sur amazon.com + .de');
  results = await searchMultiCountry(ean, key, ['com', 'de', 'es']);
  if (results.length > 0) return results;

  // ── Étape 3 : marque + EAN sur amazon.fr ────────────────────────────────
  if (brandInfo) {
    console.log(`Étape 3: "${brandInfo.brand} puzzle ${ean}" sur .fr`);
    results = await searchAmazonRaw(`${brandInfo.brand} puzzle ${ean}`, key, 'fr');
    if (results.length > 0) return results;
  }

  // ── Étape 4 : "puzzle" + EAN sur .fr et .com ────────────────────────────
  console.log('Étape 4: "puzzle [EAN]" sur .fr et .com');
  results = await searchMultiCountry(`puzzle ${ean}`, key, ['fr', 'com']);
  if (results.length > 0) return results;

  // ── Étape 5 : marque + EAN sur .com et .de ──────────────────────────────
  if (brandInfo) {
    console.log(`Étape 5: "${brandInfo.brand} ${ean}" sur .com + .de`);
    results = await searchMultiCountry(`${brandInfo.brand} ${ean}`, key, ['com', 'de']);
    if (results.length > 0) return results;
  }

  console.log('Aucun résultat trouvé pour EAN:', ean);
  return null;
}

// ─── Recherche par nom libre ─────────────────────────────────────────────────
export async function searchAmazonByName(name, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  console.log(`=== Recherche par nom: "${name}" ===`);
  let results = [];

  // Tentative 1 : "puzzle [nom]" sur .fr
  results = await searchAmazonRaw(`puzzle ${name}`, key, 'fr');
  if (results.length > 0) return results;

  // Tentative 2 : nom seul sur .fr (pour marques connues)
  results = await searchAmazonRaw(name, key, 'fr');
  if (results.length > 0) return results;

  // Tentative 3 : "puzzle [nom]" sur .com et .de en parallèle
  results = await searchMultiCountry(`puzzle ${name}`, key, ['com', 'de']);
  if (results.length > 0) return results;

  return null;
}

// ─── Détail produit par ASIN ─────────────────────────────────────────────────
export async function getProductByAsin(asin, apiKey, countryCode = 'fr') {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  // Essayer d'abord sur .fr, puis sur .com si pas de résultat
  for (const cc of [countryCode, 'com', 'de']) {
    try {
      const url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=${cc}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const data = await response.json();
      if (data?.name || data?.title) {
        console.log(`getProductByAsin [${cc}]:`, data?.name);
        return data;
      }
    } catch (e) {
      console.warn(`getProductByAsin [${cc}] erreur:`, e.message);
    }
  }
  return null;
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

  const limit = data?.requestCount?.monthlyLimit ?? data?.plan_request_credits ?? 0;
  const used = data?.requestCount?.thisMonthUsageCount ?? data?.usage ?? 0;
  return typeof limit === 'number' && typeof used === 'number' ? limit - used : limit;
}

export function invalidateScraperCache() {}
