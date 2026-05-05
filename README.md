# 🧩 PuzzleWorld — Migration base44 → Supabase

## Ce que ce projet contient

Ce dossier est une **réécriture complète** de ton app PuzzleWorld pour fonctionner sans base44 :
- **Backend** : Supabase (base de données PostgreSQL + auth + storage)
- **Frontend** : React + Vite identique à l'original
- **Hosting** : compatible Netlify, Vercel, HostingFinger (export statique)
- **Application Android** : aucun changement nécessaire côté APK (même URL web)

---

## 1. Supabase — Créer les tables

1. Va sur [https://supabase.com](https://supabase.com) → ton projet `ghbutltffpnrdkbtvlog`
2. **SQL Editor** → Colle et exécute **`supabase_schema.sql`**
3. Dans **Authentication → Providers** → Active **Google** et configure ton Client ID / Secret Google

---

## 2. Supabase — Configurer l'Auth Google

1. Va sur [Google Cloud Console](https://console.cloud.google.com)
2. Crée des identifiants OAuth 2.0 (ou réutilise ceux déjà liés à ton app Android)
3. Dans "URIs de redirection autorisés", ajoute :
   - `https://ghbutltffpnrdkbtvlog.supabase.co/auth/v1/callback`
   - `https://TON-DOMAINE.com` (ton domaine HostingFinger)
4. Copie le Client ID et Client Secret dans Supabase → Authentication → Providers → Google

---

## 3. Supabase — Storage (images puzzles)

1. Supabase Dashboard → **Storage** → New bucket
2. Nom : `puzzle-images`, cocher **Public**
3. Ajoute une policy : `SELECT` public pour tout le monde

---

## 4. Variables d'environnement

Copie `.env.example` → `.env` :
```
VITE_SUPABASE_URL=https://ghbutltffpnrdkbtvlog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 5. Installation et build

```bash
npm install
npm run dev      # développement local
npm run build    # génère le dossier dist/
```

---

## 6. Déploiement HostingFinger

HostingFinger est un hébergement statique. Il suffit d'uploader le contenu du dossier `dist/` :

### Option A — Upload manuel
1. `npm run build` → dossier `dist/` généré
2. Connecte-toi à HostingFinger → ton site
3. Supprime les anciens fichiers → upload tout le contenu de `dist/`
4. **IMPORTANT** : assure-toi que les redirections SPA sont actives (voir ci-dessous)

### Option B — GitHub + déploiement automatique (recommandé)
Si HostingFinger supporte le déploiement via GitHub :
1. Push ce projet sur ton GitHub
2. Connecte HostingFinger à ce repo
3. Build command : `npm run build`
4. Publish directory : `dist`

### Configuration SPA obligatoire sur HostingFinger
Pour que les routes React fonctionnent (ex: `/Profile`, `/Collection`), il faut que toutes les URLs retournent `index.html`.

Si HostingFinger utilise un fichier `.htaccess` (Apache) :
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

Si HostingFinger utilise Nginx, demande à leur support d'ajouter :
```nginx
try_files $uri $uri/ /index.html;
```

Le fichier `public/_redirects` dans ce projet est pour **Netlify** (fonctionne automatiquement).

---

## 7. Déploiement Netlify (alternatif, gratuit)

1. Push sur GitHub
2. [netlify.com](https://netlify.com) → New site from Git
3. Build command : `npm run build`  
4. Publish directory : `dist`
5. Variables d'env : ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
6. Le fichier `netlify.toml` configure tout automatiquement ✅

---

## 8. Mise à jour de l'app Android (Google Play)

**Bonne nouvelle** : ton app Android n'a pas besoin d'être mise à jour si c'est une **WebView** qui charge ton URL.

Si tu as changé de domaine :
1. Dans ton code Android, mets à jour l'URL de la WebView
2. Si tu utilises Google Sign-In natif Android, ajoute le nouveau domaine dans Google Cloud Console
3. Génère un nouveau APK/AAB et publie sur Google Play Console

---

## 9. Changements dans le code source (pour les autres fichiers)

Dans tous tes fichiers de pages et composants, remplace :

### Imports base44
```js
// AVANT (base44)
import { base44 } from '@/api/base44Client';
import { UserPuzzle } from '@base44/sdk/dist/entities';

// APRÈS (Supabase)
import { UserPuzzle } from '@/api/entities';
```

### Auth
```js
// AVANT
const user = await base44.auth.me();
await base44.auth.updateMe({ ... });
base44.auth.redirectToLogin(window.location.href);

// APRÈS
const { user, updateMe, loginWithGoogle } = useAuth();
await updateMe({ ... });
// La redirection se fait automatiquement via App.jsx
```

### Fonctions serverless (base44/functions/)
Ces fonctions tournaient côté serveur base44. Avec Supabase, tu as 2 options :
- **Supabase Edge Functions** (TypeScript, déployé dans Supabase)
- **Netlify Functions** (si tu héberges sur Netlify)

Les fonctions principales à migrer : `calculateAchievements`, `lookupPuzzleByEan`, `getUserPublicStats`

---

## Architecture finale

```
puzzleworld-supabase/
├── src/
│   ├── api/
│   │   ├── supabaseClient.js   ← connexion Supabase
│   │   └── entities.js         ← toutes les entités (UserPuzzle, Post, etc.)
│   ├── lib/
│   │   ├── AuthContext.jsx     ← auth Supabase (Google OAuth, email, guest)
│   │   └── ...autres libs
│   ├── pages/
│   │   ├── Login.jsx           ← nouvelle page de connexion
│   │   └── ...toutes tes pages existantes
│   └── App.jsx                 ← routing + protection auth
├── public/
│   └── _redirects              ← SPA routing Netlify
├── supabase_schema.sql         ← créer toutes les tables
├── netlify.toml                ← déploiement Netlify automatique
├── vercel.json                 ← déploiement Vercel
├── .env.example                ← template variables d'env
└── vite.config.js              ← sans plugin base44
```

---

## 10. Migrations SQL supplémentaires (après la migration initiale)

Si tu as déjà déployé le schéma initial (`supabase_schema.sql`), exécute également `supabase_fix.sql` dans le SQL Editor de Supabase pour ajouter les colonnes manquantes :

```sql
-- Ce fichier ajoute les colonnes manquantes pour la compatibilité:
-- - friendships: requester_email, addressee_email, requester_name, addressee_name
-- - follows: follower_email (alias de created_by)
```

Ces colonnes sont nécessaires pour que les fonctionnalités d'amis et de suivis fonctionnent correctement.
