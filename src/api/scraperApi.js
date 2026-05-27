// scraperApi.js — Recherche puzzle optimisée : parallèle + fallback hors Amazon
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
  'ravensburger', 'clementoni', 'nathan', 'jumbo', 'educa', 'ceaco',
  'buffalo games', 'eurographics', 'cobble hill', 'galison', 'masterpieces',
  'white mountain', 'schmidt', 'heye', 'trefl', 'anatolian', 'castorland',
  'piatnik', 'd-toys', 'king puzzles', 'enjoy puzzle', 'magnolia puzzle',
  'grafika', 'pintoo', 'wrebbit', 'yazz puzzle', 'gibsons', 'winning moves',
  'diset', 'falcon', 'aquarius puzzles', 'funko games', 'cloudberries',
  'pomegranate', 'new york puzzle', 'sunsout', 'springbok', 'bits and pieces',
  'tomax', 'bluebird puzzle', 'art puzzle', 'step puzzle',
  'larsen puzzle', 'dino puzzle', 'cztery puzzle', 'play fun',
  'editions philibert', 'hachette', 'france cartes', 'djeco',
  'villainous', 'wasgij', 'escape puzzle', 'escape room puzzle',
  'panorama puzzle', 'impossible puzzle', 'mystery puzzle',
  'photomosaic', 'neon puzzle', 'glow puzzle',
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
  'poubelle', 'trash bag', 'garbage bag', 'bin bag', 'bin liner',
  'nettoyage', 'cleaning spray', 'detergent', 'lessive',
  'vêtement', 'clothing', 'tshirt', 't-shirt', 'shirt', 'hoodie',
  'chaussure', 'shoe', 'sneaker', 'boot', 'socks', 'chaussettes',
  'nourriture', 'food', 'snack', 'drink', 'beverage', 'sauce',
  'shampoo', 'shampooing', 'cosmetic', 'parfum', 'perfume', 'makeup',
  'laptop', 'tablet', 'phone', 'keyboard', 'mouse', 'headphone',
  'dvd', 'blu-ray', 'vinyl', 'roman', 'novel', 'magazine',
  'action figure', 'figurine', 'lego set', 'doll', 'poupée',
  'sticker', 'poster', 'wallpaper', 'tapisserie',
];

export function isPuzzleResult(result) {
  const title = (result.name || result.title || '').toLowerCase();
  const brand = (result.brand || '').toLowerCase();
  const category = (result.category || result.categories || '').toLowerCase();
  if (!title) return false;
  if (EXCLUDE_KEYWORDS.some(kw => title.includes(kw))) return false;
  if (category.includes('puzzle') || category.includes('jigsaw')) return true;
  if (PUZZLE_BRANDS_WHITELIST.some(b => title.includes(b) || brand.includes(b))) return true;
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
async function searchAmazonRaw(query, key, countryCode = 'fr', timeoutMs = 6000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${SCRAPER_BASE}?api_key=${key}&query=${encodeURIComponent(query)}&country_code=${countryCode}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      console.warn(`ScraperAPI [${countryCode}] erreur ${response.status}`);
      return [];
    }
    const data = await response.json();
    const allResults = data?.results ?? data?.organic_results ?? [];
    const filtered = allResults.filter(isPuzzleResult);
    console.log(`[${countryCode}] "${query}": ${filtered.length} puzzles`);
    return filtered;
  } catch (e) {
    if (e.name === 'AbortError') console.warn(`[${countryCode}] Timeout pour: "${query}"`);
    else console.error(`[${countryCode}] Erreur:`, e);
    return [];
  }
}

// ─── Recherche parallèle multi-pays avec race sur premier résultat ───────────
async function searchParallel(query, key, countries = ['fr', 'com', 'de']) {
  const promises = countries.map(c => searchAmazonRaw(query, key, c));
  const results = await Promise.all(promises);
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

// ─── Fallback 1 : Open Food Facts (EAN public, gratuit, instantané) ──────────
async function searchOpenFoodFacts(ean) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://world.openfoodfacts.org/api/v2/product/${ean}?fields=product_name,brands,image_url,image_front_url`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product;
    if (!p?.product_name) return null;
    const title = p.product_name;
    const brand = p.brands || '';
    const image = p.image_front_url || p.image_url || '';
    // Vérifier que c'est bien un puzzle
    if (!isPuzzleResult({ name: title, brand })) return null;
    console.log('OpenFoodFacts hit:', title);
    return { name: title, brand, image, asin: null, source: 'openfoodfacts' };
  } catch (e) {
    console.warn('OpenFoodFacts erreur:', e.message);
    return null;
  }
}

// ─── Fallback 2 : UPC Item DB (API gratuite, puzzles courants) ───────────────
async function searchUpcItemDb(ean) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item?.title) return null;
    const title = item.title;
    const brand = item.brand || '';
    const image = item.images?.[0] || '';
    console.log('UpcItemDB hit:', title);
    return {
      name: title,
      brand,
      image,
      asin: null,
      description: item.description || '',
      source: 'upcitemdb'
    };
  } catch (e) {
    console.warn('UpcItemDB erreur:', e.message);
    return null;
  }
}

