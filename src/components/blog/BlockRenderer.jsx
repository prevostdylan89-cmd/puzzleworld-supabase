import React from 'react';
import { ExternalLink, Link } from 'lucide-react';

function renderText(text = '') {
  let result = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>');
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
}

const HIGHLIGHT_CLASSES = {
  yellow: 'bg-yellow-400/30 text-yellow-100',
  orange: 'bg-orange-400/30 text-orange-100',
  blue: 'bg-blue-400/30 text-blue-100',
  green: 'bg-green-400/30 text-green-100',
  pink: 'bg-pink-400/30 text-pink-100',
};

const SIZE_CLASSES = {
  sm: 'text-sm',
  base: 'text-base lg:text-lg',
  lg: 'text-lg lg:text-xl',
  xl: 'text-xl lg:text-2xl',
  '2xl': 'text-2xl lg:text-3xl',
};

const FONT_CLASSES = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

function fmtClass(fmt = {}) {
  return [
    SIZE_CLASSES[fmt.size || 'base'],
    FONT_CLASSES[fmt.font || 'sans'],
    ALIGN_CLASSES[fmt.align || 'left'],
    fmt.bold ? 'font-bold' : '',
    fmt.italic ? 'italic' : '',
    fmt.highlight ? HIGHLIGHT_CLASSES[fmt.highlight] || '' : '',
  ].filter(Boolean).join(' ');
}

function HeadingRenderer({ block, noTopMargin = false }) {
  const className = block.level === 'h2'
    ? `text-2xl lg:text-3xl font-bold text-white ${noTopMargin ? '' : 'mt-10'} mb-4`
    : `text-xl lg:text-2xl font-bold text-white ${noTopMargin ? '' : 'mt-8'} mb-3`;
  if (block.level === 'h3') return <h3 className={className}>{block.text}</h3>;
  return <h2 className={className}>{block.text}</h2>;
}

function ParagraphRenderer({ block }) {
  const extra = fmtClass(block.fmt);
  const highlight = block.fmt?.highlight ? HIGHLIGHT_CLASSES[block.fmt.highlight] : '';
  return (
    <p className={`text-white/80 leading-relaxed ${extra} ${highlight ? 'px-2 py-1 rounded' : ''}`}>
      {renderText(block.text)}
    </p>
  );
}

