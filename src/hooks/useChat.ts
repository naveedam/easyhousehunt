import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  enquiry_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export function useChat(enquiryId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!enquiryId) return;
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) || []);
    setLoading(false);
  }, [enquiryId]);

  useEffect(() => {
    fetchMessages();

    if (!enquiryId) return;

    const channel = supabase
      .channel(`chat-${enquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `enquiry_id=eq.${enquiryId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enquiryId, fetchMessages]);

  const sendMessage = async (text: string) => {
    if (!user || !enquiryId || !text.trim()) return;

    const { error } = await supabase.from('messages').insert({
      enquiry_id: enquiryId,
      sender_id: user.id,
      message: text.trim(),
    });

    if (error) console.error('Send message error:', error);
  };

  return { messages, loading, sendMessage };
}
