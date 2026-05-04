import React, { useState, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import {
  GripVertical, Plus, Trash2, Type, Image as ImageIcon,
  List, Link, Quote, Minus, Upload, Loader2, Search, AlignLeft, Grid3X3, Crop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImageCropModal from './ImageCropModal';
import TextFormatToolbar from './TextFormatToolbar';

const BLOCK_TYPES = [
  { type: 'heading_paragraph', label: 'Titre + Texte', icon: Type },
  { type: 'heading', label: 'Titre seul (H2/H3)', icon: Type },
  { type: 'paragraph', label: 'Paragraphe seul', icon: AlignLeft },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'puzzle_card', label: 'Fiche Puzzle', icon: Grid3X3 },
  { type: 'list', label: 'Liste', icon: List },
  { type: 'link', label: 'Lien', icon: Link },
  { type: 'quote', label: 'Citation', icon: Quote },
  { type: 'divider', label: 'Séparateur', icon: Minus },
];

const BLOCK_LABELS = {
  heading_paragraph: 'Titre + Texte', heading: 'Titre', paragraph: 'Paragraphe', image: 'Image',
  list: 'Liste', link: 'Lien', quote: 'Citation', divider: 'Séparateur', puzzle_card: 'Fiche Puzzle',
};

export function generateBlockId() {
  return Math.random().toString(36).substr(2, 9);
}

export function createBlock(type) {
  const base = { id: generateBlockId(), type, column: 'full' };
  switch (type) {
    case 'heading_paragraph': return { ...base, level: 'h2', heading_text: '', paragraph_text: '', fmt: {} };
    case 'heading': return { ...base, level: 'h2', text: '' };
    case 'paragraph': return { ...base, text: '' };
    case 'image': return { ...base, url: '', alt: '', caption: '' };
    case 'list': return { ...base, style: 'bullet', items: [''] };
    case 'link': return { ...base, linkType: 'external', url: '', label: '', description: '' };
    case 'quote': return { ...base, text: '' };
    case 'puzzle_card': return { ...base, puzzle_id: null, puzzle_title: '', puzzle_image: '', puzzle_brand: '', piece_count: null, amazon_link: '', amazon_price: null, amazon_rating: null, amazon_ratings_total: null, description: '', category_tag: '' };
    case 'divider': return base;
    default: return base;
  }
}

// Group flat blocks into rows based on column placement
function groupToRows(blocks) {
  const rows = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const col = b.column || 'full';
    if (col === 'left' && i + 1 < blocks.length && blocks[i + 1].column === 'right') {
      rows.push({ id: `row-${b.id}`, type: 'two-col', blocks: [b, blocks[i + 1]] });
      i += 2;
    } else {
      rows.push({ id: `row-${b.id}`, type: 'single', blocks: [b] });
      i++;
    }
  }
  return rows;
}

function flattenRows(rows) {
  return rows.flatMap(r => r.blocks);
}

