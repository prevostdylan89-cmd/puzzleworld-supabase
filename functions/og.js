/**
 * Cloudflare Pages Function — /functions/og.js
 * Intercepte les requêtes des bots sociaux vers /?ogpost=XXX
 * et retourne un HTML statique avec les balises OG du post.
 *
 * Déploiement : placer ce fichier dans /functions/og.js à la racine du projet.
 */

const SUPABASE_URL = 'https://ghbutltffpnrdkbtvlog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoYnV0bHRmZnBucmRrYnR2bG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDgzMTAsImV4cCI6MjA5MzQ4NDMxMH0.gU5V7C4-d8xAIy2nPUUr1IzwS2cS1yjyuvihbMwaJCo';
const SITE_URL = 'https://puzzleworld-supabase.pages.dev';
const SITE_NAME = 'PuzzleWorld 🧩';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

// Bots des réseaux sociaux qui ont besoin des balises OG
const BOT_UA = [
  'facebookexternalhit',
  'Twitterbot',
  'WhatsApp',
  'LinkedInBot',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
];

function isBot(userAgent = '') {
  return BOT_UA.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function escape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml({ title, description, image, url }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escape(title)}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="article" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <meta property="og:title"       content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url"         content="${escape(url)}" />
  <meta property="og:image"       content="${escape(image)}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale"      content="fr_FR" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${escape(title)}" />
  <meta name="twitter:description" content="${escape(description)}" />
  <meta name="twitter:image"       content="${escape(image)}" />

  <!-- Redirection immédiate pour les vrais utilisateurs -->
  <meta http-equiv="refresh" content="0; url=${escape(url)}" />
</head>
<body>
  <p>Redirection vers <a href="${escape(url)}">${SITE_NAME}</a>…</p>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const postId = url.searchParams.get('ogpost');
  const userAgent = request.headers.get('user-agent') || '';

  // Si pas d'ID de post → laisser passer vers l'app React
  if (!postId) {
    return context.next();
  }

  // Si c'est un vrai utilisateur (pas un bot) → rediriger vers la page sociale
  if (!isBot(userAgent)) {
    return Response.redirect(`${SITE_URL}/social?post=${postId}`, 302);
  }

  // C'est un bot → récupérer le post depuis Supabase et retourner l'HTML OG
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(postId)}&select=id,content,puzzle_name,puzzle_brand,image_url,author_name,created_by&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    const posts = await res.json();
    const post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;

    if (!post) {
      // Post introuvable → OG générique
      return new Response(
        buildOgHtml({
          title: SITE_NAME,
          description: 'La communauté des passionnés de puzzles',
          image: DEFAULT_OG_IMAGE,
          url: `${SITE_URL}/social`,
        }),
        { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
      );
    }

    // Construire le titre et la description à partir du post
    const authorName = post.author_name || post.created_by?.split('@')[0] || 'Un puzzleur';
    const puzzlePart = post.puzzle_name ? ` 🧩 ${post.puzzle_name}${post.puzzle_brand ? ` (${post.puzzle_brand})` : ''}` : '';
    const contentPreview = post.content
      ? post.content.slice(0, 200) + (post.content.length > 200 ? '…' : '')
      : '';

    const title = `${authorName} sur ${SITE_NAME}${puzzlePart}`;
    const description = contentPreview || `Découvrez ce post sur ${SITE_NAME} — la communauté des passionnés de puzzles !`;
    const image = post.image_url || DEFAULT_OG_IMAGE;
    const postUrl = `${SITE_URL}/social?post=${post.id}`;

    return new Response(
      buildOgHtml({ title, description, image, url: postUrl }),
      { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );

  } catch (err) {
    // Erreur réseau → OG générique
    return new Response(
      buildOgHtml({
        title: SITE_NAME,
        description: 'La communauté des passionnés de puzzles',
        image: DEFAULT_OG_IMAGE,
        url: `${SITE_URL}/social`,
      }),
      { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );
  }
}
