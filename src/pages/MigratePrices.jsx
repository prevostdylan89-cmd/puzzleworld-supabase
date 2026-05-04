import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MigratePrices() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const migratePrices = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Récupérer tous les puzzles
      const puzzles = await base44.entities.PuzzleCatalog.list('-created_date', 1000);
      
      let migrated = 0;
      let skipped = 0;
      let errors = 0;

      for (const puzzle of puzzles) {
        try {
          // Si le puzzle a un champ 'price' mais pas 'amazon_price'
          if (puzzle.price && !puzzle.amazon_price) {
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              amazon_price: puzzle.price
            });
            migrated++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error(`Error updating puzzle ${puzzle.id}:`, error);
          errors++;
        }
      }

      setResult({
        total: puzzles.length,
        migrated,
        skipped,
        errors
      });

      if (migrated > 0) {
        toast.success(`✅ Migration terminée : ${migrated} prix mis à jour`);
      } else {
        toast.info('Aucun prix à migrer');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000019] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Migration des Prix</h1>

        <Card className="bg-[#0a0a2e] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Migrer les anciens prix vers amazon_price</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/70 text-sm">
              Cette action copiera tous les prix du champ 'price' vers 'amazon_price' 
              pour les puzzles qui n'ont pas encore de prix Amazon.
            </p>

            <Button
              onClick={migratePrices}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lancer la migration
                </>
              )}
            </Button>

            {result && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg space-y-2">
                <h3 className="font-semibold text-white mb-3">Résultats :</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-white/70">Total de puzzles : {result.total}</p>
                  <p className="text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Prix migrés : {result.migrated}
                  </p>
                  <p className="text-white/50">Ignorés : {result.skipped}</p>
                  {result.errors > 0 && (
                    <p className="text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Erreurs : {result.errors}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}