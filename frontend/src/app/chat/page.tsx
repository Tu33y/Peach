'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../api';
import { useAuthStore } from '../../store/authStore';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<string[]>([]);
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchContacts = async () => {
    try {
      const res = await api.get('/messages/contacts/recent');
      setContacts(res.data);
      if (res.data.length > 0 && !activeContact) {
        setActiveContact(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await api.get(`/messages/${contactId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;
    try {
      await api.post('/messages', {
        recipient_id: activeContact,
        text: newMessage,
      });
      setNewMessage('');
      fetchMessages(activeContact);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact);
    }
  }, [activeContact]);

  if (!user) {
    return (
      <Layout>
        <p className="text-gray-500 mt-8">Please log in to contact providers or view messages.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="text-indigo-600 h-8 w-8" />
          <span>Messages & Inbox</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm h-[600px]">
          {/* Contacts Sidebar */}
          <div className="border-r border-gray-100 p-4 overflow-y-auto">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4">Inbox Chats</h2>
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-xs text-gray-400">No active contact threads.</p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full text-left p-3.5 rounded-2xl text-sm font-semibold transition-all ${
                      activeContact === contact
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {contact}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="col-span-2 flex flex-col justify-between h-full bg-gray-50">
            {activeContact ? (
              <>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-4">
                  <span className="font-bold text-gray-800 text-sm">Chatting with {activeContact}</span>
                </div>

                {/* Messages Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3 flex flex-col">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id !== activeContact;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-md p-3.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white self-end rounded-tr-none'
                            : 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Message input bar */}
                <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                  />
                  <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">Select an inbox conversation to begin chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
