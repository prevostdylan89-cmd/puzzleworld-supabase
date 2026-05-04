import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bug, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  nouveau:   { label: 'Nouveau',    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  en_cours:  { label: 'En cours',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  resolu:    { label: 'Résolu',     color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejete:    { label: 'Rejeté',     color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const PRIORITY_CONFIG = {
  faible:   { label: 'Faible',    dot: 'bg-white/30' },
  normale:  { label: 'Normale',   dot: 'bg-blue-400' },
  haute:    { label: 'Haute',     dot: 'bg-orange-400' },
  critique: { label: 'Critique',  dot: 'bg-red-500' },
};

const CATEGORY_LABELS = {
  bug: '🐛 Bug',
  suggestion: '💡 Suggestion',
  contenu: '📝 Contenu',
  autre: '❓ Autre',
};

export default function DashboardBugReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    const data = await base44.entities.BugReport.list('-created_date', 100);
    setReports(data);
    setLoading(false);
  };

  const updateReport = async (id, updates) => {
    setSaving(id);
    await base44.entities.BugReport.update(id, updates);
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setSaving(null);
  };

  const filtered = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    return true;
  });

  const counts = {
    nouveau: reports.filter(r => r.status === 'nouveau').length,
    en_cours: reports.filter(r => r.status === 'en_cours').length,
    resolu: reports.filter(r => r.status === 'resolu').length,
    rejete: reports.filter(r => r.status === 'rejete').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-400" />
            Signalements utilisateurs
          </h2>
          <p className="text-white/50 text-sm mt-1">{reports.length} signalement(s) au total</p>
        </div>
        <Button onClick={loadReports} variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/10">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={`p-3 rounded-xl border text-left transition-all ${filterStatus === key ? cfg.color : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
          >
            <div className="text-2xl font-bold">{counts[key]}</div>
            <div className="text-xs mt-1">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-white/40 text-sm self-center">Catégorie :</span>
        {['all', 'bug', 'suggestion', 'contenu', 'autre'].map(c => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCategory === c ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {c === 'all' ? '📋 Tous' : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-white/40">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40">Aucun signalement trouvé</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.nouveau;
            const priorityCfg = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.normale;
            const isExpanded = expanded === report.id;

            return (
              <div key={report.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : report.id)}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityCfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium truncate">{report.title}</span>
                      <span className="text-white/40 text-xs">{CATEGORY_LABELS[report.category] || report.category}</span>
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {report.page} • {new Date(report.created_date).toLocaleDateString('fr-FR')}
                      {report.user_email && ` • ${report.user_email}`}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{report.description}</p>
                    {report.user_agent && (
                      <p className="text-white/30 text-xs font-mono">{report.user_agent}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Status */}
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">Statut</label>
                        <select
                          value={report.status}
                          onChange={e => updateReport(report.id, { status: e.target.value })}
                          disabled={saving === report.id}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                        >
                          <option value="nouveau">Nouveau</option>
                          <option value="en_cours">En cours</option>
                          <option value="resolu">Résolu</option>
                          <option value="rejete">Rejeté</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">Priorité</label>
                        <select
                          value={report.priority || 'normale'}
                          onChange={e => updateReport(report.id, { priority: e.target.value })}
                          disabled={saving === report.id}
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                        >
                          <option value="faible">Faible</option>
                          <option value="normale">Normale</option>
                          <option value="haute">Haute</option>
                          <option value="critique">Critique</option>
                        </select>
                      </div>
                    </div>

                    {/* Admin notes */}
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Notes admin</label>
                      <textarea
                        defaultValue={report.admin_notes || ''}
                        onBlur={e => updateReport(report.id, { admin_notes: e.target.value })}
                        rows={2}
                        placeholder="Notes internes..."
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                      />
                    </div>

                    {saving === report.id && (
                      <p className="text-orange-400 text-xs">Sauvegarde...</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}