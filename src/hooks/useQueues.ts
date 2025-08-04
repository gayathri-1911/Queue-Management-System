import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Queue } from '../types';

export function useQueues(userId?: string) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    fetchQueues();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('queues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchQueues = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('queues')
      .select('*')
      .eq('manager_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQueues(data);
    }
    setLoading(false);
  };

  const createQueue = async (name: string) => {
    if (!userId) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('queues')
      .insert([{ name, manager_id: userId }])
      .select()
      .single();

    if (!error && data) {
      setQueues(prev => [data, ...prev]);
    }

    return { data, error };
  };

  return {
    queues,
    loading,
    createQueue,
    refetch: fetchQueues,
  };
}