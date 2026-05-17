import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase envoie le token via le fragment #access_token=...&type=recovery
  // onAuthStateChange détecte l'événement PASSWORD_RECOVERY et établit la session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        // Session valide : l'utilisateur peut modifier son mot de passe
        setSessionReady(true);
      } else if (event === 'SIGNED_IN' && session) {
        // Parfois Supabase émet SIGNED_IN au lieu de PASSWORD_RECOVERY
        setSessionReady(true);
      }
    });

    // Vérifier si une session est déjà active (rechargement de page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Règles de validation du mot de passe
  const rules = [
    { label: 'Au moins 8 caractères', ok: password.length >= 8 },
    { label: 'Une lettre majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Une lettre minuscule', ok: /[a-z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
    { label: 'Les mots de passe correspondent', ok: password === confirmPassword && confirmPassword.length > 0 },
  ];
  const isValid = rules.every(r => r.ok);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success('Mot de passe mis à jour avec succès ! 🎉');
      // Déconnexion propre puis redirection vers login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lien invalide ou expiré
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-purple-800">Vérification du lien…</h2>
            <p className="text-sm text-slate-500">
              Si rien ne se passe, votre lien est peut-être expiré.
              <br />Les liens de réinitialisation expirent après 1 heure.
            </p>
            <Button variant="ghost" className="text-purple-600" onClick={() => navigate('/login')}>
              ← Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Succès
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="text-6xl mb-2">🎉</div>
            <h2 className="text-xl font-bold text-purple-800">Mot de passe mis à jour !</h2>
            <p className="text-slate-600">
              Votre mot de passe a été changé avec succès.
              <br />Vous allez être redirigé vers la connexion…
            </p>
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-3">🔐</div>
          <CardTitle className="text-2xl font-bold text-purple-800">Nouveau mot de passe</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Choisissez un mot de passe sécurisé.</p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Champ nouveau mot de passe */}
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Champ confirmation */}
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && isValid && handleSubmit()}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Indicateurs de sécurité */}
          {password.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
              {rules.map((rule, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${rule.ok ? 'text-green-600' : 'text-slate-400'}`}>
                  {rule.ok
                    ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  }
                  {rule.label}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="button"
            className="w-full bg-purple-700 hover:bg-purple-800 h-11"
            disabled={loading || !isValid}
            onClick={handleSubmit}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enregistrer le nouveau mot de passe
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
