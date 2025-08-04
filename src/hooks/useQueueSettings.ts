import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QueueSettings } from '../types';

export function useQueueSettings(queueId?: string) {
  const [settings, setSettings] = useState<QueueSettings | null>({
    id: 'temp',
    queue_id: queueId || '',
    is_paused: false,
    pause_reason: null,
    auto_serve_enabled: false,
    auto_serve_minutes: 5,
    priority_enabled: false,
    max_tokens_per_day: null,
    operating_hours: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Temporarily disabled - return default settings
    setLoading(false);
  }, [queueId]);

  const fetchSettings = async () => {
    if (!queueId) return;

    const { data, error } = await supabase
      .from('queue_settings')
      .select('*')
      .eq('queue_id', queueId)
      .single();

    if (!error && data) {
      setSettings(data);
    } else if (error && error.code === 'PGRST116') {
      // No settings found, create default
      await createDefaultSettings();
    }
    setLoading(false);
  };

  const createDefaultSettings = async () => {
    if (!queueId) return;

    const { data, error } = await supabase
      .from('queue_settings')
      .insert([{ queue_id: queueId }])
      .select()
      .single();

    if (!error && data) {
      setSettings(data);
    }
  };

  const updateSettings = async (updates: Partial<QueueSettings>) => {
    if (!queueId || !settings) return { error: new Error('No settings found') };

    const { data, error } = await supabase
      .from('queue_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', settings.id)
      .select()
      .single();

    if (!error && data) {
      setSettings(data);
    }

    return { data, error };
  };

  const pauseQueue = async (reason?: string) => {
    return updateSettings({ is_paused: true, pause_reason: reason });
  };

  const resumeQueue = async () => {
    return updateSettings({ is_paused: false, pause_reason: null });
  };

  return {
    settings,
    loading,
    updateSettings,
    pauseQueue,
    resumeQueue,
    refetch: fetchSettings,
  };
}