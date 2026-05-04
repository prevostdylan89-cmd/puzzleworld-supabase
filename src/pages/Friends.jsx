import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { Users, UserPlus, UserCheck, UserX, Loader2, Search, MessageCircle, Send, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function Friends() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Messages state
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);
  const unreadIntervalRef = useRef(null);

  useEffect(() => {
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'messages') setActiveTab('messages');
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFriend && user) {
      loadMessages(selectedFriend.email);
      intervalRef.current = setInterval(() => loadMessages(selectedFriend.email), 8000);
      return () => clearInterval(intervalRef.current);
    }
  }, [selectedFriend, user]);

  useEffect(() => {
    if (user) {
      loadUnreadCount(user);
      unreadIntervalRef.current = setInterval(() => loadUnreadCount(user), 30000);
      return () => clearInterval(unreadIntervalRef.current);
    }
  }, [user]);

  const loadUnreadCount = async (currentUser) => {
    const unreadMsgs = await base44.entities.DirectMessage.filter({ receiver_email: currentUser.email, is_read: false });
    const uniqueConvos = new Set(unreadMsgs.map(m => m.conversation_id));
    setUnreadConversationsCount(uniqueConvos.size);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [friendshipsData, usersData] = await Promise.all([
        base44.entities.Friendship.filter({}),
        base44.entities.UserProfile.filter({})
      ]);

      const acceptedFriends = friendshipsData.filter(
        f => f.status === 'accepted' &&
        (f.requester_email === currentUser.email || f.addressee_email === currentUser.email)
      ).map(f => ({
        email: f.requester_email === currentUser.email ? f.addressee_email : f.requester_email,
        name: f.requester_email === currentUser.email ? f.addressee_name : f.requester_name,
        friendshipId: f.id
      }));

      const pending = friendshipsData.filter(
        f => f.status === 'pending' && f.addressee_email === currentUser.email
      );
      const sent = friendshipsData.filter(
        f => f.status === 'pending' && f.requester_email === currentUser.email
      );

      setFriends(acceptedFriends);
      setPendingRequests(pending);
      setSentRequests(sent);
      setAllUsers(usersData.filter(u => u.email !== currentUser.email));

      // Pre-select friend from URL
      const urlParams = new URLSearchParams(window.location.search);
      const friendEmail = urlParams.get('friend');
      if (friendEmail) {
        const friend = acceptedFriends.find(f => f.email === friendEmail);
        if (friend) {
          setSelectedFriend(friend);
          setActiveTab('messages');
        }
      }
    } catch (error) {
      toast.error(t('loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (friendEmail) => {
    if (!user) return;
    const conversationId = [user.email, friendEmail].sort().join('_');
    const msgs = await base44.entities.DirectMessage.filter({ conversation_id: conversationId });
    const unread = msgs.filter(m => !m.is_read && m.receiver_email === user.email);
    for (const msg of unread) {
      await base44.entities.DirectMessage.update(msg.id, { is_read: true });
    }
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !user) return;
    const conversationId = [user.email, selectedFriend.email].sort().join('_');
    await base44.entities.DirectMessage.create({
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      receiver_email: selectedFriend.email,
      receiver_name: selectedFriend.name,
      message: newMessage.trim(),
      conversation_id: conversationId,
      is_read: false
    });
    setNewMessage('');
    loadMessages(selectedFriend.email);
  };

  const sendFriendRequest = async (targetUser) => {
    await base44.entities.Friendship.create({
      requester_email: user.email,
      requester_name: user.full_name || user.email,
      addressee_email: targetUser.email,
      addressee_name: targetUser.display_name || targetUser.full_name || targetUser.email,
      status: 'pending'
    });
    toast.success(t('requestSent'));
    loadData();
  };

  const acceptRequest = async (requestId) => {
    await base44.entities.Friendship.update(requestId, { status: 'accepted' });
    toast.success(t('requestAccepted'));
    loadData();
  };

  const declineRequest = async (requestId) => {
    await base44.entities.Friendship.delete(requestId);
    toast.success(t('requestDeleted'));
    loadData();
  };

  const removeFriend = async (friendshipId) => {
    await base44.entities.Friendship.delete(friendshipId);
    toast.success(t('friendRemoved'));
    loadData();
  };

  const isFriend = (email) => friends.some(f => f.email === email);
  const hasPendingRequest = (email) =>
    pendingRequests.some(r => r.requester_email === email) ||
    sentRequests.some(r => r.addressee_email === email);

  const filteredUsers = searchQuery.trim().length < 2 ? [] : allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.friend_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('friendsAndMessages')}</h1>
        </div>
        <p className="text-white/60">{t('manageFriendsConversations')}</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="friends" className="data-[state=active]:bg-orange-500/20 text-xs sm:text-sm">
            {t('friends')} ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-orange-500/20 text-xs sm:text-sm relative">
            {t('messages')}
            {unreadConversationsCount > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadConversationsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-orange-500/20 text-xs sm:text-sm">
            {t('received')} ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="data-[state=active]:bg-orange-500/20 text-xs sm:text-sm">
            {t('sent')} ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="find" className="data-[state=active]:bg-orange-500/20 text-xs sm:text-sm">
            {t('findFriends')}
          </TabsTrigger>
        </TabsList>

        {/* MES AMIS */}
        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">{t('noFriendsYet')}</p>
            </div>
          ) : (
            friends.map((friend) => (
              <motion.div key={friend.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {friend.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                   <p className="text-white font-medium">{friend.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => { setSelectedFriend(friend); setActiveTab('messages'); }}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removeFriend(friend.friendshipId)}>
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* MESSAGES */}
        <TabsContent value="messages">
          {friends.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">{t('addFriendsToChatPrompt')}</p>
            </div>
          ) : (
            <>
              {/* MOBILE : vue liste puis vue chat en plein écran */}
              <div className="lg:hidden">
                <AnimatePresence mode="wait">
                  {!selectedFriend ? (
                    // Liste des amis (mobile)
                    <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-white/10">
                        <h3 className="text-white font-semibold">{t('conversations')}</h3>
                      </div>
                      {friends.map((friend) => (
                        <button key={friend.email} onClick={() => setSelectedFriend(friend)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                          <Avatar className="h-11 w-11 ring-2 ring-orange-500/20 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                              {friend.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-white font-medium truncate">{friend.name}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    // Chat plein écran (mobile) — fixé, ne dépasse pas l'écran
                    <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="fixed inset-0 bg-[#000019] z-50 flex flex-col"
                      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#000019] flex-shrink-0">
                        <button onClick={() => setSelectedFriend(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/15">
                          <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <Avatar className="h-9 w-9 ring-2 ring-orange-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                            {selectedFriend.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-white font-semibold">{selectedFriend.name}</p>
                      </div>
                      {/* Messages scrollables */}
                      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.length === 0 && (
                          <p className="text-center text-white/30 text-sm py-8">{t('startConversation')}</p>
                        )}
                        {messages.map((msg) => {
                          const isMine = msg.sender_email === user.email;
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[78%] px-4 py-2 rounded-2xl ${isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                                <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>
                                  {new Date(msg.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                      {/* Input fixé en bas */}
                      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 bg-[#000019]">
                        <form onSubmit={sendMessage} className="flex gap-2">
                          <Input placeholder="Message..." value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="bg-white/5 border-white/20 text-white flex-1"
                            style={{ fontSize: '16px' }} />
                          <Button type="submit" size="icon" className="bg-orange-500 hover:bg-orange-600 flex-shrink-0 w-11 h-11" disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* DESKTOP : layout côte à côte */}
              <div className="hidden lg:flex bg-white/5 border border-white/10 rounded-xl overflow-hidden" style={{ height: '65vh' }}>
                {/* Sidebar amis */}
                <div className="w-80 border-r border-white/10 flex flex-col flex-shrink-0">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold">{t('conversations')}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {friends.map((friend) => (
                      <button key={friend.email} onClick={() => setSelectedFriend(friend)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedFriend?.email === friend.email ? 'bg-white/10 border-l-2 border-l-orange-500' : ''}`}>
                        <Avatar className="h-10 w-10 ring-2 ring-orange-500/20 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                            {friend.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-white font-medium truncate">{friend.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Zone chat */}
                <div className="flex-1 flex flex-col min-w-0">
                  {selectedFriend ? (
                    <>
                      <div className="p-4 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
                        <Avatar className="h-9 w-9 ring-2 ring-orange-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                            {selectedFriend.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-white font-semibold">{selectedFriend.name}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                          <p className="text-center text-white/30 text-sm py-8">{t('startConversation')}</p>
                        )}
                        {messages.map((msg) => {
                          const isMine = msg.sender_email === user.email;
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-md px-4 py-2 rounded-2xl ${isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                                <p className="text-sm">{msg.message}</p>
                                <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>
                                  {new Date(msg.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex-shrink-0">
                        <div className="flex gap-2">
                          <Input placeholder={t('writeMessage')} value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="bg-white/5 border-white/20 text-white" />
                          <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">{t('selectFriendToChat')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* DEMANDES REÇUES */}
        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">{t('noPendingRequests')}</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
              <motion.div key={request.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {request.requester_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{request.requester_name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => acceptRequest(request.id)}>
                    <UserCheck className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => declineRequest(request.id)}>
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* DEMANDES ENVOYÉES */}
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">{t('noSentRequests')}</p>
            </div>
          ) : (
            sentRequests.map((request) => (
              <motion.div key={request.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {request.addressee_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{request.addressee_name}</p>
                    <p className="text-orange-400/70 text-xs">{t('pendingResponse')}</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => declineRequest(request.id)}>
                  <UserX className="w-4 h-4 mr-1" /> {t('cancel')}
                </Button>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* RECHERCHER */}
        <TabsContent value="find" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input placeholder={t('searchByNameOrCode')}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white" />
          </div>
          {searchQuery.trim().length < 2 && (
            <div className="text-center py-8 text-white/40 text-sm">{t('typeAtLeast2Chars')}</div>
          )}
          {filteredUsers.map((targetUser) => (
            <motion.div key={targetUser.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    {(targetUser.full_name || targetUser.email)?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{targetUser.display_name || targetUser.full_name}</p>
                  {targetUser.friend_code && <p className="text-orange-400/70 text-xs">@{targetUser.friend_code}</p>}
                </div>
              </div>
              {isFriend(targetUser.email) ? (
                <Button size="sm" variant="outline" disabled><UserCheck className="w-4 h-4 mr-2" />{t('friend')}</Button>
              ) : hasPendingRequest(targetUser.email) ? (
                <Button size="sm" variant="outline" disabled>{t('pending')}</Button>
              ) : (
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => sendFriendRequest(targetUser)}>
                  <UserPlus className="w-4 h-4 mr-2" />{t('addFriend')}
                </Button>
              )}
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}