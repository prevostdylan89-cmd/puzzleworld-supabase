import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardRestore() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRestore = async (dryRun, batchSize = 50) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('restoreCatalogFromAsins', { dryRun, batchSize });
      setResult(res.data);
      if (!dryRun && res.data?.added > 0) {
        toast.success(`${res.data.added} puzzles ajoutés au catalogue !`);
      } else if (!dryRun && res.data?.added === 0) {
        toast.info('Aucun nouveau puzzle à importer.');
      }
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
        <p className="text-white/60">Récupère les puzzles manquants depuis les ASINs vus par les utilisateurs via Amazon.fr</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Comment ça marche ?</h3>
        <p className="text-white/50 text-sm mb-4">
          L'app collecte les ASINs Amazon des puzzles scannés ou vus par les utilisateurs. 
          Cette fonction compare ces ASINs avec le catalogue actuel, et pour chaque ASIN manquant, 
          elle appelle Amazon.fr pour récupérer le titre, la marque, l'image, le prix et les notes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleRestore(true)}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Analyser (sans importer)
          </Button>
          <Button
            onClick={() => handleRestore(false, 50)}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Importer 50 puzzles
          </Button>
          <Button
            onClick={() => handleRestore(false, 150)}
            disabled={loading}
            className="bg-orange-700 hover:bg-orange-800 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Importer 150 puzzles
          </Button>
        </div>
      </div>

      {result && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-3">
          <h3 className="text-white font-semibold">Résultat</h3>
          {result.dryRun && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
              <p className="text-yellow-400 text-sm font-medium">Mode analyse — aucun import effectué</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {result.totalSeen !== undefined && (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{result.totalSeen}</div>
                <div className="text-white/50 text-xs mt-1">ASINs vus</div>
              </div>
            )}
            {result.alreadyInCatalog !== undefined && (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{result.alreadyInCatalog}</div>
                <div className="text-white/50 text-xs mt-1">Déjà dans le catalogue</div>
              </div>
            )}
            {result.missing !== undefined && (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{result.missing}</div>
                <div className="text-white/50 text-xs mt-1">Manquants</div>
              </div>
            )}
            {result.added !== undefined && (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{result.added}</div>
                <div className="text-white/50 text-xs mt-1">Importés</div>
              </div>
            )}
          </div>
          {result.remaining > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3">
              <p className="text-orange-400 text-sm">
                Il reste encore <strong>{result.remaining}</strong> puzzles à importer. Clique à nouveau sur "Importer" pour continuer.
              </p>
            </div>
          )}
          {result.failed > 0 && (
            <p className="text-red-400 text-sm">{result.failed} échec(s) lors de la récupération Amazon.</p>
          )}
          {result.missingAsins?.length > 0 && (
            <p className="text-white/30 text-xs break-all">Exemples : {result.missingAsins.slice(0, 5).join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}