import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { 
  Search, 
  Filter,
  Globe,
  Smartphone,
  Monitor,
  Gamepad2,
  Star,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnlineGameCard from '@/components/shared/OnlineGameCard';
import SectionHeader from '@/components/shared/SectionHeader';
import { base44 } from '@/api/base44Client';

const defaultGames = [
  {
    title: 'Jigsaw Explorer',
    description: 'Thousands of free online jigsaw puzzles with stunning HD images. Choose your difficulty and start puzzling!',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=600&h=300&fit=crop',
    rating: 4.8,
    players: '50K+',
    platform: 'Web',
    url: '#',
    tags: ['Free', 'HD Quality']
  },
  {
    title: 'Puzzle Party',
    description: 'Compete with friends in real-time puzzle challenges. Race to complete puzzles faster than anyone else!',
    image: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=600&h=300&fit=crop',
    rating: 4.6,
    players: '25K+',
    platform: 'Web & Mobile',
    url: '#',
    tags: ['Multiplayer', 'Free']
  },
  {
    title: 'Art Puzzle Gallery',
    description: 'Turn famous artworks into puzzles. Explore masterpieces from Van Gogh, Monet, and more.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=300&fit=crop',
    rating: 4.9,
    players: '100K+',
    platform: 'Web',
    url: '#',
    tags: ['Art', 'Premium']
  },
  {
    title: 'Daily Jigsaw',
    description: 'New puzzles every day! Complete daily challenges and earn rewards and achievements.',
    image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=300&fit=crop',
    rating: 4.5,
    players: '30K+',
    platform: 'Mobile',
    url: '#',
    tags: ['Daily', 'Free']
  },
  {
    title: 'Puzzle Universe',
    description: 'Create and share your own puzzles with the community. Millions of user-generated puzzles available.',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&h=300&fit=crop',
    rating: 4.7,
    players: '75K+',
    platform: 'Web',
    url: '#',
    tags: ['Create', 'Community']
  },
  {
    title: '3D Jigsaw World',
    description: 'Experience puzzles in 3D! Build intricate structures and famous landmarks piece by piece.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop',
    rating: 4.4,
    players: '15K+',
    platform: 'Web & Mobile',
    url: '#',
    tags: ['3D', 'Premium']
  },
  {
    title: 'Zen Puzzle Garden',
    description: 'Relax with calming puzzles and ambient music. Perfect for winding down after a long day.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=300&fit=crop',
    rating: 4.8,
    players: '40K+',
    platform: 'Mobile',
    url: '#',
    tags: ['Relaxing', 'Free']
  },
  {
    title: 'Puzzle Champions',
    description: 'Competitive puzzle gaming with ranked matches, tournaments, and seasonal rewards.',
    image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=600&h=300&fit=crop',
    rating: 4.6,
    players: '20K+',
    platform: 'Web',
    url: '#',
    tags: ['Competitive', 'Ranked']
  }
];

const featuredGame = {
  title: 'Jigsaw Explorer Pro',
  description: 'The ultimate online puzzle experience with over 50,000 high-quality images. Create custom puzzles, compete with friends, and track your progress with detailed statistics.',
  image: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=1200&h=500&fit=crop',
  rating: 4.9,
  players: '200K+',
  platform: 'All Platforms',
  tags: ['Editor\'s Choice', 'Free to Play']
};

const platforms = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'web', label: 'Web', icon: Monitor },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'both', label: 'Cross-Platform', icon: Gamepad2 }
];

export default function OnlinePuzzles() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [onlineGames, setOnlineGames] = useState([]);
  const [featuredGame, setFeaturedGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const games = await base44.entities.OnlineGame.list('-created_date');
      
      if (games.length > 0) {
        setOnlineGames(games);
        const featured = games.find(g => g.is_featured);
        if (featured) {
          setFeaturedGame(featured);
        }
      } else {
        setOnlineGames(defaultGames);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setOnlineGames(defaultGames);
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{t('onlinePuzzles')}</h1>
              <p className="text-white/50 text-sm mt-1">{t('playInBrowser')}</p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchGames')}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {platforms.map((platform) => (
              <Button
                key={platform.id}
                variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full whitespace-nowrap ${
                  selectedPlatform === platform.id
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                    : 'border-white/20 text-white/70 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setSelectedPlatform(platform.id)}
              >
                <platform.icon className="w-4 h-4 mr-2" />
                {platform.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        {/* Featured Game */}
        {featuredGame && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
              <span className="text-orange-400 font-medium">{t('featured')}</span>
            </div>
            
            <div className="relative overflow-hidden rounded-3xl">
            <div className="aspect-[21/9] lg:aspect-[3/1]">
              <img
                src={featuredGame.image || 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=1200'}
                alt={featuredGame.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#000019] via-[#000019]/70 to-transparent" />
            </div>

            <div className="absolute inset-0 p-6 lg:p-10 flex flex-col justify-center max-w-2xl">
              {featuredGame.tags && featuredGame.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredGame.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <h2 className="text-2xl lg:text-4xl font-bold text-white mb-3">{featuredGame.title}</h2>
              <p className="text-white/70 text-sm lg:text-base mb-6 line-clamp-2 lg:line-clamp-none">
                {featuredGame.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {featuredGame.rating && (
                  <span className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                    {featuredGame.rating}
                  </span>
                )}
                {featuredGame.players && (
                  <span className="flex items-center gap-1.5 text-white/60 text-sm">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    {featuredGame.players} {t('players')}
                  </span>
                )}
                {featuredGame.platform && (
                  <span className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Globe className="w-4 h-4 text-orange-400" />
                    {featuredGame.platform}
                  </span>
                )}
              </div>

              <Button 
                onClick={() => window.open(featuredGame.url || '#', '_blank')}
                className="w-fit bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-8"
              >
                {t('playNow')}
              </Button>
            </div>
          </div>
        </motion.section>
        )}

        {/* Trending Section */}
        <section className="mb-12">
          <SectionHeader 
            title={t('trendingNow')}
            subtitle={t('popularThisWeek')}
          />
          
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {onlineGames.slice(0, 4).map((game, index) => (
              <motion.div key={index} variants={item}>
                <OnlineGameCard game={game} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* All Games Section */}
        <section>
          <SectionHeader 
            title={t('allOnlineGames')}
            subtitle={t('browseCollection')}
          />
          
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {onlineGames.map((game, index) => (
              <motion.div key={index} variants={item}>
                <OnlineGameCard game={game} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-white/[0.06] rounded-2xl p-6 lg:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{t('wantToAddGame')}</h3>
              <p className="text-white/60">
                {t('addGameText')}
              </p>
            </div>
            <Button 
              onClick={() => toast.success('Thank you! Game suggestion feature coming soon.')}
              variant="outline"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-xl w-fit"
            >
              {t('suggestGame')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}