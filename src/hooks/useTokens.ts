import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Token } from '../types';
import { useNotifications } from './useNotifications';

// Temporary debugging - expose supabase to window for testing
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

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
    console.log('addToken called with:', tokenData);
    console.log('queueId:', queueId);

    if (!queueId) {
      console.error('No queue ID provided');
      return { error: new Error('Queue ID required') };
    }

    // Get the next position
    const maxPosition = Math.max(...tokens.map(t => t.position), 0);
    console.log('Current tokens:', tokens.length, 'Max position:', maxPosition);

    // Use only the basic fields from the first migration
    const insertData = {
      queue_id: queueId,
      person_name: tokenData.personName,
      position: maxPosition + 1,
      status: 'waiting'
    };

    console.log('Inserting token with data:', insertData);

    const { data, error } = await supabase
      .from('tokens')
      .insert([insertData])
      .select()
      .single();

    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Error inserting token:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return { data, error };
    }

    if (data) {
      // Log the event
      console.log('Logging queue event for token:', data.id);
      const eventResult = await supabase.from('queue_events').insert([{
        queue_id: queueId,
        token_id: data.id,
        event_type: 'added'
      }]);

      console.log('Event log result:', eventResult);

      // Send notification if token is in top 3
      const currentPosition = data.position;
      if (currentPosition <= 3) {
        console.log('Sending notification for token in position:', currentPosition);
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