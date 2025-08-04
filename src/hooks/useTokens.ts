import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Token } from '../types';
import { useNotifications } from './useNotifications';



export function useTokens(queueId?: string) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendTokenNearFrontNotification, sendTokenServedNotification } = useNotifications(queueId);

  useEffect(() => {
    if (!queueId) return;

    fetchTokens();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`tokens:${queueId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tokens',
        filter: `queue_id=eq.${queueId}`
      }, () => {
        fetchTokens();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queueId]);

  const fetchTokens = async () => {
    if (!queueId) return;

    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('queue_id', queueId)
      .order('position', { ascending: true });

    if (!error && data) {
      setTokens(data);
    }
    setLoading(false);
  };

  const addToken = async (tokenData: {
    personName: string;
    contactNumber?: string;
    serviceTypeId?: string;
    priorityLevel?: number;
  }) => {
    if (!queueId) return { error: new Error('Queue ID required') };

    // Get the next position
    const maxPosition = Math.max(...tokens.map(t => t.position), 0);

    const { data, error } = await supabase
      .from('tokens')
      .insert([{
        queue_id: queueId,
        person_name: tokenData.personName,
        contact_number: tokenData.contactNumber,
        service_type_id: tokenData.serviceTypeId,
        priority_level: tokenData.priorityLevel || 1,
        position: maxPosition + 1,
        status: 'waiting'
      }])
      .select()
      .single();

    if (!error && data) {
      // Log the event
      await supabase.from('queue_events').insert([{
        queue_id: queueId,
        token_id: data.id,
        event_type: 'added'
      }]);

      // Send notification if token is in top 3
      const currentPosition = data.position;
      if (currentPosition <= 3) {
        await sendTokenNearFrontNotification(
          data.id,
          data.person_name,
          currentPosition,
          data.contact_number
        );
      }
    }

    return { data, error };
  };

  const updateTokenPosition = async (tokenId: string, newPosition: number) => {
    const { error } = await supabase
      .from('tokens')
      .update({ position: newPosition })
      .eq('id', tokenId);

    if (!error) {
      await supabase.from('queue_events').insert([{
        queue_id: queueId!,
        token_id: tokenId,
        event_type: 'reordered'
      }]);
    }

    return { error };
  };

  const serveToken = async (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return { error: new Error('Token not found') };

    const serviceStartTime = new Date();
    const waitTimeMinutes = Math.round(
      (new Date().getTime() - new Date(token.created_at).getTime()) / (1000 * 60)
    );

    const { error } = await supabase
      .from('tokens')
      .update({ 
        status: 'served',
        served_at: new Date().toISOString()
      })
      .eq('id', tokenId);

    if (!error) {
      // Calculate service duration (for demo, using a random duration between 5-30 minutes)
      const serviceDurationMinutes = Math.floor(Math.random() * 25) + 5;
      
      await supabase.from('queue_events').insert([{
        queue_id: queueId!,
        token_id: tokenId,
        event_type: 'served',
        wait_time_minutes: waitTimeMinutes,
        service_duration_minutes: serviceDurationMinutes
      }]);

      // Send notification
      await sendTokenServedNotification(tokenId, token.person_name);

      // Notify next tokens in queue
      const remainingTokens = tokens.filter(t => t.id !== tokenId && t.status === 'waiting');
      for (let i = 0; i < Math.min(3, remainingTokens.length); i++) {
        const nextToken = remainingTokens[i];
        await sendTokenNearFrontNotification(
          nextToken.id,
          nextToken.person_name,
          i + 1,
          nextToken.contact_number
        );
      }
    }

    return { error };
  };

  const cancelToken = async (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return { error: new Error('Token not found') };

    const waitTimeMinutes = Math.round(
      (new Date().getTime() - new Date(token.created_at).getTime()) / (1000 * 60)
    );

    const { error } = await supabase
      .from('tokens')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', tokenId);

    if (!error) {
      await supabase.from('queue_events').insert([{
        queue_id: queueId!,
        token_id: tokenId,
        event_type: 'cancelled',
        wait_time_minutes: waitTimeMinutes
      }]);
    }

    return { error };
  };

  const markNoShow = async (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return { error: new Error('Token not found') };

    const waitTimeMinutes = Math.round(
      (new Date().getTime() - new Date(token.created_at).getTime()) / (1000 * 60)
    );

    const { error } = await supabase
      .from('tokens')
      .update({ 
        status: 'no_show',
        no_show_at: new Date().toISOString()
      })
      .eq('id', tokenId);

    if (!error) {
      await supabase.from('queue_events').insert([{
        queue_id: queueId!,
        token_id: tokenId,
        event_type: 'cancelled',
        wait_time_minutes: waitTimeMinutes
      }]);
    }

    return { error };
  };

  const reorderTokens = async (reorderedTokens: Token[]) => {
    const updates = reorderedTokens.map((token, index) => 
      supabase
        .from('tokens')
        .update({ position: index + 1 })
        .eq('id', token.id)
    );

    await Promise.all(updates);
  };

  return {
    tokens: tokens.filter(t => t.status === 'waiting'),
    allTokens: tokens,
    loading,
    addToken,
    updateTokenPosition,
    serveToken,
    cancelToken,
    markNoShow,
    reorderTokens,
    refetch: fetchTokens,
  };
}