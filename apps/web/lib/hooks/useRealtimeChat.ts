'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface PresenceState {
  user_id: string;
  online_at: string;
}

export function useRealtimeChat(threadId: string, currentUserId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('professional_messages')
      .select('id, thread_id, sender_id, content, created_at, read_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data as ChatMessage[]);
    setLoading(false);
  }, [threadId, supabase]);

  const markAsRead = useCallback(async () => {
    await supabase
      .from('professional_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .is('read_at', null)
      .neq('sender_id', currentUserId);
  }, [threadId, currentUserId, supabase]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const res = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
    },
    [threadId]
  );

  const sendTyping = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    });
  }, [currentUserId]);

  useEffect(() => {
    loadMessages();
    markAsRead();

    const channel = supabase.channel(`chat:${threadId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'professional_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id !== currentUserId) {
            setTimeout(() => markAsRead(), 500);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'professional_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if ((payload as PresenceState).user_id !== currentUserId) {
          setOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PresenceState[]>;
        const others = Object.keys(state).filter((k) => k !== currentUserId);
        setOtherUserOnline(others.length > 0);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
          if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnected(false);
          if (!fallbackIntervalRef.current) {
            fallbackIntervalRef.current = setInterval(() => loadMessages(), 10000);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [threadId, currentUserId, loadMessages, markAsRead, supabase]);

  return {
    messages,
    loading,
    connected,
    otherUserOnline,
    otherUserTyping,
    sendMessage,
    sendTyping,
  };
}
