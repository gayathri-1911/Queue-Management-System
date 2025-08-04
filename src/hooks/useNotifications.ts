import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export function useNotifications(queueId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queueId) return;

    fetchNotifications();

    const subscription = supabase
      .channel(`notifications:${queueId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `queue_id=eq.${queueId}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queueId]);

  const fetchNotifications = async () => {
    if (!queueId) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('queue_id', queueId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const sendNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'status' | 'sent_at'>) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ ...notification, status: 'pending' }])
      .select()
      .single();

    // In a real implementation, you would integrate with SMS/Email services here
    // For now, we'll just mark browser notifications as sent
    if (!error && data && notification.type === 'browser') {
      await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', data.id);
    }

    return { data, error };
  };

  const sendTokenNearFrontNotification = async (tokenId: string, personName: string, position: number, contactNumber?: string) => {
    const message = `Hi ${personName}, you are now #${position} in the queue. Please be ready!`;
    
    const notifications = [];
    
    // Browser notification
    notifications.push(sendNotification({
      queue_id: queueId!,
      token_id: tokenId,
      type: 'browser',
      recipient: personName,
      message
    }));

    // SMS notification if contact number is available
    if (contactNumber) {
      notifications.push(sendNotification({
        queue_id: queueId!,
        token_id: tokenId,
        type: 'sms',
        recipient: contactNumber,
        message
      }));
    }

    return Promise.all(notifications);
  };

  const sendTokenServedNotification = async (tokenId: string, personName: string) => {
    const message = `${personName} has been served and completed their service.`;
    
    return sendNotification({
      queue_id: queueId!,
      token_id: tokenId,
      type: 'system',
      recipient: 'manager',
      message
    });
  };

  return {
    notifications,
    loading,
    sendNotification,
    sendTokenNearFrontNotification,
    sendTokenServedNotification,
    refetch: fetchNotifications,
  };
}