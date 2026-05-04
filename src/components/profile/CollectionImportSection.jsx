import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Colonnes attendues (noms flexibles)
const STATUS_MAP = {
  'wishlist': 'wishlist', 'wish': 'wishlist', 'souhaits': 'wishlist', 'souhait': 'wishlist', 'liste de souhaits': 'wishlist',
  'inbox': 'inbox', 'box': 'inbox', 'boite': 'inbox', 'boîte': 'inbox', 'en boite': 'inbox', 'collection': 'inbox', 'owned': 'inbox', 'possédé': 'inbox',
  'done': 'done', 'completed': 'done', 'terminé': 'done', 'termine': 'done', 'fini': 'done', 'finished': 'done',
};

function normalizeStatus(val) {
  if (!val) return 'inbox';
  const s = val.toString().toLowerCase().trim();
  return STATUS_MAP[s] || 'inbox';
}

function findCol(headers, candidates) {
  const lower = headers.map(h => h?.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.indexOf(c);
    if (idx !== -1) return idx;
  }
  // Partial match
  for (const c of candidates) {
    const idx = lower.findIndex(h => h && h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseCSV(text) {
  // Detect separator
  const firstLine = text.split('\n')[0];
  const sep = firstLine.includes(';') ? ';' : ',';

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse with quotes support
  const parseLine = (line) => {
    const result = [];
    let inQuote = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === sep && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);

  // Map column indexes
  const nameIdx    = findCol(headers, ['name', 'nom', 'titre', 'title', 'puzzle', 'puzzle name', 'nom du puzzle']);
  const brandIdx   = findCol(headers, ['brand', 'marque', 'fabricant', 'manufacturer', 'editeur', 'éditeur']);
  const piecesIdx  = findCol(headers, ['pieces', 'pièces', 'piece count', 'nombre de pièces', 'nb pieces', 'nb pièces', 'count', 'pieces count']);
  const statusIdx  = findCol(headers, ['status', 'statut', 'état', 'etat', 'state']);
  const imageIdx   = findCol(headers, ['image', 'image url', 'image_url', 'photo', 'cover']);
  const refIdx     = findCol(headers, ['reference', 'référence', 'ref', 'sku', 'barcode', 'ean', 'isbn']);

  if (nameIdx === -1) return null; // Can't import without name

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const name = cols[nameIdx]?.trim();
    if (!name) continue;
    rows.push({
      puzzle_name: name,
      puzzle_brand: brandIdx !== -1 ? (cols[brandIdx]?.trim() || '') : '',
      puzzle_pieces: piecesIdx !== -1 ? (parseInt(cols[piecesIdx]) || 0) : 0,
      status: normalizeStatus(statusIdx !== -1 ? cols[statusIdx] : ''),
      image_url: imageIdx !== -1 ? (cols[imageIdx]?.trim() || '') : '',
      puzzle_reference: refIdx !== -1 ? (cols[refIdx]?.trim() || '') : '',
    });
  }
  return rows;
}

const TEMPLATE_CSV = `name,brand,pieces,status,reference
Tour Eiffel,Ravensburger,1000,inbox,
Nuit Étoilée,Clementoni,1500,done,
Château de Neuschwanstein,Ravensburger,2000,wishlist,
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'import_collection_puzzleworld.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function CollectionImportSection({ user, onImportDone }) {
  const [step, setStep] = useState('idle'); // idle | preview | importing | done
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      if (parsed === null) {
        toast.error('Colonne "name" / "nom" introuvable dans le fichier. Vérifiez votre CSV.');
        return;
      }
      if (parsed.length === 0) {
        toast.error('Aucune ligne valide trouvée dans le fichier.');
        return;
      }
      setRows(parsed);
      setErrors([]);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    setStep('importing');
    let ok = 0, skip = 0;
    const errs = [];

    for (const row of rows) {
      try {
        // Vérifier si déjà dans la collection (par nom + marque)
        const existing = await base44.entities.UserPuzzle.filter({
          created_by: user.email,
          puzzle_name: row.puzzle_name,
        });
        if (existing.length > 0) { skip++; continue; }

        await base44.entities.UserPuzzle.create({
          puzzle_name: row.puzzle_name,
          puzzle_brand: row.puzzle_brand,
          puzzle_pieces: row.puzzle_pieces,
          status: row.status,
          image_url: row.image_url,
          puzzle_reference: row.puzzle_reference,
        });
        ok++;
      } catch (err) {
        errs.push(`"${row.puzzle_name}" : ${err.message}`);
        skip++;
      }
    }

    setImported(ok);
    setSkipped(skip);
    setErrors(errs);
    setStep('done');
    if (ok > 0 && onImportDone) onImportDone();
  };

  const handleReset = () => {
    setStep('idle');
    setRows([]);
    setErrors([]);
    setImported(0);
    setSkipped(0);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Importer une collection</h3>
          <p className="text-white/50 text-sm">Depuis Puzzle Tracker, Excel ou tout autre app via fichier CSV</p>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* IDLE */}
        {step === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="bg-white/5 rounded-xl p-4 text-sm text-white/60 space-y-1.5">
              <p className="font-medium text-white/80 mb-2">📋 Colonnes reconnues automatiquement :</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span>• <strong className="text-white/70">name / nom</strong> — requis</span>
                <span>• <strong className="text-white/70">brand / marque</strong></span>
                <span>• <strong className="text-white/70">pieces / pièces</strong></span>
                <span>• <strong className="text-white/70">status / statut</strong></span>
              </div>
              <p className="text-xs mt-2 text-white/40">Statuts acceptés : <em>wishlist, inbox/boite/collection, done/terminé</em></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="border-white/20 text-white/70 hover:bg-white/5 flex-1 gap-2"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle CSV
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white flex-1 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Importer mon fichier CSV
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </motion.div>
        )}

        {/* PREVIEW */}
        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-sm">{rows.length} puzzle{rows.length > 1 ? 's' : ''} détecté{rows.length > 1 ? 's' : ''}</p>
              <button onClick={handleReset} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
              {rows.slice(0, 50).map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                    row.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    row.status === 'wishlist' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {row.status === 'done' ? '🏆 Terminé' : row.status === 'wishlist' ? '⭐ Wishlist' : '📦 Boite'}
                  </span>
                  <span className="text-white truncate flex-1">{row.puzzle_name}</span>
                  {row.puzzle_brand && <span className="text-white/40 text-xs flex-shrink-0 hidden sm:block">{row.puzzle_brand}</span>}
                  {row.puzzle_pieces > 0 && <span className="text-white/40 text-xs flex-shrink-0">{row.puzzle_pieces}p</span>}
                </div>
              ))}
              {rows.length > 50 && (
                <div className="px-3 py-2 text-xs text-white/30 text-center">… et {rows.length - 50} autres</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/20 text-white/60 hover:bg-white/5 flex-1" onClick={handleReset}>
                Annuler
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white flex-1 gap-2" onClick={handleImport}>
                <Upload className="w-4 h-4" />
                Importer {rows.length} puzzle{rows.length > 1 ? 's' : ''}
              </Button>
            </div>
          </motion.div>
        )}

        {/* IMPORTING */}
        {step === 'importing' && (
          <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 gap-4">
            <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
            <p className="text-white font-medium">Import en cours…</p>
            <p className="text-white/40 text-sm">Ne fermez pas cette fenêtre</p>
          </motion.div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-300 font-semibold">{imported} puzzle{imported > 1 ? 's' : ''} importé{imported > 1 ? 's' : ''} !</p>
                {skipped > 0 && <p className="text-white/40 text-xs mt-0.5">{skipped} ignoré{skipped > 1 ? 's' : ''} (déjà présents ou erreurs)</p>}
              </div>
            </div>
            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1 max-h-24 overflow-y-auto">
                {errors.map((e, i) => <p key={i} className="text-red-400 text-xs">{e}</p>)}
              </div>
            )}
            <Button variant="outline" className="border-white/20 text-white/60 hover:bg-white/5 w-full" onClick={handleReset}>
              Faire un nouvel import
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}