// ─── Fallback 3 : Open Library / Barcode Spider style ────────────────────────
async function searchBarcodeLookup(ean) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    // go-upc est une API publique gratuite (100 req/jour sans clé)
    const url = `https://go-upc.com/api/v1/code/${ean}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.product?.name) return null;
    console.log('go-upc hit:', data.product.name);
    return {
      name: data.product.name,
      brand: data.product.brand || '',
      image: data.product.imageUrl || '',
      asin: null,
      source: 'go-upc'
    };
  } catch (e) {
    console.warn('go-upc erreur:', e.message);
    return null;
  }
}

// ─── Recherche cascade principale — OPTIMISÉE ────────────────────────────────
// Stratégie :
// 1. Tous les pays Amazon EN PARALLÈLE (fr + com + de) → ~4-6s max au lieu de 15-20s
// 2. Si marque connue + aucun résultat → recherche marque+EAN en parallèle
// 3. Si toujours rien → fallbacks hors Amazon en parallèle (UpcItemDB + OpenFoodFacts)
export async function searchAmazon(rawCode, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  const ean = normalizeEAN(rawCode);
  console.log(`=== Scan EAN: ${ean} ===`);

  const brandInfo = detectBrandFromEAN(ean);
  console.log('Marque détectée:', brandInfo?.brand || 'inconnue');

  // ── Étape 1 : EAN sur fr + com + de EN PARALLÈLE (gain majeur de temps) ──
  console.log('Étape 1: EAN exact sur .fr + .com + .de en parallèle');
  let results = await searchParallel(ean, key, ['fr', 'com', 'de']);
  if (results.length > 0) return results;

  // ── Étape 2 : "puzzle EAN" sur fr + com (si marque inconnue) ─────────────
  console.log('Étape 2: "puzzle [EAN]" sur .fr + .com');
  const queries = brandInfo
    ? [`${brandInfo.brand} puzzle ${ean}`, `puzzle ${ean}`]
    : [`puzzle ${ean}`];

  results = await searchParallel(queries[0], key, ['fr', 'com']);
  if (results.length > 0) return results;

  if (queries[1]) {
    results = await searchParallel(queries[1], key, ['fr', 'com']);
    if (results.length > 0) return results;
  }

  // ── Étape 3 : Fallbacks hors Amazon en parallèle ─────────────────────────
  console.log('Étape 3: Fallbacks hors Amazon (UpcItemDB + OpenFoodFacts + go-upc)');
  const [upcResult, offResult, goUpcResult] = await Promise.all([
    searchUpcItemDb(ean),
    searchOpenFoodFacts(ean),
    searchBarcodeLookup(ean),
  ]);

  const fallbackResult = upcResult || goUpcResult || offResult;
  if (fallbackResult) {
    console.log('Résultat hors Amazon:', fallbackResult.source);
    return [fallbackResult];
  }

  console.log('Aucun résultat trouvé pour EAN:', ean);
  return null;
}

// ─── Recherche par nom libre ─────────────────────────────────────────────────
export async function searchAmazonByName(name, apiKey) {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');
  console.log(`=== Recherche par nom: "${name}" ===`);

  // fr + com en parallèle directement
  let results = await searchParallel(`puzzle ${name}`, key, ['fr', 'com', 'de']);
  if (results.length > 0) return results;

  results = await searchParallel(name, key, ['fr', 'com']);
  if (results.length > 0) return results;

  return null;
}

// ─── Helper : extrait URL image depuis format string ou objet ─────────────────
export function extractImageUrl(img) {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (typeof img === 'object') {
    if (img.link && typeof img.link === 'string') return img.link;
    if (img.url && typeof img.url === 'string') return img.url;
    if (img.src && typeof img.src === 'string') return img.src;
  }
  return '';
}

// ─── Détail produit par ASIN ─────────────────────────────────────────────────
export async function getProductByAsin(asin, apiKey, countryCode = 'fr') {
  const key = apiKey || await getScraperApiKey();
  if (!key) throw new Error('Clé ScraperAPI non configurée');

  // fr + com + de en parallèle, on prend le premier qui répond avec image
  const tryCountry = async (cc) => {
    try {
      const url = `${SCRAPER_PRODUCT_BASE}?api_key=${key}&asin=${asin}&country_code=${cc}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;
      const data = await response.json();
      if (data?.name || data?.title) {
        // Normaliser les champs image pour assurer la cohérence
        const imgFromMain = extractImageUrl(data?.main_image);
        const imgFromArr = extractImageUrl(data?.images?.[0]) || extractImageUrl(data?.images?.[1]);
        data._resolvedImage = imgFromMain || imgFromArr || '';
        console.log(`getProductByAsin [${cc}]:`, data?.name || data?.title, '| image:', data._resolvedImage ? '✓' : '✗');
        return data;
      }
      return null;
    } catch (e) {
      console.warn(`getProductByAsin [${cc}] erreur:`, e.message);
      return null;
    }
  };

  // Race : prend le premier pays qui donne un résultat valide
  const results = await Promise.all([
    tryCountry(countryCode),
    tryCountry('com'),
    tryCountry('de'),
  ]);

  // Préférer un résultat qui a une image
  return results.find(r => r !== null && r._resolvedImage) || results.find(r => r !== null) || null;
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
