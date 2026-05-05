import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Download, RefreshCw, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardRestore() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Analyse locale: compare user_seen_puzzles ASINs vs puzzle_catalog
  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const [{ data: seen }, { data: catalog }] = await Promise.all([
        supabase.from('user_seen_puzzles').select('asin').not('asin', 'is', null),
        supabase.from('puzzle_catalog').select('asin').not('asin', 'is', null),
      ]);
      const seenAsins = new Set((seen || []).map(r => r.asin).filter(Boolean));
      const catalogAsins = new Set((catalog || []).map(r => r.asin).filter(Boolean));
      const missing = [...seenAsins].filter(a => !catalogAsins.has(a));
      setResult({
        dryRun: true,
        totalSeen: seenAsins.size,
        alreadyInCatalog: seenAsins.size - missing.length,
        missing: missing.length,
        missingAsins: missing.slice(0, 10),
      });
      toast.success('Analyse terminée');
    } catch (err) {
      toast.error('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Restauration du Catalogue</h2>
        <p className="text-white/60">Analyse les ASINs vus par les utilisateurs et identifie les puzzles manquants</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-300 font-medium text-sm">Import via Rainforest API</p>
          <p className="text-white/50 text-sm mt-1">
            L'import automatique des puzzles depuis Amazon.fr nécessite une Supabase Edge Function
            avec accès à la Rainforest API. Activez-la depuis l'onglet "Rainforest API" du dashboard.
            Cette page permet uniquement l'analyse locale des ASINs manquants.
          </p>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Analyser les ASINs manquants</h3>
        <p className="text-white/50 text-sm mb-4">
          Compare les ASINs des puzzles vus avec le catalogue existant pour identifier les manquants.
        </p>
        <Button onClick={handleAnalyze} disabled={loading} variant="outline" className="border-white/20 text-white hover:bg-white/10">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Analyser (sans importer)
        </Button>
      </div>

      {result && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-3">
          <h3 className="text-white font-semibold">Résultat de l'analyse</h3>
          {result.dryRun && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
              <p className="text-yellow-400 text-sm font-medium">Mode analyse — aucun import effectué</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{result.totalSeen}</div>
              <div className="text-white/50 text-xs mt-1">ASINs vus</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.alreadyInCatalog}</div>
              <div className="text-white/50 text-xs mt-1">Déjà dans le catalogue</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{result.missing}</div>
              <div className="text-white/50 text-xs mt-1">Manquants</div>
            </div>
          </div>
          {result.missingAsins?.length > 0 && (
            <p className="text-white/30 text-xs break-all">Exemples : {result.missingAsins.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
