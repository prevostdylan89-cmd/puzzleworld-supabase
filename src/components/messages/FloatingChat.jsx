import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Send, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function FloatingChat() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [openChats, setOpenChats] = useState([]);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousUnreadTotal, setPreviousUnreadTotal] = useState(0);
  const notificationSound = useRef(null);

  useEffect(() => {
    // Load sound preference from localStorage
    const savedSound = localStorage.getItem('chat_sound_enabled');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
    
    // Create notification sound
    notificationSound.current = new Audio('data:audio/wav;base64,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');
    
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Use real-time subscription instead of polling
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        loadConversations(user, previousUnreadTotal, soundEnabled);
      }
    });
    return () => unsub();
  }, [user, previousUnreadTotal, soundEnabled]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadConversations(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const loadConversations = async (currentUser, prevUnread, sound) => {
    try {
      // Get all messages involving the user
      const allMessages = await base44.entities.DirectMessage.list('-created_date', 100);
      const userMessages = allMessages.filter(
        m => m.sender_email === currentUser.email || m.receiver_email === currentUser.email
      );

      // Group by conversation partner
      const conversationMap = {};
      userMessages.forEach(msg => {
        const partnerEmail = msg.sender_email === currentUser.email ? msg.receiver_email : msg.sender_email;
        const partnerName = msg.sender_email === currentUser.email ? msg.receiver_name : msg.sender_name;
        
        if (!conversationMap[partnerEmail]) {
          conversationMap[partnerEmail] = {
            email: partnerEmail,
            name: partnerName,
            lastMessage: msg.message,
            lastMessageDate: msg.created_date,
            unreadCount: 0
          };
        }
        
        // Count unread messages
        if (msg.receiver_email === currentUser.email && !msg.is_read) {
          conversationMap[partnerEmail].unreadCount++;
        }
      });

      // Convert to array and sort by last message date
      const conversationsList = Object.values(conversationMap).sort(
        (a, b) => new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
      );

      setConversations(conversationsList);
      
      // Update unread counts
      const counts = {};
      conversationsList.forEach(conv => {
        if (conv.unreadCount > 0) {
          counts[conv.email] = conv.unreadCount;
        }
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('chat_sound_enabled', newValue.toString());
  };

  const openChat = (conversation) => {
    if (!openChats.find(c => c.email === conversation.email)) {
      setOpenChats([...openChats, { email: conversation.email, name: conversation.name }]);
    }
    setShowConversationsList(false);
  };

  const closeChat = (friendEmail) => {
    setOpenChats(openChats.filter(c => c.email !== friendEmail));
  };

  if (!user || conversations.length === 0) return null;

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="fixed bottom-0 right-4 z-50 hidden lg:flex gap-2 items-end">
      {/* Open Chat Windows */}
      {openChats.map((friend) => (
        <ChatWindow
          key={friend.email}
          friend={friend}
          user={user}
          onClose={() => closeChat(friend.email)}
          unreadCount={unreadCounts[friend.email] || 0}
        />
      ))}

      {/* Conversations List Popup */}
      <AnimatePresence>
        {showConversationsList && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-80 h-[28rem] bg-[#0a0a2e] border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col mb-14"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Messages</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className={`p-1.5 rounded-lg transition-colors ${
                    soundEnabled ? 'text-orange-400 hover:bg-orange-500/10' : 'text-white/30 hover:bg-white/5'
                  }`}
                  title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                >
                  {soundEnabled ? '🔔' : '🔕'}
                </button>
                <button onClick={() => setShowConversationsList(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.email}
                  onClick={() => openChat(conv)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                      {conv.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white text-sm font-medium truncate">{conv.name}</p>
                    <p className="text-white/40 text-xs truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Button */}
      <button
        onClick={() => setShowConversationsList(!showConversationsList)}
        className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all relative"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {totalUnread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </motion.span>
        )}
      </button>
    </div>
  );
}

function ChatWindow({ friend, user, onClose, unreadCount }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Use real-time subscription instead of polling
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        loadMessages();
      }
    });
    return () => unsub();
  }, [friend.email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const conversationId = [user.email, friend.email].sort().join('_');
      const msgs = await base44.entities.DirectMessage.filter({
        conversation_id: conversationId
      });

      // Mark as read
      const unreadMessages = msgs.filter(
        m => !m.is_read && m.receiver_email === user.email
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.DirectMessage.update(msg.id, { is_read: true });
      }

      setMessages(msgs.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const conversationId = [user.email, friend.email].sort().join('_');
      
      await base44.entities.DirectMessage.create({
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        receiver_email: friend.email,
        receiver_name: friend.name,
        message: newMessage.trim(),
        conversation_id: conversationId,
        is_read: false
      });

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-80 bg-[#0a0a2e] border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ height: isMinimized ? '56px' : '400px' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-orange-600/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
              {friend.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium truncate">{friend.name}</span>
          {unreadCount > 0 && !isMinimized && (
            <Badge className="bg-red-500 text-white text-xs">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white/60 hover:text-white p-1"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_email === user.email;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-white/5 border-white/20 text-white text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
}