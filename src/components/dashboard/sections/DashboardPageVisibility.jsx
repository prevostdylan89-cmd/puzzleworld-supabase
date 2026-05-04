import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Tag } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CategoryManagerModal from '@/components/dashboard/CategoryManagerModal';

const MANAGEABLE_PAGES = [
  { page_name: 'Home', label: 'Accueil' },
  { page_name: 'Collection', label: 'Collection' },
  { page_name: 'Social', label: 'Social' },
  { page_name: 'Events', label: 'Événements' },
  { page_name: 'OnlinePuzzles', label: 'Puzzles en ligne' },
  { page_name: 'Profile', label: 'Profil' },
  { page_name: 'Friends', label: 'Amis' },
  { page_name: 'Messages', label: 'Messages' },
  { page_name: 'FAQ', label: 'FAQ' },
  { page_name: 'Contact', label: 'Contact' },
  { page_name: 'Aide', label: 'Aide' },
];

export default function DashboardPageVisibility() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const existing = await base44.entities.PageSettings.list();
      // Merge with default pages
      const merged = MANAGEABLE_PAGES.map(page => {
        const found = existing.find(s => s.page_name === page.page_name);
        return found || { ...page, is_active: true, maintenance_message: 'Cette page est temporairement en maintenance. Revenez bientôt !' };
      });
      setSettings(merged);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const togglePage = async (pageName, currentValue) => {
    setSaving(prev => ({ ...prev, [pageName]: true }));
    try {
      const existing = await base44.entities.PageSettings.filter({ page_name: pageName });
      const pageInfo = MANAGEABLE_PAGES.find(p => p.page_name === pageName);
      const setting = settings.find(s => s.page_name === pageName);

      if (existing.length > 0) {
        await base44.entities.PageSettings.update(existing[0].id, { is_active: !currentValue });
      } else {
        await base44.entities.PageSettings.create({
          page_name: pageName,
          label: pageInfo?.label || pageName,
          is_active: !currentValue,
          maintenance_message: setting?.maintenance_message || 'Cette page est temporairement en maintenance. Revenez bientôt !',
        });
      }

      setSettings(prev => prev.map(s =>
        s.page_name === pageName ? { ...s, is_active: !currentValue } : s
      ));
      toast.success(`Page "${pageInfo?.label}" ${!currentValue ? 'activée' : 'mise en maintenance'}`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(prev => ({ ...prev, [pageName]: false }));
    }
  };

  const updateMessage = async (pageName, message) => {
    setSettings(prev => prev.map(s =>
      s.page_name === pageName ? { ...s, maintenance_message: message } : s
    ));
  };

  const saveMessage = async (pageName) => {
    setSaving(prev => ({ ...prev, [`msg_${pageName}`]: true }));
    try {
      const existing = await base44.entities.PageSettings.filter({ page_name: pageName });
      const setting = settings.find(s => s.page_name === pageName);
      const pageInfo = MANAGEABLE_PAGES.find(p => p.page_name === pageName);

      if (existing.length > 0) {
        await base44.entities.PageSettings.update(existing[0].id, { maintenance_message: setting.maintenance_message });
      } else {
        await base44.entities.PageSettings.create({
          page_name: pageName,
          label: pageInfo?.label || pageName,
          is_active: setting?.is_active ?? true,
          maintenance_message: setting?.maintenance_message,
        });
      }
      toast.success('Message mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(prev => ({ ...prev, [`msg_${pageName}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <CategoryManagerModal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Visibilité des Pages</h2>
          <p className="text-white/50 text-sm">Activez ou désactivez les pages du site. Les pages désactivées affichent un message de maintenance.</p>
        </div>
        <Button onClick={() => setShowCategoryModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2" size="sm">
          <Tag className="w-4 h-4" />
          Catégories Collection
        </Button>
      </div>

      <div className="mb-6">

      <div className="space-y-3">
        {settings.map((setting) => {
          const isActive = setting.is_active !== false;
          const isSavingToggle = saving[setting.page_name];
          const isSavingMsg = saving[`msg_${setting.page_name}`];

          return (
            <div
              key={setting.page_name}
              className={`rounded-xl border p-4 transition-all ${
                isActive
                  ? 'bg-white/5 border-white/10'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {isActive
                    ? <Eye className="w-5 h-5 text-green-400" />
                    : <EyeOff className="w-5 h-5 text-red-400" />
                  }
                  <div>
                    <p className="text-white font-medium">{setting.label}</p>
                    <p className="text-white/40 text-xs">/{setting.page_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isActive ? 'Actif' : 'Maintenance'}
                  </span>
                  {isSavingToggle
                    ? <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                    : <Switch
                        checked={isActive}
                        onCheckedChange={() => togglePage(setting.page_name, isActive)}
                      />
                  }
                </div>
              </div>

              {!isActive && (
                <div className="mt-3 flex gap-2">
                  <Input
                    value={setting.maintenance_message || ''}
                    onChange={(e) => updateMessage(setting.page_name, e.target.value)}
                    placeholder="Message de maintenance..."
                    className="bg-white/5 border-white/10 text-white text-sm flex-1"
                  />
                  <button
                    onClick={() => saveMessage(setting.page_name)}
                    disabled={isSavingMsg}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSavingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sauver'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}