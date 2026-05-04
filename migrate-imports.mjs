#!/usr/bin/env node
/**
 * migrate-imports.mjs
 * 
 * Exécute ce script UNE SEULE FOIS sur ton dossier src/ pour remplacer
 * automatiquement tous les imports base44 par les équivalents Supabase.
 *
 * Usage :
 *   node migrate-imports.mjs ./src
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const REPLACEMENTS = [
  // Client base44 → supabase
  [
    /import\s+\{[^}]*\}\s+from\s+['"]@base44\/sdk['"]/g,
    '// [migrated from @base44/sdk]'
  ],
  [
    /import\s+\{?\s*base44\s*\}?\s+from\s+['"]@\/api\/base44Client['"]/g,
    "import { supabase } from '@/api/supabaseClient'"
  ],
  // Entités
  [
    /from\s+['"]@base44\/sdk\/dist\/entities['"]/g,
    "from '@/api/entities'"
  ],
  [
    /from\s+['"]@\/integrations\/([^'"]+)['"]/g,
    "from '@/api/entities'"
  ],
  // app-params (plus nécessaire)
  [
    /import\s+\{[^}]*appParams[^}]*\}\s+from\s+['"][^'"]+app-params['"]\s*;?\n?/g,
    ''
  ],
  // base44.auth.me() → user depuis useAuth()
  [
    /await\s+base44\.auth\.me\(\)/g,
    'user /* récupéré depuis useAuth() */'
  ],
  // base44.auth.updateMe → updateMe depuis useAuth()
  [
    /await\s+base44\.auth\.updateMe\(/g,
    'await updateMe('
  ],
  // base44.auth.logout → logout depuis useAuth()
  [
    /base44\.auth\.logout\([^)]*\)/g,
    'logout()'
  ],
  // base44.auth.redirectToLogin → navigateToLogin depuis useAuth()
  [
    /base44\.auth\.redirectToLogin\([^)]*\)/g,
    'navigateToLogin()'
  ],
];

async function processFile(filePath) {
  const ext = extname(filePath);
  if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return;

  let content = await readFile(filePath, 'utf-8');
  let changed = false;

  for (const [pattern, replacement] of REPLACEMENTS) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(filePath, content, 'utf-8');
    console.log('✅ Migrated:', filePath);
  }
}

async function walkDir(dir) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry)) {
        await walkDir(fullPath);
      }
    } else {
      await processFile(fullPath);
    }
  }
}

const targetDir = process.argv[2] || './src';
console.log(`🔄 Migration des imports base44 → Supabase dans : ${targetDir}\n`);
await walkDir(targetDir);
console.log('\n✨ Migration terminée !');
console.log('⚠️  Vérifie les fichiers modifiés et teste ton app.');
