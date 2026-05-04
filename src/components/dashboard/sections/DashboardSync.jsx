import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function DashboardSync() {
  const [loading, setLoading] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  const handleSync = async (functionName) => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke(functionName, {});
      setSyncResults(result.data);
      toast.success(`${functionName} complété avec succès`);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Erreur lors de ${functionName}`);
    } finally {
      setLoading(false);
    }
  };

  const syncFunctions = [
    { name: 'syncCommentProfilePhotos', label: 'Sync Photo Commentaires' },
    { name: 'syncPostAuthorNames', label: 'Sync Noms Auteurs Posts' },
    { name: 'syncProfilePhotos', label: 'Sync Photos Profils' },
    { name: 'syncUserProfile', label: 'Sync Profils Utilisateurs' },
    { name: 'syncUserLevels', label: 'Sync Niveaux Utilisateurs' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Synchronisation</h2>
        <p className="text-white/60">Lancez les fonctions de synchronisation pour mettre à jour les données</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {syncFunctions.map((func) => (
          <button
            key={func.name}
            onClick={() => handleSync(func.name)}
            disabled={loading}
            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{func.label}</p>
                <p className="text-xs text-white/50 mt-1">{func.name}</p>
              </div>
              {loading ? (
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              ) : (
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSync(func.name);
                  }}
                >
                  Lancer
                </Button>
              )}
            </div>
          </button>
        ))}
      </div>

      {syncResults && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">Synchronisation réussie</p>
              <pre className="text-xs text-white/70 mt-2 overflow-auto max-h-48 bg-black/30 p-2 rounded">
                {JSON.stringify(syncResults, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}