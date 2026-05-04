import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export default function AddSpeedRecordInline({ open, onClose, puzzle }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const totalPreview = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);

  const handleSave = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const total = h * 3600 + m * 60 + s;
    if (total === 0) { toast.error('Entrez un temps valide'); return; }

    setLoading(true);
    try {
      await base44.entities.SpeedRecord.create({
        puzzle_id: puzzle.id,
        puzzle_name: puzzle.puzzle_name,
        puzzle_brand: puzzle.puzzle_brand || '',
        puzzle_pieces: puzzle.puzzle_pieces,
        image_url: puzzle.image_url || puzzle.progress_photo || '',
        category_tag: puzzle.category_tag || '',
        hours: h,
        minutes: m,
        seconds: s,
        total_seconds: total,
        record_date: recordDate,
        notes: notes || '',
      });
      toast.success('Record ajouté dans Speed Puzzle ! ⚡');
      setHours(''); setMinutes(''); setSeconds(''); setNotes('');
      onClose();
    } catch (e) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-xl">⚡</span> Ajouter un record
          </DialogTitle>
        </DialogHeader>

        {/* Puzzle info */}
        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
          {puzzle.image_url && (
            <img src={puzzle.image_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
          )}
          <div>
            <p className="text-white font-medium">{puzzle.puzzle_name}</p>
            <p className="text-white/40 text-xs">{puzzle.puzzle_pieces} pièces{puzzle.puzzle_brand ? ` · ${puzzle.puzzle_brand}` : ''}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Time input */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Temps *</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input type="number" placeholder="0" min="0" value={hours} onChange={e => setHours(e.target.value)} className="bg-white/5 border-white/10 text-white text-center" />
                <p className="text-white/40 text-xs text-center mt-1">heures</p>
              </div>
              <span className="text-white/50 text-xl font-bold mb-4">:</span>
              <div className="flex-1">
                <Input type="number" placeholder="0" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)} className="bg-white/5 border-white/10 text-white text-center" />
                <p className="text-white/40 text-xs text-center mt-1">minutes</p>
              </div>
              <span className="text-white/50 text-xl font-bold mb-4">:</span>
              <div className="flex-1">
                <Input type="number" placeholder="0" min="0" max="59" value={seconds} onChange={e => setSeconds(e.target.value)} className="bg-white/5 border-white/10 text-white text-center" />
                <p className="text-white/40 text-xs text-center mt-1">secondes</p>
              </div>
            </div>
            {totalPreview > 0 && (
              <p className="text-orange-400 text-sm text-center mt-2 font-mono">⚡ {formatTime(totalPreview)}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Date</label>
            <Input type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Notes (optionnel)</label>
            <Input placeholder="Ex: seul, en famille, nouvelle technique..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
            Enregistrer le record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}