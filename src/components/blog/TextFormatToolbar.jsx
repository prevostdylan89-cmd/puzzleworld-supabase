import React, { useRef } from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Highlighter } from 'lucide-react';

const SIZES = [
  { value: 'sm', label: 'S' },
  { value: 'base', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
  { value: '2xl', label: 'XXL' },
];

const HIGHLIGHTS = [
  { value: null, label: '✕', bg: 'bg-white/10', title: 'Aucun' },
  { value: 'yellow', label: '', bg: 'bg-yellow-400', title: 'Jaune' },
  { value: 'orange', label: '', bg: 'bg-orange-400', title: 'Orange' },
  { value: 'blue', label: '', bg: 'bg-blue-400', title: 'Bleu' },
  { value: 'green', label: '', bg: 'bg-green-400', title: 'Vert' },
  { value: 'pink', label: '', bg: 'bg-pink-400', title: 'Rose' },
];

const FONTS = [
  { value: 'sans', label: 'Sans-Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
];

function ToolBtn({ active, onClick, children, title, className = '' }) {
  return (
    <button title={title} onClick={onClick}
      className={`px-1.5 py-1 rounded text-xs font-medium transition-colors ${active ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'} ${className}`}>
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/15 mx-0.5 flex-shrink-0" />;
}

export default function TextFormatToolbar({ fmt = {}, onChange, textareaRef, onTextChange }) {
  const set = (key, value) => onChange({ ...fmt, [key]: value });

  const wrapSelection = (before, after = before) => {
    if (!textareaRef?.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + before + selected + after + text.slice(end);
    onTextChange(newText);
    // Restore cursor after state update
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#06062a] border border-white/10 rounded-t-lg">
      {/* Alignment */}
      <ToolBtn active={!fmt.align || fmt.align === 'left'} onClick={() => set('align', 'left')} title="Gauche"><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn active={fmt.align === 'center'} onClick={() => set('align', 'center')} title="Centré"><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn active={fmt.align === 'right'} onClick={() => set('align', 'right')} title="Droite"><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn active={fmt.align === 'justify'} onClick={() => set('align', 'justify')} title="Justifié"><AlignJustify className="w-3.5 h-3.5" /></ToolBtn>

      <Divider />

      {/* Inline style insert */}
      <ToolBtn active={false} onClick={() => wrapSelection('**')} title="Gras (sélection)"><Bold className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn active={false} onClick={() => wrapSelection('*')} title="Italique (sélection)"><Italic className="w-3.5 h-3.5" /></ToolBtn>
      <ToolBtn active={false} onClick={() => wrapSelection('__')} title="Souligné (sélection)"><Underline className="w-3.5 h-3.5" /></ToolBtn>

      {/* Bold entire paragraph toggle */}
      <ToolBtn active={fmt.bold} onClick={() => set('bold', !fmt.bold)} title="Tout en gras" className="font-extrabold">B</ToolBtn>
      {/* Italic entire paragraph toggle */}
      <ToolBtn active={fmt.italic} onClick={() => set('italic', !fmt.italic)} title="Tout en italique" className="italic">I</ToolBtn>

      <Divider />

      {/* Font sizes */}
      {SIZES.map(s => (
        <ToolBtn key={s.value} active={(fmt.size || 'base') === s.value} onClick={() => set('size', s.value)} title={`Taille ${s.label}`}>
          {s.label}
        </ToolBtn>
      ))}

      <Divider />

      {/* Font family */}
      <select value={fmt.font || 'sans'} onChange={e => set('font', e.target.value)}
        className="bg-white/10 text-white/60 text-[10px] rounded px-1.5 py-1 border-0 outline-none cursor-pointer hover:bg-white/20 transition-colors">
        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <Divider />

      {/* Highlight colors */}
      <div className="flex items-center gap-0.5">
        <Highlighter className="w-3 h-3 text-white/30 mr-0.5" />
        {HIGHLIGHTS.map(h => (
          <button key={String(h.value)} title={h.title} onClick={() => set('highlight', h.value)}
            className={`w-4 h-4 rounded ${h.bg} transition-all ${fmt.highlight === h.value ? 'ring-2 ring-white scale-110' : 'hover:scale-110'} text-[9px] flex items-center justify-center`}>
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}