import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceType } from '../types';

export function useServiceTypes(queueId?: string) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queueId) return;

    fetchServiceTypes();

    const subscription = supabase
      .channel(`service_types:${queueId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'service_types',
        filter: `queue_id=eq.${queueId}`
      }, () => {
        fetchServiceTypes();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queueId]);

  const fetchServiceTypes = async () => {
    if (!queueId) return;

    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('queue_id', queueId)
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setServiceTypes(data);
    }
    setLoading(false);
  };

  const createServiceType = async (serviceType: Omit<ServiceType, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('service_types')
      .insert([serviceType])
      .select()
      .single();

    return { data, error };
  };

  const updateServiceType = async (id: string, updates: Partial<ServiceType>) => {
    const { data, error } = await supabase
      .from('service_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  };

  const deleteServiceType = async (id: string) => {
    const { error } = await supabase
      .from('service_types')
      .update({ is_active: false })
      .eq('id', id);

    return { error };
  };

  return {
    serviceTypes,
    loading,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    refetch: fetchServiceTypes,
  };
}