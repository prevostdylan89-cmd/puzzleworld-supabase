import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Fonction de classification automatique
const classifyPuzzle = (title) => {
  const titleLower = (title || '').toLowerCase();

  const categoryRules = {
    'Nature': [
      'landscape', 'forest', 'sea', 'mountain', 'flowers', 'nature', 
      'paysage', 'forêt', 'mer', 'montagne', 'fleurs', 'ocean', 'lake',
      'beach', 'sunset', 'sunrise', 'tree', 'garden', 'wildlife'
    ],
    'Urbain': [
      'city', 'architecture', 'building', 'street', 'monument',
      'paris', 'new york', 'london', 'urban', 'skyline', 'ville',
      'tour eiffel', 'cathédrale', 'château', 'bridge', 'town', 'tour', 'urbain'
    ],
    'Disney': [
      'disney', 'pixar', 'mickey', 'minnie', 'princess', 'cartoon',
      'marvel', 'star wars', 'frozen', 'simba', 'princesse', 'animation'
    ],
    'Art': [
      'painting', 'art', 'artist', 'impressionist', 'van gogh', 
      'monet', 'picasso', 'renaissance', 'museum', 'artiste',
      'tableau', 'peinture', 'oeuvre'
    ],
    'Animaux': [
      'animal', 'cat', 'dog', 'bird', 'lion', 'tiger', 'elephant',
      'wolf', 'horse', 'pet', 'wildlife', 'animaux', 'chat', 'chien',
      'oiseau', 'faune', 'zoo'
    ],
    'Monochrome': [
      'black and white', 'noir et blanc', 'monochrome', 'gradient',
      'color splash', 'sepia', 'grayscale'
    ],
    'Vintage': [
      'vintage', 'retro', 'old', 'antique', 'classic', 'historical',
      'ancien', 'rétro', 'classique', 'nostalgique'
    ]
  };

  // Check each category
  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Autre';
};

export default function ReclassifyButton({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleReclassify = async () => {
    if (!confirm('Voulez-vous reclassifier tous les puzzles du catalogue ? Cette opération peut prendre quelques secondes.')) {
      return;
    }

    setLoading(true);
    toast.info('Début de la reclassification...');

    try {
      // Get all puzzles
      const allPuzzles = await base44.entities.PuzzleCatalog.list('-created_date', 1000);
      setProgress({ current: 0, total: allPuzzles.length });

      let updated = 0;
      let errors = 0;

      for (let i = 0; i < allPuzzles.length; i++) {
        const puzzle = allPuzzles[i];
        setProgress({ current: i + 1, total: allPuzzles.length });

        try {
          // Skip if already has a valid category (not empty, not 'Tous', not 'Other')
          if (puzzle.category_tag && 
              puzzle.category_tag !== 'Tous' && 
              puzzle.category_tag !== 'Other' &&
              puzzle.category_tag !== '') {
            continue;
          }

          // Classify based on title
          const newCategory = classifyPuzzle(puzzle.title);

          // Update puzzle
          await base44.entities.PuzzleCatalog.update(puzzle.id, {
            category_tag: newCategory
          });

          updated++;
        } catch (error) {
          console.error(`Error updating puzzle ${puzzle.id}:`, error);
          errors++;
        }

        // Small delay to avoid rate limiting
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      toast.success(`✅ Reclassification terminée ! ${updated} puzzles mis à jour, ${errors} erreurs`);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Reclassification error:', error);
      toast.error('Erreur lors de la reclassification');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Button
      onClick={handleReclassify}
      disabled={loading}
      variant="outline"
      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {progress.current > 0 && `${progress.current}/${progress.total}`}
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reclassifier le catalogue
        </>
      )}
    </Button>
  );
}