'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, MessageSquare, ShieldAlert, Ban, AlertCircle, Sparkles } from 'lucide-react';

interface Chat {
  id: string;
  user1: string;
  user2: string;
  booking_id?: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  attachment?: string;
  is_read: boolean;
  created_at: string;
}

function ChatContent() {
  const { user, token } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const recipientIdParam = searchParams ? searchParams.get('recipient_id') : null;
  const bookingIdParam = searchParams ? searchParams.get('booking_id') : null;

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chat/me');
      setChats(res.data);

      // If redirected with parameters, create or load that specific chat
      if (recipientIdParam) {
        const createRes = await api.post(`/chat/create-chat?recipient_id=${recipientIdParam}&booking_id=${bookingIdParam || ''}`);
        setActiveChat(createRes.data);
        // Refresh chats feed
        const updatedRes = await api.get('/chat/me');
        setChats(updatedRes.data);
      } else if (res.data.length > 0 && !activeChat) {
        setActiveChat(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await api.get(`/chat/${chatId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    // Send through WebSocket if active, else fall back to API post
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        text: newMessage
      }));
      setNewMessage('');
    } else {
      try {
        const otherUser = activeChat.user1 === user?.id ? activeChat.user2 : activeChat.user1;
        await api.post('/messages', {
          recipient_id: otherUser,
          text: newMessage,
          chat_id: activeChat.id
        });
        setNewMessage('');
        fetchMessages(activeChat.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBlockUser = async () => {
    if (!activeChat) return;
    const otherUser = activeChat.user1 === user?.id ? activeChat.user2 : activeChat.user1;
    if (confirm('Are you sure you want to block this user?')) {
      try {
        await api.post(`/chat/block/${otherUser}`);
        alert('User blocked successfully.');
      } catch (e) {
        alert('Failed to block user.');
      }
    }
  };

  const handleReportMessage = async (messageId: string) => {
    const reason = prompt('Please specify the reason for reporting this message:');
    if (!reason) return;
    try {
      await api.post(`/chat/report/${messageId}?reason=${encodeURIComponent(reason)}`);
      alert('Message reported successfully. Moderators will investigate.');
    } catch (e) {
      alert('Failed to report message.');
    }
  };

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecipientTyping]);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, recipientIdParam]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);

      // Establish Real-time WebSocket Connection!
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${activeChat.id}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.type === 'typing') {
          if (data.sender_id !== user?.id) {
            setIsRecipientTyping(data.is_typing);
          }
        } else if (data.type === 'error') {
          alert(data.content);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        ws.close();
      };
    }
  }, [activeChat]);

  // Handle typing indicator trigger
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!typing && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setTyping(true);
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
        }
        setTyping(false);
      }, 3000);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-20 text-center font-semibold text-gray-500">
          Please log in to contact providers or view messages.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Workspace banner header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <MessageSquare className="text-rose-500 h-8 w-8" />
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inbox & Secured Chats</h1>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">Real-time messaging with live support and block options</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/20 h-[650px]">

          {/* Active Chats Contacts Side feed */}
          <div className="border-r border-gray-50 p-6 overflow-y-auto space-y-4">
            <span className="text-xs font-black tracking-widest uppercase text-gray-400 block mb-2">My Discussions</span>
            <div className="space-y-2">
              {chats.length === 0 ? (
                <p className="text-xs text-gray-400 font-semibold py-4 text-center">No active chats in your inbox.</p>
              ) : (
                chats.map((chat) => {
                  const otherUser = chat.user1 === user?.id ? chat.user2 : chat.user1;
                  const isActive = activeChat?.id === chat.id;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className={`w-full text-left p-4 rounded-2xl text-sm font-extrabold transition-all flex items-center justify-between group ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {otherUser.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]">{otherUser}</span>
                      </div>

                      {chat.booking_id && (
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          Order
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Real-time Messaging window viewport */}
          <div className="col-span-2 flex flex-col justify-between h-full bg-gray-50">
            {activeChat ? (
              <>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-black text-sm">
                      {(activeChat.user1 === user?.id ? activeChat.user2 : activeChat.user1).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-extrabold text-gray-800 text-sm block leading-none">
                        {activeChat.user1 === user?.id ? activeChat.user2 : activeChat.user1}
                      </span>
                      {isRecipientTyping ? (
                        <span className="text-[10px] text-rose-500 font-bold animate-pulse mt-1 block">typing...</span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Active Discussion</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBlockUser}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-gray-50 transition-colors"
                      title="Block User"
                    >
                      <Ban className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Messages Body Scroll Area */}
                <div className="flex-grow overflow-y-auto p-6 space-y-4 flex flex-col">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-md p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm relative group ${
                          isMe
                            ? 'bg-gray-900 text-white self-end rounded-tr-none'
                            : 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none'
                        }`}
                      >
                        <p>{msg.text}</p>

                        {!isMe && (
                          <button
                            onClick={() => handleReportMessage(msg.id)}
                            className="absolute right-[-24px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                            title="Report Message"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Secure input compose bar */}
                <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-100 flex gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Compose your encrypted message..."
                    className="flex-grow px-4 py-3.5 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                    value={newMessage}
                    onChange={handleTypingChange}
                    required
                  />
                  <button type="submit" className="bg-rose-500 text-white p-3.5 rounded-2xl hover:bg-rose-600 transition-all shadow-md shadow-rose-500/10 shrink-0">
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <span className="text-5xl block animate-bounce">💬</span>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Your Conversations</h3>
                  <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto mt-1 leading-relaxed">
                    Select any inbox conversation to start sending and receiving secure real-time messages.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<Layout><div className="text-center py-20 text-gray-400 font-bold">Loading Inbox Discussions...</div></Layout>}>
      <ChatContent />
    </Suspense>
  );
}
