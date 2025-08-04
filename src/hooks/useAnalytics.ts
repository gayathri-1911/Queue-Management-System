import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  averageWaitTime: number;
  totalTokensServed: number;
  totalTokensCancelled: number;
  queueLengthTrend: { date: string; length: number }[];
  waitTimeTrend: { date: string; avgWaitTime: number }[];
}

export function useAnalytics(queueId?: string) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    averageWaitTime: 0,
    totalTokensServed: 0,
    totalTokensCancelled: 0,
    queueLengthTrend: [],
    waitTimeTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queueId) return;
    fetchAnalytics();
  }, [queueId]);

  const fetchAnalytics = async () => {
    if (!queueId) return;

    try {
      // Get events from last 7 days
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data: events, error } = await supabase
        .from('queue_events')
        .select('*')
        .eq('queue_id', queueId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // Calculate analytics
      const servedEvents = events?.filter(e => e.event_type === 'served') || [];
      const cancelledEvents = events?.filter(e => e.event_type === 'cancelled') || [];
      
      const totalServed = servedEvents.length;
      const totalCancelled = cancelledEvents.length;
      
      const avgWaitTime = servedEvents.reduce((sum, event) => 
        sum + (event.wait_time_minutes || 0), 0) / (totalServed || 1);

      // Generate trend data for last 7 days
      const trendDays = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'MMM dd'),
          fullDate: date
        };
      });

      const queueLengthTrend = trendDays.map(day => {
        const dayStart = startOfDay(day.fullDate);
        const dayEnd = endOfDay(day.fullDate);
        
        const dayEvents = events?.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        }) || [];
        
        return {
          date: day.date,
          length: dayEvents.filter(e => e.event_type === 'added').length
        };
      });

      const waitTimeTrend = trendDays.map(day => {
        const dayStart = startOfDay(day.fullDate);
        const dayEnd = endOfDay(day.fullDate);
        
        const dayServedEvents = servedEvents.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        });
        
        const avgWaitTimeDay = dayServedEvents.reduce((sum, event) => 
          sum + (event.wait_time_minutes || 0), 0) / (dayServedEvents.length || 1);
        
        return {
          date: day.date,
          avgWaitTime: Math.round(avgWaitTimeDay)
        };
      });

      setAnalytics({
        averageWaitTime: Math.round(avgWaitTime),
        totalTokensServed: totalServed,
        totalTokensCancelled: totalCancelled,
        queueLengthTrend,
        waitTimeTrend
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refetch: fetchAnalytics };
}