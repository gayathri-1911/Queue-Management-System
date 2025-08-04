import { useState, useEffect } from 'react';
import { Notification } from '../types';

export function useNotifications(queueId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Disabled - notifications table doesn't exist
    setNotifications([]);
    setLoading(false);
  }, [queueId]);

  const fetchNotifications = async () => {
    // Disabled
  };

  const sendNotification = async (notification: any) => {
    console.log('Notification (disabled):', notification);
    return { data: null, error: null };
  };

  const sendTokenNearFrontNotification = async (tokenId: string, personName: string, position: number, contactNumber?: string) => {
    console.log(`Notification: ${personName} is #${position} in queue`);
    return [];
  };

  const sendTokenServedNotification = async (tokenId: string, personName: string) => {
    console.log(`Notification: ${personName} has been served`);
    return { data: null, error: null };
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