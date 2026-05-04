import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-3">🧩</div>
          <CardTitle className="text-2xl font-bold text-purple-800">PuzzleWorld</CardTitle>
          <p className="text-sm text-slate-500 mt-1">La communauté des passionnés de puzzles</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth */}
          <Button
            className="w-full flex items-center gap-3 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
            variant="outline"
            onClick={loginWithGoogle}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.4 1.2 8.8 3.1l6.5-6.5C35.2 2.7 29.9.5 24 .5 14.9.5 7.1 5.9 3.3 13.7l7.6 5.9C12.8 13.4 17.9 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 7.2-16.9z"/>
              <path fill="#FBBC05" d="M10.9 28.4A14.5 14.5 0 0 1 9.5 24c0-1.5.3-3 .7-4.4l-7.6-5.9A23.5 23.5 0 0 0 .5 24c0 3.7.9 7.3 2.4 10.4l8-6z"/>
              <path fill="#34A853" d="M24 47.5c5.9 0 10.9-2 14.5-5.4l-7.4-5.7c-2 1.3-4.5 2.1-7.1 2.1-6.1 0-11.2-3.9-13.1-9.3l-8 6C7 43.1 14.9 47.5 24 47.5z"/>
            </svg>
            Continuer avec Google
          </Button>

          <div className="relative flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email/Password */}
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
            />
            <Input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="button"
              className="w-full bg-purple-700 hover:bg-purple-800"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>Pas encore de compte ?{' '}
                <button className="text-purple-700 font-medium hover:underline" onClick={() => setMode('signup')}>
                  S'inscrire
                </button>
              </>
            ) : (
              <>Déjà un compte ?{' '}
                <button className="text-purple-700 font-medium hover:underline" onClick={() => setMode('login')}>
                  Se connecter
                </button>
              </>
            )}
          </p>

          <Button
            variant="ghost"
            className="w-full text-slate-500 text-sm"
            onClick={continueAsGuest}
          >
            Continuer en tant qu'invité
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
