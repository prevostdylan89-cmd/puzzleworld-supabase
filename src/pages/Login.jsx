import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.8 3.1l6.5-6.5C35.2 2.7 29.9.5 24 .5 14.9.5 7.1 5.9 3.3 13.7l7.6 5.9C12.8 13.4 17.9 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 7.2-16.9z"/>
      <path fill="#FBBC05" d="M10.9 28.4A14.5 14.5 0 0 1 9.5 24c0-1.5.3-3 .7-4.4l-7.6-5.9A23.5 23.5 0 0 0 .5 24c0 3.7.9 7.3 2.4 10.4l8-6z"/>
      <path fill="#34A853" d="M24 47.5c5.9 0 10.9-2 14.5-5.4l-7.4-5.7c-2 1.3-4.5 2.1-7.1 2.1-6.1 0-11.2-3.9-13.1-9.3l-8 6C7 43.1 14.9 47.5 24 47.5z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'magic'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  const [magicSent, setMagicSent] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading('email');
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    try { await loginWithGoogle(); } catch (err) { setError(err.message); setLoading(null); }
  };

  const handleMagicLink = async () => {
    if (!email) { setError("Entrez votre email d'abord"); return; }
    setLoading('magic');
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      setMagicSent(true);
      toast.success('Lien envoyé ! Vérifiez votre boîte mail 📧');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const isLoading = (key) => loading === key;
  const anyLoading = loading !== null;

  if (magicSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="text-6xl mb-2">📧</div>
            <h2 className="text-xl font-bold text-purple-800">Vérifiez votre email !</h2>
            <p className="text-slate-600">
              Un lien de connexion magique a été envoyé à <strong>{email}</strong>.
              <br />Cliquez dessus pour vous connecter.
            </p>
            <p className="text-xs text-slate-400">Vérifiez aussi vos spams si vous ne le voyez pas.</p>
            <Button variant="ghost" className="text-purple-600" onClick={() => setMagicSent(false)}>
              ← Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-3">🧩</div>
          <CardTitle className="text-2xl font-bold text-purple-800">PuzzleWorld</CardTitle>
          <p className="text-sm text-slate-500 mt-1">La communauté des passionnés de puzzles</p>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* Google */}
          <Button
            className="w-full flex items-center gap-3 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 h-11"
            variant="outline"
            disabled={anyLoading}
            onClick={handleGoogle}
          >
            {isLoading('google') ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Continuer avec Google
          </Button>

          {/* Séparateur */}
          <div className="relative flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">ou avec email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Onglets */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {[
              { key: 'login', label: 'Connexion' },
              { key: 'signup', label: 'Inscription' },
              { key: 'magic', label: '✨ Lien magique' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setError(null); }}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                  mode === key ? 'bg-white shadow text-purple-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Email */}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && mode !== 'magic' && handleSubmit(e)}
            disabled={anyLoading}
          />

          {/* Mot de passe */}
          {mode !== 'magic' && (
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              disabled={anyLoading}
            />
          )}

          {mode === 'magic' && (
            <p className="text-xs text-slate-500 text-center">
              Recevez un lien de connexion direct par email — sans mot de passe.
            </p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Bouton principal */}
          {mode === 'magic' ? (
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-11"
              disabled={anyLoading || !email}
              onClick={handleMagicLink}
            >
              {isLoading('magic') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Envoyer le lien magique
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full bg-purple-700 hover:bg-purple-800 h-11"
              disabled={anyLoading}
              onClick={handleSubmit}
            >
              {isLoading('email') ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </Button>
          )}

          {/* Mode invité */}
          <Button
            variant="ghost"
            className="w-full text-slate-500 text-sm"
            disabled={anyLoading}
            onClick={continueAsGuest}
          >
            Continuer en tant qu'invité
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
