import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';
import { 
  ArrowLeft,
  Heart,
  Share2,
  Bookmark,
  Play,
  Puzzle,
  Clock,
  Users,
  Star,
  Trophy,
  MessageCircle,
  ChevronRight,
  Download,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import PuzzleCard from '@/components/shared/PuzzleCard';

const puzzleData = {
  title: 'Starry Night Dreams',
  image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=800&fit=crop',
  pieces: 2000,
  difficulty: 'Hard',
  plays: 15234,
  rating: 4.9,
  reviews: 342,
  creator: {
    name: 'ArtMaster',
    avatar: '',
    initials: 'AM',
    followers: '12.5K',
    puzzles: 45
  },
  description: 'Experience the magic of a starry night with this stunning 2000-piece puzzle. The vibrant colors and intricate details make this a challenging yet rewarding puzzle for enthusiasts of all levels.',
  category: 'Abstract',
  tags: ['Abstract', 'Colors', 'Night', 'Stars', 'Art'],
  avgTime: '8h 32m',
  bestTime: '3h 15m',
  dateAdded: 'January 5, 2024'
};

const leaderboard = [
  { rank: 1, name: 'SpeedKing', time: '3h 15m', avatar: '', initials: 'SK' },
  { rank: 2, name: 'PuzzlePro', time: '3h 42m', avatar: '', initials: 'PP' },
  { rank: 3, name: 'NightOwl', time: '4h 08m', avatar: '', initials: 'NO' },
  { rank: 4, name: 'JigsawMaster', time: '4h 23m', avatar: '', initials: 'JM' },
  { rank: 5, name: 'QuickFingers', time: '4h 45m', avatar: '', initials: 'QF' }
];

const reviews = [
  {
    author: { name: 'PuzzleFan', initials: 'PF' },
    rating: 5,
    comment: 'Absolutely stunning puzzle! The colors are vibrant and the pieces fit perfectly.',
    date: '2 days ago',
    helpful: 24
  },
  {
    author: { name: 'JaneD', initials: 'JD' },
    rating: 4,
    comment: 'Beautiful artwork but quite challenging. Took me longer than expected!',
    date: '1 week ago',
    helpful: 18
  }
];

const similarPuzzles = [
  {
    title: 'Cosmic Galaxy',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop',
    pieces: 1500,
    difficulty: 'Hard',
    plays: 5672,
    rating: 4.9,
    creator: 'SpaceExplorer'
  },
  {
    title: 'Abstract Colors',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop',
    pieces: 1500,
    difficulty: 'Hard',
    plays: 2987,
    rating: 4.8,
    creator: 'ModernArt'
  },
  {
    title: 'Aurora Borealis',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=400&fit=crop',
    pieces: 2000,
    difficulty: 'Hard',
    plays: 3456,
    rating: 4.8,
    creator: 'NorthernLights'
  }
];

export default function PuzzleDetail() {
  const { t } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen pb-8">
      {/* Back Button */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
          <Link 
            to={createPageUrl('Collection')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t('backToCollection')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`hover:bg-white/5 ${isWishlisted ? 'text-red-500' : 'text-white/60 hover:text-white'}`}
              onClick={() => setIsWishlisted(!isWishlisted)}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              <Bookmark className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
          <img
            src={puzzleData.image}
            alt={puzzleData.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/30 to-transparent" />
        </div>

        {/* Floating Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Link to={createPageUrl('OnlinePuzzles')}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30"
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </motion.button>
          </Link>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 backdrop-blur-md">
            {puzzleData.difficulty}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 -mt-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Title & Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">{puzzleData.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/60">
              <span className="flex items-center gap-1.5">
                <Puzzle className="w-4 h-4 text-orange-400" />
                {puzzleData.pieces.toLocaleString()} pieces
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-orange-400" />
                {puzzleData.plays.toLocaleString()} plays
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                {puzzleData.rating} ({puzzleData.reviews} reviews)
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" />
                Avg: {puzzleData.avgTime}
              </span>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-3"
              >
                <Link to={createPageUrl('OnlinePuzzles')}>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-8 h-12">
                    <Play className="w-5 h-5 mr-2" />
                    {t('playOnline')}
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    toast.success('Download feature coming soon!');
                  }}
                  variant="outline" 
                  className="border-white/20 text-white hover:bg-white/5 rounded-xl px-6 h-12"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t('download')}
                </Button>
              </motion.div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    {t('overview')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leaderboard"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    {t('leaderboard')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('reviews')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Description */}
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-3">{t('aboutPuzzle')}</h3>
                    <p className="text-white/70 leading-relaxed">{puzzleData.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {puzzleData.tags.map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-white/5 text-white/70 border-white/10"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 text-center">
                      <Clock className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-white">{puzzleData.avgTime}</div>
                      <div className="text-sm text-white/50">{t('avgTime')}</div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 text-center">
                      <Trophy className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                      <div className="text-lg font-bold text-white">{puzzleData.bestTime}</div>
                      <div className="text-sm text-white/50">{t('bestTime')}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-6">
                  <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-4 p-4 ${
                          index !== leaderboard.length - 1 ? 'border-b border-white/[0.06]' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                          entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                          entry.rank === 3 ? 'bg-orange-600 text-orange-100' :
                          'bg-white/10 text-white/50'
                        }`}>
                          {entry.rank}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-sm">
                            {entry.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-white font-medium">{entry.name}</p>
                        </div>
                        <div className="text-orange-400 font-mono font-medium">{entry.time}</div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-4">
                  {reviews.map((review, index) => (
                    <div 
                      key={index}
                      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                            {review.author.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{review.author.name}</span>
                            <div className="flex">
                              {Array(5).fill(0).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${i < review.rating ? 'text-orange-400 fill-orange-400' : 'text-white/20'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-white/70 mt-2">{review.comment}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-white/40">
                            <span>{review.date}</span>
                            <button className="hover:text-white transition-colors">
                              {review.helpful} found helpful
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Creator Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5"
              >
                <h3 className="text-white/50 text-sm mb-4">{t('createdBy')}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {puzzleData.creator.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{puzzleData.creator.name}</p>
                    <p className="text-white/50 text-sm">{puzzleData.creator.followers} {t('followers')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => toast.success('Follow feature coming soon!')}
                    variant="outline" 
                    size="sm"
                    className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 rounded-full"
                  >
                    {t('follow')}
                  </Button>
                  <Link to={createPageUrl('Profile')} className="flex-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full border-white/20 text-white hover:bg-white/5 rounded-full"
                    >
                      {t('viewProfile')}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Report */}
              <button 
                onClick={() => toast.info('Report feature coming soon. Thank you for keeping our community safe!')}
                className="flex items-center gap-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                <Flag className="w-4 h-4" />
                {t('reportPuzzle')}
              </button>
            </div>
          </div>

          {/* Similar Puzzles */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{t('youMightLike')}</h2>
              <Link 
                to={createPageUrl('Collection')}
                className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1"
              >
                {t('viewMore')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {similarPuzzles.map((puzzle, index) => (
                <PuzzleCard key={index} puzzle={puzzle} />
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}