function ImageRenderer({ block }) {
  if (!block.url) return null;
  return (
    <figure className="my-2 w-full">
      <div className="w-full overflow-hidden rounded-xl">
        <img src={block.url} alt={block.alt || ''} className="w-full h-auto block object-cover" style={{ maxHeight: '400px' }} />
      </div>
      {block.caption && (
        <figcaption className="text-center text-white/40 text-sm mt-2 italic">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function PuzzleCardRenderer({ block }) {
  if (!block.puzzle_title) return null;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {block.puzzle_image && (
        <img src={block.puzzle_image} alt={block.puzzle_title} className="w-full h-44 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-white font-bold text-base mb-1 leading-tight">{block.puzzle_title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {block.puzzle_brand && (
            <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded">{block.puzzle_brand}</span>
          )}
          {block.piece_count && (
            <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-0.5 rounded">{block.piece_count} pièces</span>
          )}
          {block.category_tag && (
            <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded">{block.category_tag}</span>
          )}
        </div>
        {block.description && (
          <p className="text-white/60 text-sm mb-3 line-clamp-3 leading-relaxed">{block.description}</p>
        )}
        <div className="flex items-end justify-between gap-2">
          <div>
            {block.amazon_rating && (
              <p className="text-yellow-400 text-xs">
                ⭐ {block.amazon_rating}/5
                {block.amazon_ratings_total && <span className="text-white/40 ml-1">({block.amazon_ratings_total} avis)</span>}
              </p>
            )}
            {block.amazon_price && (
              <p className="text-orange-400 font-bold text-xl">{block.amazon_price}€</p>
            )}
          </div>
          {block.amazon_link && (
            <a href={block.amazon_link} target="_blank" rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 flex-shrink-0">
              <ExternalLink className="w-3 h-3" /> Voir sur Amazon
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ListRenderer({ block }) {
  const items = block.items?.filter(i => i.trim()) || [];
  if (items.length === 0) return null;
  const cls = "text-white/80 text-base lg:text-lg leading-relaxed space-y-2";
  if (block.style === 'ordered') {
    return (
      <ol className={`list-decimal list-inside ${cls}`}>
        {items.map((item, i) => <li key={i}>{renderText(item)}</li>)}
      </ol>
    );
  }
  return (
    <ul className={`list-disc list-inside ${cls}`}>
      {items.map((item, i) => <li key={i}>{renderText(item)}</li>)}
    </ul>
  );
}

function LinkRenderer({ block }) {
  if (!block.url && !block.label) return null;
  const isInternal = block.linkType === 'internal';
  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${isInternal ? 'bg-orange-500/10 border-orange-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
      {isInternal ? <Link className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" /> : <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
      <div>
        {block.description && <p className="text-white/50 text-sm mb-1">{block.description}</p>}
        <a href={block.url} target={isInternal ? '_self' : '_blank'} rel="noopener noreferrer"
          className={`font-semibold hover:underline ${isInternal ? 'text-orange-400' : 'text-blue-400'}`}>
          {block.label || block.url}
        </a>
      </div>
    </div>
  );
}

function QuoteRenderer({ block }) {
  const extra = fmtClass(block.fmt);
  return (
    <blockquote className="border-l-4 border-orange-500 pl-6 my-2">
      <p className={`text-white/70 italic leading-relaxed ${extra}`}>{block.text}</p>
    </blockquote>
  );
}

function DividerRenderer() {
  return <hr className="border-white/10 my-2" />;
}

function HeadingParagraphRenderer({ block }) {
  const className = block.level === 'h2'
    ? "text-2xl lg:text-3xl font-bold text-white mb-2"
    : "text-xl lg:text-2xl font-bold text-white mb-1.5";
  const Tag = block.level === 'h3' ? 'h3' : 'h2';
  const extra = fmtClass(block.fmt);
  return (
    <div>
      <Tag className={className}>{block.heading_text}</Tag>
      {block.paragraph_text && (
        <p className={`text-white/80 leading-relaxed ${extra}`}>{renderText(block.paragraph_text)}</p>
      )}
    </div>
  );
}

function BlockItem({ block, noTopMargin = false }) {
  switch (block.type) {
    case 'heading_paragraph': return <HeadingParagraphRenderer block={block} />;
    case 'heading': return <HeadingRenderer block={block} noTopMargin={noTopMargin} />;
    case 'paragraph': return <ParagraphRenderer block={block} />;
    case 'image': return <ImageRenderer block={block} />;
    case 'puzzle_card': return <PuzzleCardRenderer block={block} />;
    case 'list': return <ListRenderer block={block} />;
    case 'link': return <LinkRenderer block={block} />;
    case 'quote': return <QuoteRenderer block={block} />;
    case 'divider': return <DividerRenderer />;
    default: return null;
  }
}

// Group blocks into visual rows based on column placement
function groupBlocksIntoRows(blocks) {
  const rows = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    const col = block.column || 'full';
    if (col === 'full') {
      rows.push({ type: 'full', left: block, right: null });
      i++;
    } else if (col === 'left') {
      if (i + 1 < blocks.length && blocks[i + 1].column === 'right') {
        rows.push({ type: 'two-col', left: block, right: blocks[i + 1] });
        i += 2;
      } else {
        rows.push({ type: 'half-left', left: block, right: null });
        i++;
      }
    } else {
      // right block with no preceding left
      rows.push({ type: 'half-right', left: null, right: block });
      i++;
    }
  }
  return rows;
}

export default function BlockRenderer({ blocks = [] }) {
  if (!blocks || blocks.length === 0) return null;
  const rows = groupBlocksIntoRows(blocks);

  return (
    <div className="space-y-6 max-w-3xl">
      {rows.map((row, i) => {
        if (row.type === 'full') {
          return <BlockItem key={row.left.id} block={row.left} />;
        }
        if (row.type === 'two-col') {
          return (
            <div key={`${row.left.id}-${row.right.id}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 items-start">
              <BlockItem block={row.left} noTopMargin={true} />
              <BlockItem block={row.right} noTopMargin={true} />
            </div>
          );
        }
        if (row.type === 'half-left') {
          return (
            <div key={row.left.id} className="grid grid-cols-2 gap-4 items-start">
              <BlockItem block={row.left} />
              <div />
            </div>
          );
        }
        if (row.type === 'half-right') {
          return (
            <div key={row.right.id} className="grid grid-cols-2 gap-4 items-start">
              <div />
              <BlockItem block={row.right} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}