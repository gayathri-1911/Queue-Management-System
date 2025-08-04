import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceType } from '../types';

export function useServiceTypes(queueId?: string) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(false); // Set to false to avoid loading state

  useEffect(() => {
    // Temporarily disabled - tables don't exist yet
    setServiceTypes([]);
    setLoading(false);
  }, [queueId]);

  const fetchServiceTypes = async () => {
    if (!queueId) return;

    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('queue_id', queueId)
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setServiceTypes(data);
      }
    } catch (err) {
      // Table doesn't exist yet, return empty array
      setServiceTypes([]);
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