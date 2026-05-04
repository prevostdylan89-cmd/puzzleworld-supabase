import React, { useState } from 'react';
import { getCapturedLogs } from '@/lib/consoleCapture';
import { TriangleAlert, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

// Modal only — no floating button. Use BugReportTrigger or open prop.
export default function BugReportModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'bug' });

  const handleClose = () => {
    onClose();
    setSent(false);
    setForm({ title: '', description: '', category: 'bug' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      let userEmail = '';
      try {
        const user = await base44.auth.me();
        userEmail = user?.email || '';
      } catch {}

      await base44.entities.BugReport.create({
        ...form,
        page: window.location.pathname,
        user_email: userEmail,
        user_agent: navigator.userAgent,
        status: 'nouveau',
        priority: 'normale',
      });

      const consoleLogs = getCapturedLogs();
      await base44.functions.invoke('createGithubIssue', {
        title: form.title,
        description: form.description,
        category: form.category,
        page: window.location.pathname,
        user_email: userEmail,
        console_logs: consoleLogs,
      });

      setSent(true);
      setTimeout(() => handleClose(), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 bottom-8 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-[201] w-auto lg:w-[400px] bg-[#0a0a2e] border border-white/10 rounded-2xl shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-white">Signaler un problème</h3>
              </div>
              <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-white font-medium">Merci pour votre signalement !</p>
                <p className="text-white/50 text-sm mt-1">Nous allons examiner le problème.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'bug', label: '🐛 Bug' },
                      { value: 'suggestion', label: '💡 Suggestion' },
                      { value: 'contenu', label: '📝 Contenu' },
                      { value: 'autre', label: '❓ Autre' },
                    ].map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, category: c.value }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          form.category === c.value
                            ? 'bg-red-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1 block">Titre *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Résumé du problème..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1 block">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez le problème en détail..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !form.title || !form.description}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Envoyer le signalement</>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}