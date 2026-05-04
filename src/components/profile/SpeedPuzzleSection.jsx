import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Trophy, Clock, Plus, Trash2, ChevronDown, ChevronUp, Filter, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

function AddRecordModal({ open, onClose, onAdded, prefillPuzzle }) {
  const [puzzles, setPuzzles] = useState([]);
  const [selectedPuzzle, setSelectedPuzzle] = useState(prefillPuzzle || null);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [notes, setNotes] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [searchPuzzle, setSearchPuzzle] = useState('');

  useEffect(() => {
    if (open && !prefillPuzzle) {
      base44.entities.UserPuzzle.filter({ status: 'done' })
        .then(items => setPuzzles(items.filter(p => p.puzzle_name)))
        .catch(() => {});
    }
    if (prefillPuzzle) setSelectedPuzzle(prefillPuzzle);
  }, [open, prefillPuzzle]);

  const handleSave = async () => {
    if (!selectedPuzzle) { toast.error('Sélectionnez un puzzle'); return; }
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const total = h * 3600 + m * 60 + s;
    if (total === 0) { toast.error('Entrez un temps valide'); return; }

    setLoading(true);
    await base44.entities.SpeedRecord.create({
      puzzle_id: selectedPuzzle.id,
      puzzle_name: selectedPuzzle.puzzle_name,
      puzzle_brand: selectedPuzzle.puzzle_brand || '',
      puzzle_pieces: selectedPuzzle.puzzle_pieces,
      image_url: selectedPuzzle.image_url || '',
      category_tag: selectedPuzzle.category_tag || '',
      hours: h,
      minutes: m,
      seconds: s,
      total_seconds: total,
      record_date: recordDate,
      notes: notes || '',
    });
    setLoading(false);
    toast.success('Record ajouté ! ⚡');
    onAdded();
    onClose();
  };

  const filteredPuzzles = puzzles.filter(p =>
    p.puzzle_name.toLowerCase().includes(searchPuzzle.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-xl">⚡</span> Ajouter un record
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Puzzle selection */}
          {!prefillPuzzle ? (
            <div>
              <label className="text-white/70 text-sm mb-2 block">Puzzle *</label>
              <Input
                placeholder="Rechercher un puzzle terminé..."
                value={searchPuzzle}
                onChange={e => setSearchPuzzle(e.target.value)}
                className="bg-white/5 border-white/10 text-white mb-2"
              />
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg">
                {filteredPuzzles.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPuzzle(p)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                      selectedPuzzle?.id === p.id
                        ? 'bg-orange-500/20 border border-orange-500/40'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span>🧩</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.puzzle_name}</p>
                      <p className="text-white/40 text-xs">{p.puzzle_pieces} pièces{p.puzzle_brand ? ` · ${p.puzzle_brand}` : ''}</p>
                    </div>
                  </button>
                ))}
                {filteredPuzzles.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">Aucun puzzle terminé trouvé</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
              {prefillPuzzle.image_url && (
                <img src={prefillPuzzle.image_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
              )}
              <div>
                <p className="text-white font-medium">{prefillPuzzle.puzzle_name}</p>
                <p className="text-white/40 text-xs">{prefillPuzzle.puzzle_pieces} pièces</p>
              </div>
            </div>
          )}

          {/* Time input */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Temps *</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-center"
                />
                <p className="text-white/40 text-xs text-center mt-1">heures</p>
              </div>
              <span className="text-white/50 text-xl font-bold mb-4">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-center"
                />
                <p className="text-white/40 text-xs text-center mt-1">minutes</p>
              </div>
              <span className="text-white/50 text-xl font-bold mb-4">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={e => setSeconds(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-center"
                />
                <p className="text-white/40 text-xs text-center mt-1">secondes</p>
              </div>
            </div>
            {(parseInt(hours) || parseInt(minutes) || parseInt(seconds)) ? (
              <p className="text-orange-400 text-sm text-center mt-2 font-mono">
                ⚡ {formatTime((parseInt(hours)||0)*3600 + (parseInt(minutes)||0)*60 + (parseInt(seconds)||0))}
              </p>
            ) : null}
          </div>

          {/* Date */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Date</label>
            <Input
              type="date"
              value={recordDate}
              onChange={e => setRecordDate(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Notes (optionnel)</label>
            <Input
              placeholder="Ex: seul, en famille, nouvelle technique..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trophy className="w-4 h-4 mr-2" />}
            Enregistrer le record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PuzzleRecordCard({ puzzleName, puzzleBrand, puzzlePieces, imageUrl, records, onDelete, onAddRecord, onImageUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [localImage, setLocalImage] = useState(imageUrl);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imgInputRef = useRef(null);
  const best = records[0]; // already sorted by total_seconds asc

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Update all records for this puzzle
      await Promise.all(records.map(r => base44.entities.SpeedRecord.update(r.id, { image_url: file_url })));
      setLocalImage(file_url);
      toast.success('Photo mise à jour ! 📸');
      if (onImageUpdated) onImageUpdated();
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative flex-shrink-0 group/img cursor-pointer" onClick={() => imgInputRef.current?.click()}>
          {localImage ? (
            <img src={localImage} alt={puzzleName} className="w-16 h-16 object-cover rounded-xl" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
              <span className="text-2xl">🧩</span>
            </div>
          )}
          <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
            {uploadingImg ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{puzzleName}</p>
          <p className="text-white/40 text-xs">{puzzlePieces} pièces{puzzleBrand ? ` · ${puzzleBrand}` : ''}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-orange-400 text-sm font-mono font-bold">⚡ {formatTime(best.total_seconds)}</span>
            <span className="text-white/30 text-xs">meilleur</span>
            {records.length > 1 && (
              <span className="text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded-full">{records.length} records</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddRecord({ puzzle_name: puzzleName, puzzle_brand: puzzleBrand, puzzle_pieces: puzzlePieces, image_url: localImage, id: best.puzzle_id })}
            className="w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 flex items-center justify-center text-orange-400 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Records list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            {records.map((record, i) => (
              <div key={record.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  i === 1 ? 'bg-slate-400/20 text-slate-300' :
                  i === 2 ? 'bg-orange-700/20 text-orange-600' : 'bg-white/5 text-white/40'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div className="flex-1">
                  <span className="text-white font-mono text-sm">{formatTime(record.total_seconds)}</span>
                  {record.notes && <span className="text-white/30 text-xs ml-2">· {record.notes}</span>}
                </div>
                <span className="text-white/30 text-xs">
                  {record.record_date ? format(new Date(record.record_date), 'dd/MM/yy') : ''}
                </span>
                <button
                  onClick={() => onDelete(record.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SpeedPuzzleSection({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefillPuzzle, setPrefillPuzzle] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('best_time'); // best_time, pieces_asc, pieces_desc, name
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPieces, setFilterPieces] = useState('all');

  useEffect(() => {
    loadRecords();
  }, [user]);

  const loadRecords = async () => {
    setLoading(true);
    const data = await base44.entities.SpeedRecord.filter({ created_by: user.email }, 'total_seconds', 500);
    setRecords(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce record ?')) return;
    await base44.entities.SpeedRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
    toast.success('Record supprimé');
  };

  const handleAddRecord = (puzzle) => {
    setPrefillPuzzle(puzzle);
    setShowAddModal(true);
  };

  // Group records by puzzle_name
  const grouped = {};
  for (const r of records) {
    const key = r.puzzle_name;
    if (!grouped[key]) grouped[key] = { puzzleName: r.puzzle_name, puzzleBrand: r.puzzle_brand, puzzlePieces: r.puzzle_pieces, imageUrl: r.image_url, categoryTag: r.category_tag, records: [] };
    grouped[key].records.push(r);
  }
  // Sort each group by time asc
  for (const g of Object.values(grouped)) {
    g.records.sort((a, b) => a.total_seconds - b.total_seconds);
  }

  let groups = Object.values(grouped);

  // Filter
  if (search) groups = groups.filter(g => g.puzzleName.toLowerCase().includes(search.toLowerCase()));
  if (filterCategory !== 'all') groups = groups.filter(g => g.categoryTag === filterCategory);
  if (filterPieces !== 'all') {
    const ranges = { '0-500': [0, 500], '500-1000': [500, 1000], '1000-2000': [1000, 2000], '2000+': [2000, Infinity] };
    const [min, max] = ranges[filterPieces];
    groups = groups.filter(g => g.puzzlePieces >= min && g.puzzlePieces < max);
  }

  // Sort groups
  if (sortBy === 'best_time') groups.sort((a, b) => a.records[0].total_seconds - b.records[0].total_seconds);
  else if (sortBy === 'pieces_asc') groups.sort((a, b) => a.puzzlePieces - b.puzzlePieces);
  else if (sortBy === 'pieces_desc') groups.sort((a, b) => b.puzzlePieces - a.puzzlePieces);
  else if (sortBy === 'name') groups.sort((a, b) => a.puzzleName.localeCompare(b.puzzleName));

  const categories = [...new Set(records.map(r => r.category_tag).filter(Boolean))];

  const totalRecords = records.length;
  const bestOverall = records.length > 0 ? records.reduce((best, r) => r.total_seconds < best.total_seconds ? r : best) : null;

  return (
    <div className="space-y-6">
      {/* Stats banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{Object.keys(grouped).length}</div>
          <div className="text-white/50 text-sm">puzzles chronométrés</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{totalRecords}</div>
          <div className="text-white/50 text-sm">records au total</div>
        </div>
        {bestOverall && (
          <div className="col-span-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-yellow-400 font-bold text-sm">Meilleur record absolu</p>
              <p className="text-white font-mono text-lg">{formatTime(bestOverall.total_seconds)}</p>
              <p className="text-white/40 text-xs">{bestOverall.puzzle_name} · {bestOverall.puzzle_pieces} pièces</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Rechercher un puzzle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 text-white pl-9"
          />
        </div>
        <Button
          onClick={() => { setPrefillPuzzle(null); setShowAddModal(true); }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Ajouter un record
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a2e] border-white/10">
            <SelectItem value="best_time" className="text-white">⚡ Meilleur temps</SelectItem>
            <SelectItem value="pieces_asc" className="text-white">🔼 Pièces croissant</SelectItem>
            <SelectItem value="pieces_desc" className="text-white">🔽 Pièces décroissant</SelectItem>
            <SelectItem value="name" className="text-white">🔤 Nom</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPieces} onValueChange={setFilterPieces}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-40 h-9">
            <SelectValue placeholder="Pièces" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a2e] border-white/10">
            <SelectItem value="all" className="text-white">Toutes pièces</SelectItem>
            <SelectItem value="0-500" className="text-white">≤ 500 pièces</SelectItem>
            <SelectItem value="500-1000" className="text-white">500–1000 pièces</SelectItem>
            <SelectItem value="1000-2000" className="text-white">1000–2000 pièces</SelectItem>
            <SelectItem value="2000+" className="text-white">2000+ pièces</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white w-40 h-9">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a2e] border-white/10">
              <SelectItem value="all" className="text-white">Toutes catégories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Records list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <span className="text-5xl block mb-4">⚡</span>
          <p className="text-white font-semibold mb-2">Aucun record speed puzzle</p>
          <p className="text-white/40 text-sm mb-6">Chronométrez vos puzzles et battez vos records !</p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter mon premier record
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <PuzzleRecordCard
              key={g.puzzleName}
              puzzleName={g.puzzleName}
              puzzleBrand={g.puzzleBrand}
              puzzlePieces={g.puzzlePieces}
              imageUrl={g.imageUrl}
              records={g.records}
              onDelete={handleDelete}
              onAddRecord={handleAddRecord}
              onImageUpdated={loadRecords}
            />
          ))}
        </div>
      )}

      <AddRecordModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setPrefillPuzzle(null); }}
        onAdded={loadRecords}
        prefillPuzzle={prefillPuzzle}
      />
    </div>
  );
}