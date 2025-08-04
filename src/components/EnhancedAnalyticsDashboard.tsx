import React, { useState } from 'react';
import { ArrowLeft, Clock, Users, TrendingUp, XCircle, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useEnhancedAnalytics } from '../hooks/useEnhancedAnalytics';

interface EnhancedAnalyticsDashboardProps {
  queueId: string;
  queueName: string;
  onBack: () => void;
}

export function EnhancedAnalyticsDashboard({ queueId, queueName, onBack }: EnhancedAnalyticsDashboardProps) {
  const { analytics, loading } = useEnhancedAnalytics(queueId);
  const [timeRange, setTimeRange] = useState<'hourly' | 'daily' | 'weekly'>('daily');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enhanced analytics...</p>
        </div>
      </div>
    );
  }

  const getWaitTimeData = () => {
    switch (timeRange) {
      case 'hourly': return analytics.hourlyWaitTimes;
      case 'weekly': return analytics.weeklyWaitTimes;
      default: return analytics.dailyWaitTimes;
    }
  };

  const pieData = [
    { name: 'Served', value: analytics.totalTokensServed, color: '#10B981' },
    { name: 'Cancelled', value: analytics.totalTokensCancelled, color: '#EF4444' },
    { name: 'No Shows', value: analytics.totalNoShows, color: '#F59E0B' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Analytics</h1>
            <p className="text-gray-600 mt-1">{queueName} - Comprehensive Performance Metrics</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Wait Time</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Service Time</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.averageServiceTime}</p>
                <p className="text-sm text-gray-500">minutes</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cancellation Rate</p>
                <p className="text-3xl font-bold text-red-600">{analytics.cancellationRate}%</p>
                <p className="text-sm text-gray-500">of total</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">No-Show Rate</p>
                <p className="text-3xl font-bold text-orange-600">{analytics.noShowRate}%</p>
                <p className="text-sm text-gray-500">of total</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Wait Time Trends */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wait Time Trends</h3>
              <div className="flex space-x-2">
                {(['hourly', 'daily', 'weekly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getWaitTimeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={timeRange === 'hourly' ? 'hour' : timeRange === 'weekly' ? 'week' : 'date'} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgWaitTime" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Token Status Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Peak Hours */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour.toString().padStart(2, '0')}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(hour) => `${hour.toString().padStart(2, '0')}:00`}
                    formatter={(value) => [value, 'Tokens']}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                  <Bar dataKey="length" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Performance Highlights
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Average wait time: {analytics.averageWaitTime} minutes</li>
                <li>• Service completion rate: {100 - analytics.cancellationRate - analytics.noShowRate}%</li>
                <li>• Peak hour: {analytics.peakHours[0]?.hour.toString().padStart(2, '0')}:00</li>
                <li>• Average service time: {analytics.averageServiceTime} minutes</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {analytics.averageWaitTime > 30 && (
                  <li>• High wait times - consider adding staff</li>
                )}
                {analytics.cancellationRate > 20 && (
                  <li>• High cancellation rate - review process</li>
                )}
                {analytics.noShowRate > 15 && (
                  <li>• High no-show rate - implement reminders</li>
                )}
                <li>• Monitor peak hours for optimal staffing</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Strategic Recommendations
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Implement estimated wait time notifications</li>
                <li>• Consider appointment scheduling for peak hours</li>
                <li>• Add service type categorization</li>
                <li>• Set up automated reminder system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}