import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getScraperCredits } from '@/api/scraperApi';
import { toast } from 'sonner';
import {
  Key, RefreshCw, AlertTriangle, CheckCircle,
  Loader2, Eye, EyeOff, Zap, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SETTINGS_KEY = 'scraper_api_settings';

export default function DashboardRainforest() {
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('page_settings').select('settings').eq('page_name', SETTINGS_KEY).limit(1);
      if (data && data.length > 0) {
        const s = data[0].settings || {};
        if (s.api_key) setApiKey(s.api_key);
        if (s.credits_remaining !== undefined) setCredits(s.credits_remaining);
        if (s.last_checked) setLastChecked(new Date(s.last_checked));
      }
    } catch (e) {}
  };

  const fetchCredits = async (key = apiKey) => {
    if (!key) { toast.error('Aucune cle API configuree'); return; }
    setLoadingCredits(true);
    try {
      const remaining = await getScraperCredits(key);
      setCredits(remaining);
      await saveCreditsToDb(remaining);
      toast.success('Credits recuperes : ' + remaining);
    } catch (e) {
      toast.error('Erreur credits : ' + e.message);
    } finally {
      setLoadingCredits(false);
    }
  };

  const testApiKey = async (key = apiKey) => {
    if (!key) { toast.error('Aucune cle API configuree'); return; }
    setLoadingTest(true);
    setTestResult(null);
    try {
      const remaining = await getScraperCredits(key);
      if (remaining !== null) {
        setTestResult('ok');
        setLastChecked(new Date());
        setCredits(remaining);
        await saveCreditsToDb(remaining);
        toast.success('Cle API valide !');
      }
    } catch (e) {
      setTestResult('error');
      toast.error('Erreur : ' + e.message);
    } finally {
      setLoadingTest(false);
    }
  };

  const saveApiKey = async () => {
    if (!newApiKey.trim()) { toast.error('Entre une cle API'); return; }
    setSavingKey(true);
    try {
      const settings = { api_key: newApiKey.trim(), credits_remaining: credits, last_checked: new Date().toISOString() };
      const { data: existing } = await supabase.from('page_settings').select('id').eq('page_name', SETTINGS_KEY).limit(1);
      if (existing && existing.length > 0) {
        await supabase.from('page_settings').update({ settings, updated_date: new Date().toISOString() }).eq('page_name', SETTINGS_KEY);
      } else {
        await supabase.from('page_settings').insert([{ page_name: SETTINGS_KEY, settings, is_active: true }]);
      }
      setApiKey(newApiKey.trim());
      setNewApiKey('');
      toast.success('Cle API sauvegardee !');
      await testApiKey(newApiKey.trim());
    } catch (e) {
      toast.error('Erreur sauvegarde : ' + e.message);
    } finally {
      setSavingKey(false);
    }
  };

  const saveCreditsToDb = async (val) => {
    try {
      const { data: existing } = await supabase.from('page_settings').select('id, settings').eq('page_name', SETTINGS_KEY).limit(1);
      if (existing && existing.length > 0) {
        await supabase.from('page_settings').update({
          settings: { ...existing[0].settings, credits_remaining: val },
          updated_date: new Date().toISOString()
        }).eq('page_name', SETTINGS_KEY);
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Rainforest API</h2>
        <p className="text-white/50 text-sm">Gestion de la cle API pour la recherche de puzzles Amazon</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-white/60 text-sm">Credits restants ce mois</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white">
                {credits !== null ? credits.toLocaleString() : '-'}
              </span>
              <Button onClick={() => fetchCredits()} disabled={loadingCredits || !apiKey} size="sm" className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30">
                {loadingCredits ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </Button>
            </div>
            {credits !== null && credits < 50 && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                Credits bas ! Recharge ton compte Rainforest API.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Statut de la cle</span>
            </div>
            {testResult === 'ok' && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Cle valide</span>
              </div>
            )}
            {testResult === 'error' && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Cle invalide ou expiree</span>
              </div>
            )}
            {testResult === null && <p className="text-white/40 text-sm">Non teste</p>}
            {lastChecked && (
              <p className="text-white/30 text-xs mt-1">
                Teste le {lastChecked.toLocaleDateString('fr-FR')} a {lastChecked.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-400" />
            Cle API actuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey || 'Aucune cle configuree'}
                readOnly
                className="bg-white/5 border-white/20 text-white/70 font-mono text-sm pr-10"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={() => testApiKey()} disabled={loadingTest || !apiKey} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loadingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-white/30 text-xs">Le test consomme 1 credit Rainforest API</p>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-green-400" />
            Changer la cle API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/50 text-sm">Trouve ta cle sur app.rainforestapi.com dans le dashboard</p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nouvelle cle API Rainforest..."
              value={newApiKey}
              onChange={e => setNewApiKey(e.target.value)}
              className="bg-white/5 border-white/20 text-white font-mono text-sm flex-1"
            />
            <Button onClick={saveApiKey} disabled={savingKey || !newApiKey.trim()} className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">
              {savingKey ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sauvegarde...</> : 'Sauvegarder'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <p className="text-blue-300 text-sm font-medium mb-2">A propos de Rainforest API</p>
          <ul className="text-white/50 text-xs space-y-1">
            <li>Plan gratuit : 100 requetes par mois</li>
            <li>1 recherche = 1 requete</li>
            <li>Resultats directs depuis Amazon.fr</li>
            <li>Marque, pieces, images HD disponibles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}