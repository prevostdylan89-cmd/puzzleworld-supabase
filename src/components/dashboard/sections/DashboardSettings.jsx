import React from 'react';
import { Settings, FileText, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function DashboardSettings() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Paramètres</h2>
        <p className="text-white/60">Configuration globale de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Legal Pages */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Pages Légales</h3>
          </div>
          <p className="text-white/60 text-sm mb-6">
            Gérez les conditions d'utilisation et la politique de confidentialité
          </p>
          <div className="space-y-2">
            <Link to={createPageUrl('Terms')}>
              <Button variant="outline" className="w-full justify-start border-white/10 text-white hover:bg-white/5">
                <FileText className="w-4 h-4 mr-2" />
                Conditions Générales d'Utilisation
              </Button>
            </Link>
            <Link to={createPageUrl('PrivacyPolicy')}>
              <Button variant="outline" className="w-full justify-start border-white/10 text-white hover:bg-white/5">
                <Shield className="w-4 h-4 mr-2" />
                Politique de Confidentialité
              </Button>
            </Link>
          </div>
        </div>

        {/* Site Configuration */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Configuration Globale</h3>
          </div>
          <p className="text-white/60 text-sm mb-6">
            Paramètres généraux de la plateforme
          </p>
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Section en développement</p>
          </div>
        </div>
      </div>
    </div>
  );
}