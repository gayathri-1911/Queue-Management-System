export interface Queue {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'closed';
  created_at: string;
  manager_id: string;
}

export interface Token {
  id: string;
  queue_id: string;
  person_name: string;
  contact_number?: string;
  service_type_id?: string;
  priority_level: number;
  position: number;
  status: 'waiting' | 'serving' | 'served' | 'cancelled' | 'no_show';
  estimated_wait_minutes?: number;
  created_at: string;
  served_at?: string;
  cancelled_at?: string;
  no_show_at?: string;
}

export interface QueueEvent {
  id: string;
  queue_id: string;
  token_id: string;
  event_type: 'added' | 'served' | 'cancelled' | 'reordered';
  created_at: string;
  wait_time_minutes?: number;
}

export interface User {
  id: string;
  email: string;
}

export interface ServiceType {
  id: string;
  queue_id: string;
  name: string;
  description?: string;
  estimated_duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface QueueSettings {
  id: string;
  queue_id: string;
  is_paused: boolean;
  pause_reason?: string;
  auto_serve_enabled: boolean;
  auto_serve_minutes: number;
  priority_enabled: boolean;
  max_tokens_per_day?: number;
  operating_hours?: any;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  queue_id: string;
  token_id?: string;
  type: 'sms' | 'email' | 'browser' | 'system';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
}

export interface QueueStaff {
  id: string;
  queue_id: string;
  user_id: string;
  role: 'manager' | 'staff' | 'viewer';
  permissions: string[];
  created_at: string;
}

export interface TokenHistory {
  id: string;
  token_id: string;
  status_from?: string;
  status_to: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface EnhancedAnalytics {
  averageWaitTime: number;
  totalTokensServed: number;
  totalTokensCancelled: number;
  totalNoShows: number;
  averageServiceTime: number;
  peakHours: { hour: number; count: number }[];
  hourlyWaitTimes: { hour: string; avgWaitTime: number }[];
  dailyWaitTimes: { date: string; avgWaitTime: number }[];
  weeklyWaitTimes: { week: string; avgWaitTime: number }[];
  cancellationRate: number;
  noShowRate: number;
  queueLengthTrend: { date: string; length: number }[];
  waitTimeTrend: { date: string; avgWaitTime: number }[];
}