// ---- Column Selector ----
function ColumnSelector({ column, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[
        { value: 'left', label: '⬅', title: 'Moitié gauche' },
        { value: 'full', label: '↔', title: 'Pleine largeur' },
        { value: 'right', label: '➡', title: 'Moitié droite' },
      ].map(({ value, label, title }) => (
        <button key={value} title={title} onClick={() => onChange(value)}
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${(column || 'full') === value ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ---- Block content editors ----

function HeadingParagraphBlock({ block, onChange }) {
  const taRef = useRef(null);
  const fmt = block.fmt || {};
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 mb-1">
        {['h2', 'h3'].map(l => (
          <button key={l} onClick={() => onChange({ ...block, level: l })}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${block.level === l ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <Input value={block.heading_text || ''} onChange={e => onChange({ ...block, heading_text: e.target.value })}
        placeholder="Titre..." className={`bg-white/5 border-white/20 text-white font-bold ${block.level === 'h2' ? 'text-xl' : 'text-lg'}`} />
      <TextFormatToolbar fmt={fmt} onChange={(newFmt) => onChange({ ...block, fmt: newFmt })} textareaRef={taRef} onTextChange={(text) => onChange({ ...block, paragraph_text: text })} />
      <Textarea ref={taRef} value={block.paragraph_text || ''} onChange={e => onChange({ ...block, paragraph_text: e.target.value })}
        placeholder="Contenu... **gras** *italique*"
        className="bg-white/5 border-white/20 text-white text-sm resize-none rounded-t-none border-t-0" rows={4} />
    </div>
  );
}

function HeadingBlock({ block, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {['h2', 'h3'].map(l => (
          <button key={l} onClick={() => onChange({ ...block, level: l })}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${block.level === l ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <Input value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Titre..." className={`bg-white/5 border-white/20 text-white font-bold ${block.level === 'h2' ? 'text-xl' : 'text-lg'}`} />
    </div>
  );
}

function ParagraphBlock({ block, onChange }) {
  const taRef = useRef(null);
  const fmt = block.fmt || {};
  return (
    <div>
      <TextFormatToolbar
        fmt={fmt}
        onChange={(newFmt) => onChange({ ...block, fmt: newFmt })}
        textareaRef={taRef}
        onTextChange={(text) => onChange({ ...block, text })}
      />
      <Textarea ref={taRef} value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Écrivez... **gras** *italique* __souligné__"
        className="bg-white/5 border-white/20 text-white text-sm resize-none rounded-t-none border-t-0" rows={4} />
    </div>
  );
}

function ImageBlock({ block, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...block, url: file_url });
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {block.url && (
        <div className="relative group/img">
          <img src={block.url} alt={block.alt} className="w-full max-h-48 object-cover rounded-lg" />
          <button onClick={() => setShowCrop(true)}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-orange-500 text-white text-xs rounded-lg transition-colors opacity-0 group-hover/img:opacity-100">
            <Crop className="w-3.5 h-3.5" /> Rogner
          </button>
        </div>
      )}
      <label className="cursor-pointer block">
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-white/50 text-sm hover:border-orange-500/50 transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Upload...' : block.url ? "Changer l'image" : 'Uploader une image'}
        </div>
      </label>
      <Input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder="Ou coller une URL" className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.alt} onChange={e => onChange({ ...block, alt: e.target.value })}
        placeholder="Texte ALT SEO" className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.caption} onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="Légende (optionnel)" className="bg-white/5 border-white/20 text-white text-sm" />

      {showCrop && block.url && (
        <ImageCropModal
          imageUrl={block.url}
          onConfirm={(croppedUrl) => { onChange({ ...block, url: croppedUrl }); setShowCrop(false); }}
          onClose={() => setShowCrop(false)}
        />
      )}
    </div>
  );
}

function PuzzleCardBlock({ block, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPuzzles = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const res = await base44.entities.PuzzleCatalog.filter({ title: { $regex: search, $options: 'i' } }, '-total_likes', 12);
    setResults(res);
    setLoading(false);
  };

  const selectPuzzle = (p) => {
    onChange({
      ...block,
      puzzle_id: p.id,
      puzzle_title: p.title,
      puzzle_image: p.image_hd,
      puzzle_brand: p.brand,
      piece_count: p.piece_count,
      amazon_link: p.amazon_link || (p.asin ? `https://www.amazon.fr/dp/${p.asin}?tag=puzzleworld-21` : ''),
      amazon_price: p.amazon_price,
      amazon_rating: p.amazon_rating,
      amazon_ratings_total: p.amazon_ratings_total,
      description: p.description,
      category_tag: p.category_tag,
    });
    setResults([]);
    setSearch('');
  };

  return (
    <div className="space-y-2">
      {block.puzzle_id ? (
        <div className="flex gap-3 bg-white/5 rounded-lg p-3">
          {block.puzzle_image && <img src={block.puzzle_image} alt={block.puzzle_title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-xs truncate">{block.puzzle_title}</p>
            <p className="text-white/50 text-[11px]">{block.puzzle_brand} · {block.piece_count} pièces</p>
            {block.amazon_price && <p className="text-orange-400 text-sm font-bold">{block.amazon_price}€</p>}
          </div>
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...block, puzzle_id: null, puzzle_title: '' })}
            className="text-red-400 p-1 h-7 w-7 flex-shrink-0"><Trash2 className="w-3 h-3" /></Button>
        </div>
      ) : (
        <p className="text-white/30 text-sm italic">Aucun puzzle sélectionné</p>
      )}
      <div className="flex gap-1">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher dans le catalogue..."
          className="bg-white/5 border-white/20 text-white text-sm"
          onKeyDown={e => e.key === 'Enter' && searchPuzzles()} />
        <Button size="sm" onClick={searchPuzzles} className="bg-orange-500 hover:bg-orange-600 px-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-1">
          {results.map(p => (
            <button key={p.id} onClick={() => selectPuzzle(p)}
              className="w-full flex items-center gap-2 text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors">
              {p.image_hd && <img src={p.image_hd} alt={p.title} className="w-9 h-9 object-cover rounded flex-shrink-0" />}
              <div className="min-w-0">
                <p className="truncate font-medium text-xs">{p.title}</p>
                <p className="text-white/40 text-[10px]">{p.brand} · {p.piece_count} pièces{p.amazon_price ? ` · ${p.amazon_price}€` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListBlock({ block, onChange }) {
  const updateItem = (i, val) => { const items = [...block.items]; items[i] = val; onChange({ ...block, items }); };
  const addItem = () => onChange({ ...block, items: [...block.items, ''] });
  const removeItem = (i) => onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {['bullet', 'ordered'].map(s => (
          <button key={s} onClick={() => onChange({ ...block, style: s })}
            className={`px-3 py-1 rounded text-xs transition-colors ${block.style === s ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {s === 'bullet' ? '• Puces' : '1. Numérotée'}
          </button>
        ))}
      </div>
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-white/40 text-sm w-5 text-right flex-shrink-0">{block.style === 'ordered' ? `${i + 1}.` : '•'}</span>
          <Input value={item} onChange={e => updateItem(i, e.target.value)}
            placeholder={`Élément ${i + 1}`} className="bg-white/5 border-white/20 text-white text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }} />
          <Button size="sm" variant="ghost" onClick={() => removeItem(i)} disabled={block.items.length <= 1}
            className="text-red-400 p-1 h-7 w-7 flex-shrink-0"><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={addItem} className="text-orange-400 text-xs">
        <Plus className="w-3 h-3 mr-1" /> Ajouter
      </Button>
    </div>
  );
}

function LinkBlock({ block, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const searchArticles = async () => {
    if (!search.trim()) return;
    const res = await base44.entities.BlogArticle.filter({ title: { $regex: search, $options: 'i' }, is_published: true }, '-created_date', 10);
    setResults(res);
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {['external', 'internal'].map(t => (
          <button key={t} onClick={() => onChange({ ...block, linkType: t })}
            className={`px-3 py-1 rounded text-xs transition-colors ${block.linkType === t ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {t === 'external' ? '🌐 Externe' : '🔗 Interne'}
          </button>
        ))}
      </div>
      {block.linkType === 'internal' && (
        <div className="space-y-1">
          <div className="flex gap-1">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un article..."
              className="bg-white/5 border-white/20 text-white text-sm"
              onKeyDown={e => e.key === 'Enter' && searchArticles()} />
            <Button size="sm" onClick={searchArticles} className="bg-orange-500 hover:bg-orange-600 px-2"><Search className="w-3.5 h-3.5" /></Button>
          </div>
          {results.map(a => (
            <button key={a.id} onClick={() => { onChange({ ...block, linkType: 'internal', url: `/Blog?article=${a.slug}`, label: a.title }); setResults([]); }}
              className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white truncate">{a.title}</button>
          ))}
        </div>
      )}
      <Input value={block.url} onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder={block.linkType === 'external' ? 'https://...' : 'URL'} className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.label} onChange={e => onChange({ ...block, label: e.target.value })}
        placeholder="Texte du lien" className="bg-white/5 border-white/20 text-white text-sm" />
      <Input value={block.description} onChange={e => onChange({ ...block, description: e.target.value })}
        placeholder="Description (optionnel)" className="bg-white/5 border-white/20 text-white text-sm" />
    </div>
  );
}

function QuoteBlock({ block, onChange }) {
  const taRef = useRef(null);
  const fmt = block.fmt || {};
  return (
    <div className="border-l-4 border-orange-500 pl-4">
      <TextFormatToolbar
        fmt={fmt}
        onChange={(newFmt) => onChange({ ...block, fmt: newFmt })}
        textareaRef={taRef}
        onTextChange={(text) => onChange({ ...block, text })}
      />
      <Textarea ref={taRef} value={block.text} onChange={e => onChange({ ...block, text: e.target.value })}
        placeholder="Texte de la citation..." className="bg-white/5 border-white/20 text-white italic text-sm resize-none rounded-t-none border-t-0" rows={3} />
    </div>
  );
}

function BlockContent({ block, onChange }) {
  switch (block.type) {
    case 'heading_paragraph': return <HeadingParagraphBlock block={block} onChange={onChange} />;
    case 'heading': return <HeadingBlock block={block} onChange={onChange} />;
    case 'paragraph': return <ParagraphBlock block={block} onChange={onChange} />;
    case 'image': return <ImageBlock block={block} onChange={onChange} />;
    case 'puzzle_card': return <PuzzleCardBlock block={block} onChange={onChange} />;
    case 'list': return <ListBlock block={block} onChange={onChange} />;
    case 'link': return <LinkBlock block={block} onChange={onChange} />;
    case 'quote': return <QuoteBlock block={block} onChange={onChange} />;
    case 'divider': return <div className="h-px bg-white/20 rounded my-2" />;
    default: return null;
  }
}

// ---- Single block card ----
function BlockCard({ block, onUpdate, onDelete, dragHandleProps }) {
  return (
    <div className="bg-[#080828] border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all h-full">
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest truncate">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <ColumnSelector column={block.column} onChange={(col) => onUpdate({ ...block, column: col })} />
          <Button size="sm" variant="ghost" onClick={() => onDelete(block.id)}
            className="text-red-400 hover:text-red-300 p-1 h-7 w-7">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <BlockContent block={block} onChange={onUpdate} />
    </div>
  );
}

// ---- Add block menu ----
function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-center my-2">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-dashed border-white/20 text-white/40 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/10 transition-all text-xs">
        <Plus className="w-3.5 h-3.5" /> Ajouter un bloc
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-9 z-20 bg-[#0d0d30] border border-white/20 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1 min-w-[280px]">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => { onAdd(bt.type); setOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left">
                <bt.icon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                {bt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Main BlockEditor ----
export default function BlockEditor({ blocks, onChange }) {
  const rows = useMemo(() => groupToRows(blocks), [blocks]);

  const updateBlock = (id, updated) => onChange(blocks.map(b => b.id === id ? updated : b));
  const deleteBlock = (id) => onChange(blocks.filter(b => b.id !== id));
  const addBlock = (type) => onChange([...blocks, createBlock(type)]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...rows];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(flattenRows(reordered));
  };

  return (
    <div className="space-y-2">
      {/* Layout hint */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
        <span>💡</span>
        <span>Utilisez <strong>⬅ Gauche</strong> puis <strong>➡ Droite</strong> sur deux blocs consécutifs pour les afficher côte à côte.</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="rows">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {rows.map((row, rowIndex) => (
                <Draggable key={row.id} draggableId={row.id} index={rowIndex}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}
                      className={`rounded-xl transition-all ${snapshot.isDragging ? 'opacity-80 scale-[0.99]' : ''}`}>
                      {row.type === 'two-col' ? (
                        // Two-column layout
                        <div className={`border rounded-xl overflow-hidden ${snapshot.isDragging ? 'border-orange-500/50' : 'border-orange-400/20'}`}>
                          {/* Row header */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border-b border-orange-500/20">
                            <div {...provided.dragHandleProps} className="cursor-grab text-orange-400/50 hover:text-orange-400 transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] text-orange-400/70 font-semibold uppercase tracking-widest">2 colonnes côte à côte</span>
                          </div>
                          {/* Two columns */}
                          <div className="grid grid-cols-2 gap-0 divide-x divide-white/10">
                            <div className="p-2">
                              <BlockCard
                                block={row.blocks[0]}
                                onUpdate={(updated) => updateBlock(row.blocks[0].id, updated)}
                                onDelete={deleteBlock}
                              />
                            </div>
                            <div className="p-2">
                              <BlockCard
                                block={row.blocks[1]}
                                onUpdate={(updated) => updateBlock(row.blocks[1].id, updated)}
                                onDelete={deleteBlock}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Single block (full or half)
                        <div className={`${
                          (row.blocks[0].column === 'left' || row.blocks[0].column === 'right')
                            ? 'border border-dashed border-white/20 rounded-xl p-1'
                            : ''
                        }`}>
                          {(row.blocks[0].column === 'left' || row.blocks[0].column === 'right') && (
                            <div className="px-2 pt-1 pb-0.5 text-[10px] text-white/20 flex items-center gap-1">
                              <span>{row.blocks[0].column === 'left' ? '⬅ Moitié gauche seule' : '➡ Moitié droite seule'}</span>
                              <span className="text-yellow-500/50">· en attente d'un bloc {row.blocks[0].column === 'left' ? 'droit' : 'gauche'} suivant</span>
                            </div>
                          )}
                          <BlockCard
                            block={row.blocks[0]}
                            onUpdate={(updated) => updateBlock(row.blocks[0].id, updated)}
                            onDelete={deleteBlock}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AddBlockMenu onAdd={addBlock} />

      {blocks.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-xl">
          Cliquez sur "+ Ajouter un bloc" pour commencer
        </div>
      )}
    </div>
  );
}