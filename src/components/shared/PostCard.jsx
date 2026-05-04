import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function PostCard({ post }) {
  const {
    author = { name: 'PuzzleFan', avatar: '', initials: 'PF' },
    content = 'Just completed this amazing puzzle!',
    image = null,
    likes = 42,
    comments = 12,
    timeAgo = '2h ago',
    tags = []
  } = post || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
          <AvatarImage src={author.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
            {author.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">{author.name}</h4>
          <p className="text-white/40 text-xs">{timeAgo}</p>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <Bookmark className="w-4 h-4 text-white/40 hover:text-orange-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-white/80 text-sm leading-relaxed">{content}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, i) => (
              <span key={i} className="text-orange-400 text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {image && (
        <div className="px-4 pb-4">
          <img
            src={image}
            alt="Post"
            className="w-full rounded-xl object-cover max-h-80"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-6">
        <button className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group">
          <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">{likes}</span>
        </button>
        <button className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group">
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">{comments}</span>
        </button>
        <button className="flex items-center gap-2 text-white/50 hover:text-orange-400 transition-colors group ml-auto">
          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}