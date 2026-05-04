import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search } from 'lucide-react';

function generateSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

export default function SeoPanel({ form, setForm }) {
  const metaTitle = form.meta_title || form.title || '';
  const metaDesc = form.meta_description || '';
  const slug = form.slug || '';

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/50 mb-1 block">Meta title <span className="text-white/20">(60 car.)</span></label>
        <Input value={form.meta_title || ''} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
          placeholder={form.title || 'Titre SEO'} className="bg-white/5 border-white/20 text-white text-sm"
          maxLength={70} />
        <p className="text-xs text-white/20 mt-0.5">{(form.meta_title || '').length}/60</p>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Meta description <span className="text-white/20">(160 car.)</span></label>
        <Textarea value={form.meta_description || ''} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
          placeholder="Description courte pour Google..." className="bg-white/5 border-white/20 text-white text-sm resize-none"
          maxLength={160} rows={2} />
        <p className="text-xs text-white/20 mt-0.5">{(form.meta_description || '').length}/160</p>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Slug URL</label>
        <div className="flex gap-1">
          <span className="px-2 py-2 bg-white/5 border border-white/10 rounded-l-md text-white/30 text-xs border-r-0">/blog/</span>
          <Input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="mon-article-seo" className="bg-white/5 border-white/20 text-white text-sm rounded-l-none" />
        </div>
        {form.title && !form.slug && (
          <button onClick={() => setForm(f => ({ ...f, slug: generateSlug(f.title) }))}
            className="text-xs text-orange-400 hover:text-orange-300 mt-1">
            Générer depuis le titre
          </button>
        )}
      </div>

      {/* Google preview */}
      <div className="bg-white rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 text-xs">Aperçu Google</span>
        </div>
        <p className="text-xs text-green-700 mb-0.5">puzzleworld.app › blog › {slug || 'votre-article'}</p>
        <p className="text-blue-800 font-medium text-lg leading-snug hover:underline cursor-pointer">
          {metaTitle || form.title || 'Titre de votre article'}
        </p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {metaDesc || 'Ajoutez une meta description pour améliorer votre référencement Google...'}
        </p>
      </div>
    </div>
  );
}