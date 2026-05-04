import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle, Loader2, Check, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Liste de mots interdits basique (complétée par l'IA)
const BANNED_WORDS = [
  'nazi', 'hitler', 'nigger', 'nigga', 'pute', 'salope', 'connard', 'enculé', 'fdp',
  'pédophile', 'viol', 'terrorist', 'jihad', 'kkk', 'nègre', 'pd', 'tapette',
  'batard', 'bâtard', 'merde', 'chier', 'bite', 'couille', 'cul', 'chatte', 'con',
  'admin', 'moderator', 'support', 'puzzleworld', 'system'
];

function generateFriendCode(username) {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${randomNum}${username.toLowerCase().replace(/\s+/g, '')}`;
}

function containsBannedWord(username) {
  const lower = username.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

function isValidUsername(username) {
  // Alphanumeric + underscores + spaces, 3-20 chars
  return /^[a-zA-Z0-9_\u00C0-\u017F ]{3,20}$/.test(username);
}

export default function UsernameSetupModal({ user, onComplete }) {
  const [step, setStep] = useState(1); // 1: choose username, 2: confirm with friend code
  const [username, setUsername] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const validateAndNext = async () => {
    setError('');
    const trimmed = username.trim();

    if (!isValidUsername(trimmed)) {
      setError('3 à 20 caractères, lettres, chiffres et _ uniquement');
      return;
    }

    if (containsBannedWord(trimmed)) {
      setError('Ce pseudo contient des mots non autorisés');
      return;
    }

    setChecking(true);
    try {
      // Check if username already taken
      const existing = await base44.entities.UserProfile.filter({ display_name: trimmed });
      if (existing.length > 0) {
        setError('Ce pseudo est déjà pris, choisis-en un autre');
        setChecking(false);
        return;
      }

      // Also check via AI for borderline content
      const aiCheck = await base44.integrations.Core.InvokeLLM({
        prompt: `Est-ce que le pseudo "${trimmed}" contient un mot injurieux, raciste, haineux, ou offensant en français ou anglais ? Réponds uniquement avec "oui" ou "non".`,
        response_json_schema: { type: 'object', properties: { forbidden: { type: 'boolean' } } }
      });

      if (aiCheck?.forbidden) {
        setError('Ce pseudo contient des termes non autorisés');
        setChecking(false);
        return;
      }

      const code = generateFriendCode(trimmed);
      setFriendCode(code);
      setStep(2);
    } catch (e) {
      // If AI check fails, still allow
      const code = generateFriendCode(trimmed);
      setFriendCode(code);
      setStep(2);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Save to UserProfile
      const existingProfile = await base44.entities.UserProfile.filter({ email: user.email });
      const profileData = {
        email: user.email,
        full_name: user.full_name || user.email,
        display_name: username.trim(),
        friend_code: friendCode,
        username_set: true
      };

      if (existingProfile.length > 0) {
        await base44.entities.UserProfile.update(existingProfile[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }

      // Also update User entity
      await base44.auth.updateMe({
        display_name: username.trim(),
        friend_code: friendCode,
        username_set: true
      });

      toast.success(`Bienvenue, ${username.trim()} !`);
      onComplete({ display_name: username.trim(), friend_code: friendCode });
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(`@${friendCode}`);
    toast.success('Code copié !');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl p-8 max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Puzzle className="w-8 h-8 text-white" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Choisissez votre pseudo</h2>
                <p className="text-white/50 text-sm">
                  Ce pseudo sera visible par tous les membres de la communauté
                </p>
              </div>

              <div>
                <Input
                  placeholder="Votre pseudo (ex: SuperPuzzleur)"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="bg-white/5 border-white/20 text-white text-center text-lg h-12"
                  maxLength={20}
                  onKeyDown={(e) => e.key === 'Enter' && validateAndNext()}
                  autoFocus
                />
                <p className="text-white/30 text-xs text-center mt-1">{username.length}/20 caractères</p>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 text-red-400 text-sm"
                  >
                    <X className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-4 text-xs text-white/40 space-y-1">
                <p>• 3 à 20 caractères (lettres, chiffres, _)</p>
                <p>• Un code ami unique sera généré automatiquement</p>
                <p>• Les pseudos offensants sont interdits</p>
              </div>

              <Button
                onClick={validateAndNext}
                disabled={checking || username.trim().length < 3}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12"
              >
                {checking ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vérification...</>
                ) : (
                  'Continuer →'
                )}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Votre profil est prêt !</h2>
                <p className="text-white/50 text-sm">
                  Voici votre identifiant unique pour ajouter des amis
                </p>
              </div>

              {/* Pseudo display */}
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">Pseudo affiché</p>
                <p className="text-2xl font-bold text-white">{username}</p>
              </div>

              {/* Friend code */}
              <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-white/40 text-xs mb-2 text-center">Votre code ami unique</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-lg px-4 py-3 text-center">
                    <span className="text-orange-400 font-bold text-lg font-mono">@{friendCode}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyCode}
                    className="border-white/20 text-white hover:bg-white/5 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white/30 text-xs text-center mt-2">
                  Partagez ce code pour que vos amis vous trouvent facilement
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-white/20 text-white hover:bg-white/5"
                >
                  ← Modifier
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> C'est parti !</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}