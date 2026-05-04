import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { Flame, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import CreatePostForm from '@/components/social/CreatePostForm';
import PostCard from '@/components/social/PostCard';

const POSTS_PER_PAGE = 10;

export default function Social() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('trending');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerTarget = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadInitialPosts();
  }, [activeTab, isGuest, user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {
      // not logged in
    }
  };

  const loadInitialPosts = async () => {
    setIsLoading(true);
    setPosts([]);
    setPage(0);
    setHasMore(true);

    try {
      if (isGuest) {
        const sortBy = activeTab === 'trending' ? '-likes_count' : '-created_date';
        const res = await base44.functions.invoke('publicData', { type: 'posts', sort: sortBy, limit: 10 });
        setPosts(res.data.data || []);
        setHasMore(false);
        return;
      }

      if (activeTab === 'following') {
        if (!user) { setIsLoading(false); return; }
        const follows = await base44.entities.Follow.filter({ follower_email: user.email });
        const followingEmails = follows.map(f => f.following_email);
        if (followingEmails.length === 0) {
          setPosts([]);
          setHasMore(false);
          return;
        }
        const allPosts = await base44.entities.Post.list('-created_date', 50);
        const filtered = allPosts.filter(p => followingEmails.includes(p.created_by));
        setPosts(filtered);
        setHasMore(false);
        return;
      }

      const sortBy = activeTab === 'trending' ? '-likes_count' : '-created_date';
      const postsList = await base44.entities.Post.list(sortBy, POSTS_PER_PAGE, 0);
      setPosts(postsList);
      setHasMore(postsList.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoading || !hasMore || activeTab === 'following') return;
    setIsLoading(true);
    const nextPage = page + 1;
    try {
      const sortBy = activeTab === 'trending' ? '-likes_count' : '-created_date';
      const morePosts = await base44.entities.Post.list(sortBy, POSTS_PER_PAGE, nextPage * POSTS_PER_PAGE);
      if (morePosts.length > 0) {
        setPosts(prev => [...prev, ...morePosts]);
        setPage(nextPage);
        setHasMore(morePosts.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => loadInitialPosts();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">{t('community')}</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="trending" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Flame className="w-4 h-4 mr-2" />
                {t('trending')}
              </TabsTrigger>
              <TabsTrigger value="latest" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Clock className="w-4 h-4 mr-2" />
                {t('latest')}
              </TabsTrigger>
              <TabsTrigger value="following" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                {t('following')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Create Post */}
          {user && !isGuest ? (
            <CreatePostForm user={user} onPostCreated={handlePostCreated} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4"
            >
              <p className="text-white/70 text-sm">🔒 Connectez-vous pour publier dans la communauté</p>
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full flex-shrink-0"
              >
                Se connecter
              </Button>
            </motion.div>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {isLoading && posts.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/50">{t('noPosts')}</p>
              </div>
            ) : (
              <>
                {posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    user={user}
                    isFeatured={activeTab === 'trending' && index < 3}
                  />
                ))}

                {/* Infinite Scroll Trigger */}
                <div ref={observerTarget} className="py-4">
                  {isLoading && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                    </div>
                  )}
                  {!hasMore && posts.length > 0 && !isGuest && (
                    <p className="text-white/40 text-sm text-center">{t('youveReachedEnd')}</p>
                  )}
                  {isGuest && posts.length > 0 && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl text-center space-y-3">
                      <p className="text-white font-semibold">🔓 Voir tous les posts de la communauté</p>
                      <p className="text-white/50 text-sm">Créez un compte gratuit pour accéder à l'intégralité du fil, publier et interagir.</p>
                      <Button
                        onClick={() => base44.auth.redirectToLogin(window.location.href)}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-6"
                      >
                        Se connecter / Créer un compte
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}