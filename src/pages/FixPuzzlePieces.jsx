import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';

export default function FixPuzzlePieces() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const extractPiecesFromText = (text) => {
    if (!text) return null;
    
    const patterns = [
      /(\d+)\s*(pièces?|pieces?)/i,
      /(\d+)\s*p\b/i,
      /(\d+)\s*teile/i,
      /puzzle\s*(\d+)/i,
      /(\d{3,4})\s*(?:pc|pcs)/i,
      /format\s*(\d+)\s*pièces/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && parseInt(match[1]) >= 100) {
        return parseInt(match[1]);
      }
    }
    return null;
  };

  const fixPuzzlePieces = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const allPuzzles = await base44.entities.PuzzleCatalog.list();
      
      let fixed = 0;
      let skipped = 0;
      let errors = 0;
      const fixedPuzzles = [];

      for (const puzzle of allPuzzles) {
        // Skip if piece_count is valid (> 0)
        if (puzzle.piece_count && puzzle.piece_count > 0) {
          skipped++;
          continue;
        }

        let pieces = null;

        // Try to extract from title
        pieces = extractPiecesFromText(puzzle.title);

        // If not found, try description
        if (!pieces) {
          pieces = extractPiecesFromText(puzzle.description);
        }

        if (pieces) {
          try {
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              piece_count: pieces
            });
            fixed++;
            fixedPuzzles.push({
              title: puzzle.title,
              pieces: pieces
            });
          } catch (error) {
            console.error('Error updating puzzle:', puzzle.id, error);
            errors++;
          }
        } else {
          skipped++;
        }
      }

      setResults({
        total: allPuzzles.length,
        fixed,
        skipped,
        errors,
        fixedPuzzles
      });

      toast.success(`${fixed} puzzles mis à jour avec succès!`);
    } catch (error) {
      console.error('Error fixing puzzles:', error);
      toast.error('Erreur lors de la correction des puzzles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000019] to-[#0a0a2e] p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Corriger les Nombres de Pièces</CardTitle>
            <CardDescription className="text-white/60">
              Analyse les titres et descriptions pour remplir les piece_count manquants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={fixPuzzlePieces}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Correction en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lancer la correction
                </>
              )}
            </Button>

            {results && (
              <div className="mt-6 space-y-4">
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <h3 className="text-white font-semibold mb-3">Résultats</h3>
                  <div className="space-y-2 text-white/80">
                    <p>Total de puzzles analysés: <span className="font-bold">{results.total}</span></p>
                    <p className="text-green-400">✓ Puzzles corrigés: <span className="font-bold">{results.fixed}</span></p>
                    <p className="text-white/50">⊘ Puzzles ignorés (déjà OK): <span className="font-bold">{results.skipped}</span></p>
                    {results.errors > 0 && (
                      <p className="text-red-400">✗ Erreurs: <span className="font-bold">{results.errors}</span></p>
                    )}
                  </div>
                </div>

                {results.fixedPuzzles.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 max-h-96 overflow-y-auto">
                    <h4 className="text-white font-semibold mb-3">Puzzles mis à jour:</h4>
                    <div className="space-y-2">
                      {results.fixedPuzzles.map((puzzle, idx) => (
                        <div key={idx} className="text-sm text-white/70 border-b border-white/5 pb-2">
                          <p className="text-white">{puzzle.title}</p>
                          <p className="text-orange-400">→ {puzzle.pieces} pièces ajoutées</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}