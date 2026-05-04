import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Key, RefreshCw, AlertTriangle, CheckCircle, Loader2, Eye, EyeOff, Zap, BarChart3, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SETTINGS_KEY = 'rainforest_api_settings';

export default function DashboardRainforest() {
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Charge la clé API depuis Supabase (table page_settings)
  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('page_settings')
        .select('settings')
        .eq('page_name', SETTINGS_KEY)
        .limit(1);

      if (data && data.length > 0 && data[0].settings?.api_key) {
        setApiKey(data[0].settings.api_key);
        // Charger les crédits automatiquement
        fetchCredits(data[0].settings.api_key);
      }
    } catch (e) {
      console.error('Erreur chargement settings:', e);
    }
  };

  // Récupère les infos de compte Rainforest API
  const fetchCredits = async (key = apiKey) => {
    if (!key) {
      toast.error('Aucune clé API configurée');
      return;
    }
    setLoadingCredits(true);
    try {
      const response = await fetch(
        `https://api.rainforestapi.com/account?api_key=${key}`
      );
      const data = await response.json();

      if (data.account_info) {
        setCredits(data.account_info);
        setLastChecked(new Date());
      } else if (data.request_info?.success === false) {
        toast.error('Clé API invalide ou expirée');
        setCredits(null);
      }
    } catch (e) {
      toast.error('Impossible de contacter Rainforest API');
    } finally {
      setLoadingCredits(false);
    }
  };

  // Sauvegarde la nouvelle clé API dans Supabase
  const saveApiKey = async () => {
    if (!newApiKey.trim()) {
      toast.error('Entre une clé API valide');
      return;
    }
    setSavingKey(true);
    try {
      // Vérifier la clé avant de sauvegarder
      const response = await fetch(
        `https://api.rainforestapi.com/account?api_key=${newApiKey.trim()}`
      );
      const data = await response.json();

      if (!data.account_info) {
        toast.error('Cette clé API est invalide');
        setSavingKey(false);
        return;
      }

      // Sauvegarder dans Supabase
      const { data: existing } = await supabase
        .from('page_settings')
        .select('id')
        .eq('page_name', SETTINGS_KEY)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('page_settings')
          .update({ settings: { api_key: newApiKey.trim() }, updated_date: new Date().toISOString() })
          .eq('page_name', SETTINGS_KEY);
      } else {
        await supabase
          .from('page_settings')
          .insert([{ page_name: SETTINGS_KEY, settings: { api_key: newApiKey.trim() }, is_visible: true }]);
      }

      setApiKey(newApiKey.trim());
      setNewApiKey('');
      setCredits(data.account_info);
      setLastChecked(new Date());
      toast.success('✅ Clé API mise à jour avec succès !');
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingKey(false);
    }
  };

  const creditPercent = credits
    ? Math.round((credits.credits_remaining / credits.credits_quota) * 100)
    : 0;

  const creditColor = creditPercent > 50
    ? 'text-green-400'
    : creditPercent > 20
    ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">🌧️ Rainforest API</h2>
        <p className="text-white/50 text-sm">Gestion de la clé API pour la recherche de puzzles Amazon</p>
      </div>

      {/* Statut des crédits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white/60 text-sm">Crédits restants</span>
            </div>
            {loadingCredits ? (
              <Loader2 className="w-5 h-5 animate-spin text-white/40" />
            ) : credits ? (
              <div>
                <p className={`text-2xl font-bold ${creditColor}`}>
                  {credits.credits_remaining?.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs">sur {credits.credits_quota?.toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-white/40 text-sm">—</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-white/60 text-sm">Crédits utilisés</span>
            </div>
            {credits ? (
              <div>
                <p className="text-2xl font-bold text-white">
                  {credits.credits_used?.toLocaleString()}
                </p>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${100 - creditPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm">—</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Dernière vérification</span>
            </div>
            <p className="text-white text-sm">
              {lastChecked
                ? lastChecked.toLocaleTimeString('fr-FR')
                : '—'}
            </p>
            {lastChecked && (
              <p className="text-white/40 text-xs">
                {lastChecked.toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerte si crédits bas */}
      {credits && creditPercent < 20 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Crédits presque épuisés !</p>
            <p className="text-red-300/70 text-sm">Il reste seulement {creditPercent}% de tes crédits. Change la clé API ci-dessous.</p>
          </div>
        </div>
      )}

      {/* Clé API actuelle */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-400" />
            Clé API actuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey || 'Aucune clé configurée'}
                readOnly
                className="bg-white/5 border-white/20 text-white/70 font-mono text-sm pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              onClick={() => fetchCredits()}
              disabled={loadingCredits || !apiKey}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loadingCredits
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
            </Button>
          </div>

          {credits && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Clé API valide — Plan : {credits.plan || 'Standard'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Changer la clé API */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-green-400" />
            Changer la clé API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/50 text-sm">
            Entre ta nouvelle clé API Rainforest. Elle sera vérifiée automatiquement avant d'être sauvegardée.
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nouvelle clé API Rainforest..."
              value={newApiKey}
              onChange={e => setNewApiKey(e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono text-sm flex-1"
            />
            <Button
              onClick={saveApiKey}
              disabled={savingKey || !newApiKey.trim()}
              className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
            >
              {savingKey
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Vérification...</>
                : '✅ Sauvegarder'
              }
            </Button>
          </div>
          <p className="text-white/30 text-xs">
            💡 Trouve ta clé sur <a href="https://app.rainforestapi.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">app.rainforestapi.com</a> → Account → API Key
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
