import React from 'react';
import { ArrowLeft, Clock, Users, TrendingUp, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsDashboardProps {
  queueId: string;
  queueName: string;
  onBack: () => void;
}

export function AnalyticsDashboard({ queueId, queueName, onBack }: AnalyticsDashboardProps) {
  const { analytics, loading } = useAnalytics(queueId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">{queueName} - Last 7 days</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Wait Time</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.averageWaitTime}</p>
                <p className="text-sm text-gray-500">minutes</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tokens Served</p>
                <p className="text-3xl font-bold text-green-600">{analytics.totalTokensServed}</p>
                <p className="text-sm text-gray-500">customers</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tokens Cancelled</p>
                <p className="text-3xl font-bold text-red-600">{analytics.totalTokensCancelled}</p>
                <p className="text-sm text-gray-500">customers</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.totalTokensServed + analytics.totalTokensCancelled > 0
                    ? Math.round((analytics.totalTokensServed / (analytics.totalTokensServed + analytics.totalTokensCancelled)) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">success rate</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Queue Length Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Queue Activity</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.queueLengthTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="length" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wait Time Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Wait Time Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.waitTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgWaitTime" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Performance Summary</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Average wait time: {analytics.averageWaitTime} minutes</li>
                <li>• Service completion rate: {
                  analytics.totalTokensServed + analytics.totalTokensCancelled > 0
                    ? Math.round((analytics.totalTokensServed / (analytics.totalTokensServed + analytics.totalTokensCancelled)) * 100)
                    : 0
                }%</li>
                <li>• Total customers processed: {analytics.totalTokensServed + analytics.totalTokensCancelled}</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {analytics.averageWaitTime > 30 && (
                  <li>• Consider adding more service staff during peak hours</li>
                )}
                {analytics.totalTokensCancelled > analytics.totalTokensServed * 0.2 && (
                  <li>• High cancellation rate - review queue management process</li>
                )}
                <li>• Monitor peak hours to optimize staffing</li>
                <li>• Consider implementing estimated wait time notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}