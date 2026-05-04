import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Génère un sourcemap pour le debug en prod
    sourcemap: false,
    rollupOptions: {
      output: {
        // Découpage des chunks pour optimiser le cache
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
        }
      }
    }
  },
  // Support SPA : toutes les routes → index.html
  // (à configurer aussi côté hosting, voir _redirects / netlify.toml)
});
