import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { invalidateRainforestCache } from '@/api/rainforestApi';
import { toast } from 'sonner';
import { Key, RefreshCw, AlertTriangle, CheckCircle, Loader2, Eye, EyeOff, Zap, BarChart3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SETTINGS_KEY = 'rainforest_api_settings';

export default function DashboardRainforest() {
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'ok' | 'error'
  const [loadingTest, setLoadingTest] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [manualCredits, setManualCredits] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('page_settings')
        .select('settings')
        .eq('page_name', SETTINGS_KEY)
        .limit(1);
      if (data && data.length > 0) {
        const s = data[0].settings || {};
        if (s.api_key) setApiKey(s.api_key);
        if (s.credits_remaining !== undefined) setManualCredits(s.credits_remaining);
        if (s.last_checked) setLastChecked(new Date(s.last_checked));
      }
    } catch (e) {}
  };

  // Teste la clé via la Edge Function Supabase (évite CORS)
  const testApiKey = async (key = apiKey) => {
    if (!key) { toast.error('Aucune clé API configurée'); return; }
    setLoadingTest(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('rainforest-proxy', {
        body: { type: 'search', amazon_domain: 'amazon.fr', search_term: 'puzzle', page: '1' },
      });

      if (error && error.message?.includes('non configurée')) {
        setTestResult('error');
        toast.error('❌ Clé non sauvegardée en base');
      } else if (error) {
        // La clé est en base mais l'edge function n'est pas déployée → essai direct
        const response = await fetch(
          `https://api.rainforestapi.com/request?api_key=${key}&type=search&amazon_domain=amazon.fr&search_term=puzzle&page=1`
        );
        if (response.ok) {
          setTestResult('ok');
          setLastChecked(new Date());
          toast.success('✅ Clé API valide et fonctionnelle !');
        } else if (response.status === 401) {
          setTestResult('error');
          toast.error('❌ Clé API invalide');
        } else if (response.status === 402) {
          setTestResult('error');
          toast.error('⚠️ Crédits épuisés');
        } else {
          setTestResult('error');
          toast.error(`Erreur ${response.status} — déploie la Edge Function pour éviter CORS`);
        }
      } else if (data?.request_info?.success === false) {
        setTestResult('error');
        toast.error('❌ Clé API invalide ou crédits épuisés');
      } else {
        setTestResult('ok');
        setLastChecked(new Date());
        // Lire les crédits restants si disponibles
        if (data?.request_metadata?.credits_remaining !== undefined) {
          const credits = data.request_metadata.credits_remaining;
          setManualCredits(credits);
          await saveCredits(credits);
          toast.success(`✅ Clé valide — ${credits} crédits restants`);
        } else {
          toast.success('✅ Clé API valide et fonctionnelle !');
        }
      }
    } catch (e) {
      setTestResult('error');
      toast.error('Impossible de tester la clé');
    } finally {
      setLoadingTest(false);
    }
  };

  const saveApiKey = async () => {
    if (!newApiKey.trim()) { toast.error('Entre une clé API'); return; }
    setSavingKey(true);
    try {
      const settings = {
        api_key: newApiKey.trim(),
        credits_remaining: manualCredits,
        last_checked: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('page_settings')
        .select('id')
        .eq('page_name', SETTINGS_KEY)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('page_settings')
          .update({ settings, updated_date: new Date().toISOString() })
          .eq('page_name', SETTINGS_KEY);
      } else {
        await supabase
          .from('page_settings')
          .insert([{ page_name: SETTINGS_KEY, settings, is_active: true }]);
      }

      setApiKey(newApiKey.trim());
      setNewApiKey('');
      invalidateRainforestCache(); // Vider le cache mémoire
      toast.success('✅ Clé API sauvegardée !');
      // Tester la nouvelle clé
      await testApiKey(newApiKey.trim());
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde : ' + e.message);
    } finally {
      setSavingKey(false);
    }
  };

  const saveCredits = async (credits) => {
    try {
      const { data: existing } = await supabase
        .from('page_settings')
        .select('id, settings')
        .eq('page_name', SETTINGS_KEY)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('page_settings')
          .update({
            settings: { ...existing[0].settings, credits_remaining: parseInt(credits) },
            updated_date: new Date().toISOString()
          })
          .eq('page_name', SETTINGS_KEY);
        toast.success('Crédits mis à jour');
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">🌧️ Rainforest API</h2>
        <p className="text-white/50 text-sm">Gestion de la clé API pour la recherche de puzzles Amazon</p>
      </div>

      {/* Statut */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white/60 text-sm">Crédits restants</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={manualCredits ?? ''}
                onChange={e => setManualCredits(e.target.value)}
                onBlur={e => saveCredits(e.target.value)}
                placeholder="Ex: 100"
                className="bg-white/5 border-white/20 text-white w-32 h-8 text-sm"
              />
              <span className="text-white/40 text-xs">crédits (à saisir manuellement)</span>
            </div>
            {manualCredits !== null && parseInt(manualCredits) < 20 && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                Crédits bas !
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Statut de la clé</span>
            </div>
            {testResult === 'ok' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Clé valide ✅</span>
              </div>
            )}
            {testResult === 'error' && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Clé invalide ou crédits épuisés</span>
              </div>
            )}
            {testResult === null && (
              <p className="text-white/40 text-sm">Non testé</p>
            )}
            {lastChecked && (
              <p className="text-white/30 text-xs mt-1">
                Testé le {lastChecked.toLocaleDateString('fr-FR')} à {lastChecked.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clé actuelle */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-400" />
            Clé API actuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
              onClick={() => testApiKey()}
              disabled={loadingTest || !apiKey}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loadingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-white/30 text-xs">⚠️ Le test consomme 1 crédit Rainforest</p>
        </CardContent>
      </Card>

      {/* Nouvelle clé */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-green-400" />
            Changer la clé API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/50 text-sm">
            Entre ta nouvelle clé API Rainforest. Trouve-la sur{' '}
            <a href="https://app.rainforestapi.com/account" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
              app.rainforestapi.com → Account → Plan & Payment
            </a>
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nouvelle clé API..."
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
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sauvegarde...</>
                : '✅ Sauvegarder'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
