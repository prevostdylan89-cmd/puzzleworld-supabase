import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

// Sync functions implemented locally using Supabase
const syncFunctions = {
  // Sync display_name in posts based on user_profiles
  async syncPostAuthorNames() {
    const { data: posts } = await supabase.from('posts').select('id, created_by, author_name');
    if (!posts?.length) return { updated: 0 };
    const { data: profiles } = await supabase.from('user_profiles').select('created_by, display_name');
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.created_by] = p.display_name; });
    let updated = 0;
    for (const post of posts) {
      const newName = profileMap[post.created_by];
      if (newName && newName !== post.author_name) {
        await supabase.from('posts').update({ author_name: newName }).eq('id', post.id);
        updated++;
      }
    }
    return { updated };
  },

  // Sync profile photos in comments
  async syncCommentProfilePhotos() {
    // Comments use author_name to identify users — nothing to sync structurally
    return { message: 'Les photos de commentaires sont chargées dynamiquement depuis user_profiles' };
  },

  // Sync profile photos in user_profiles from auth metadata
  async syncProfilePhotos() {
    const { data: { users }, error } = await supabase.auth.admin?.listUsers?.() || { data: { users: [] } };
    if (error || !users?.length) return { message: 'Accès admin requis pour synchroniser les photos' };
    let updated = 0;
    for (const u of users) {
      const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
      if (!avatar) continue;
      await supabase.from('user_profiles').upsert({ created_by: u.email, profile_photo: avatar }, { onConflict: 'created_by', ignoreDuplicates: false });
      updated++;
    }
    return { updated };
  },

  // Sync user levels from scan counts
  async syncUserLevels() {
    const { data: profiles } = await supabase.from('user_profiles').select('created_by');
    if (!profiles?.length) return { updated: 0 };
    let updated = 0;
    for (const p of profiles) {
      const { count } = await supabase.from('puzzle_catalog').select('id', { count: 'exact', head: true }).eq('created_by', p.created_by);
      const scans = count || 0;
      let level = 1;
      if (scans >= 400) level = 10;
      else if (scans >= 250) level = 9;
      else if (scans >= 150) level = 8;
      else if (scans >= 100) level = 7;
      else if (scans >= 75) level = 6;
      else if (scans >= 50) level = 5;
      else if (scans >= 35) level = 4;
      else if (scans >= 20) level = 3;
      else if (scans >= 10) level = 2;
      await supabase.from('user_levels').upsert({ created_by: p.created_by, level, total_scans: scans }, { onConflict: 'created_by' });
      updated++;
    }
    return { updated };
  },

  // Sync user profile from auth metadata
  async syncUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non connecté' };
    const meta = user.user_metadata || {};
    await supabase.from('user_profiles').upsert({
      created_by: user.email,
      email: user.email,
      full_name: meta.full_name || meta.name || user.email.split('@')[0],
      profile_photo: meta.avatar_url || meta.picture || null,
    }, { onConflict: 'created_by', ignoreDuplicates: false });
    return { success: true, email: user.email };
  },
};

const SYNC_ITEMS = [
  { name: 'syncPostAuthorNames', label: 'Sync Noms Auteurs Posts' },
  { name: 'syncCommentProfilePhotos', label: 'Sync Photo Commentaires' },
  { name: 'syncProfilePhotos', label: 'Sync Photos Profils' },
  { name: 'syncUserProfile', label: 'Sync Mon Profil Utilisateur' },
  { name: 'syncUserLevels', label: 'Sync Niveaux Utilisateurs' },
];

export default function DashboardSync() {
  const [loading, setLoading] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [currentFunc, setCurrentFunc] = useState('');

  const handleSync = async (funcName) => {
    setLoading(true);
    setCurrentFunc(funcName);
    setSyncResults(null);
    try {
      const fn = syncFunctions[funcName];
      if (!fn) throw new Error('Fonction non disponible');
      const result = await fn();
      setSyncResults(result);
      toast.success(`${funcName} complété avec succès`);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(`Erreur lors de ${funcName}: ${error.message}`);
    } finally {
      setLoading(false);
      setCurrentFunc('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Synchronisation</h2>
        <p className="text-white/60">Lancez les fonctions de synchronisation pour mettre à jour les données</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNC_ITEMS.map((func) => (
          <button key={func.name} onClick={() => handleSync(func.name)} disabled={loading}
            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{func.label}</p>
                <p className="text-xs text-white/50 mt-1">{func.name}</p>
              </div>
              {loading && currentFunc === func.name ? (
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              ) : (
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600"
                  onClick={(e) => { e.stopPropagation(); handleSync(func.name); }}
                  disabled={loading}>
                  Lancer
                </Button>
              )}
            </div>
          </button>
        ))}
      </div>

      {syncResults && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">Synchronisation réussie</p>
              <pre className="text-xs text-white/70 mt-2 overflow-auto max-h-48 bg-black/30 p-2 rounded">
                {JSON.stringify(syncResults, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
