import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { EnhancedAnalytics } from '../types';

export function useEnhancedAnalytics(queueId?: string) {
  const [analytics, setAnalytics] = useState<EnhancedAnalytics>({
    averageWaitTime: 0,
    totalTokensServed: 0,
    totalTokensCancelled: 0,
    totalNoShows: 0,
    averageServiceTime: 0,
    peakHours: [],
    hourlyWaitTimes: [],
    dailyWaitTimes: [],
    weeklyWaitTimes: [],
    cancellationRate: 0,
    noShowRate: 0,
    queueLengthTrend: [],
    waitTimeTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!queueId) return;
    fetchEnhancedAnalytics();
  }, [queueId]);

  const fetchEnhancedAnalytics = async () => {
    if (!queueId) return;

    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      // Get all events and tokens for analysis
      const [eventsResult, tokensResult] = await Promise.all([
        supabase
          .from('queue_events')
          .select('*')
          .eq('queue_id', queueId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('tokens')
          .select('*')
          .eq('queue_id', queueId)
          .gte('created_at', thirtyDaysAgo.toISOString())
      ]);

      if (eventsResult.error || tokensResult.error) {
        throw eventsResult.error || tokensResult.error;
      }

      const events = eventsResult.data || [];
      const tokens = tokensResult.data || [];

      // Calculate basic metrics
      const servedTokens = tokens.filter(t => t.status === 'served');
      const cancelledTokens = tokens.filter(t => t.status === 'cancelled');
      const noShowTokens = tokens.filter(t => t.status === 'no_show');
      const totalProcessed = servedTokens.length + cancelledTokens.length + noShowTokens.length;

      const servedEvents = events.filter(e => e.event_type === 'served');
      const avgWaitTime = servedEvents.reduce((sum, event) => 
        sum + (event.wait_time_minutes || 0), 0) / (servedEvents.length || 1);

      const avgServiceTime = servedEvents.reduce((sum, event) => 
        sum + (event.service_duration_minutes || 15), 0) / (servedEvents.length || 1);

      // Calculate peak hours
      const hourCounts: { [key: number]: number } = {};
      events.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate hourly wait times (last 24 hours)
      const hourlyWaitTimes = Array.from({ length: 24 }, (_, i) => {
        const hourEvents = servedEvents.filter(e => {
          const eventHour = new Date(e.created_at).getHours();
          return eventHour === i;
        });
        
        const avgWaitTimeHour = hourEvents.reduce((sum, event) => 
          sum + (event.wait_time_minutes || 0), 0) / (hourEvents.length || 1);
        
        return {
          hour: `${i.toString().padStart(2, '0')}:00`,
          avgWaitTime: Math.round(avgWaitTimeHour)
        };
      });

      // Generate daily wait times (last 30 days)
      const dailyWaitTimes = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayEvents = servedEvents.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        });
        
        const avgWaitTimeDay = dayEvents.reduce((sum, event) => 
          sum + (event.wait_time_minutes || 0), 0) / (dayEvents.length || 1);
        
        return {
          date: format(date, 'MMM dd'),
          avgWaitTime: Math.round(avgWaitTimeDay)
        };
      });

      // Generate weekly wait times (last 12 weeks)
      const weeklyWaitTimes = Array.from({ length: 12 }, (_, i) => {
        const weekStart = startOfWeek(subDays(new Date(), (11 - i) * 7));
        const weekEnd = endOfWeek(weekStart);
        
        const weekEvents = servedEvents.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        
        const avgWaitTimeWeek = weekEvents.reduce((sum, event) => 
          sum + (event.wait_time_minutes || 0), 0) / (weekEvents.length || 1);
        
        return {
          week: format(weekStart, 'MMM dd'),
          avgWaitTime: Math.round(avgWaitTimeWeek)
        };
      });

      // Generate queue length trend (last 7 days)
      const queueLengthTrend = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayEvents = events.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        });
        
        return {
          date: format(date, 'MMM dd'),
          length: dayEvents.filter(e => e.event_type === 'added').length
        };
      });

      // Generate wait time trend (last 7 days)
      const waitTimeTrend = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayServedEvents = servedEvents.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        });
        
        const avgWaitTimeDay = dayServedEvents.reduce((sum, event) => 
          sum + (event.wait_time_minutes || 0), 0) / (dayServedEvents.length || 1);
        
        return {
          date: format(date, 'MMM dd'),
          avgWaitTime: Math.round(avgWaitTimeDay)
        };
      });

      setAnalytics({
        averageWaitTime: Math.round(avgWaitTime),
        totalTokensServed: servedTokens.length,
        totalTokensCancelled: cancelledTokens.length,
        totalNoShows: noShowTokens.length,
        averageServiceTime: Math.round(avgServiceTime),
        peakHours,
        hourlyWaitTimes,
        dailyWaitTimes,
        weeklyWaitTimes,
        cancellationRate: totalProcessed > 0 ? Math.round((cancelledTokens.length / totalProcessed) * 100) : 0,
        noShowRate: totalProcessed > 0 ? Math.round((noShowTokens.length / totalProcessed) * 100) : 0,
        queueLengthTrend,
        waitTimeTrend
      });
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refetch: fetchEnhancedAnalytics };
}