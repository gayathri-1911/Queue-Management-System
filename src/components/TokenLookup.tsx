import React, { useState } from 'react';
import { Search, Clock, User, Phone, Settings, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Token, ServiceType } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function TokenLookup() {
  const [tokenId, setTokenId] = useState('');
  const [token, setToken] = useState<Token | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId.trim()) return;

    setLoading(true);
    setError(null);
    setToken(null);
    setServiceType(null);

    try {
      // Look up token
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select(`
          *,
          queues (name)
        `)
        .eq('id', tokenId.trim())
        .single();

      if (tokenError) {
        setError('Token not found. Please check your token ID.');
        return;
      }

      setToken(tokenData);

      // Get service type if available
      if (tokenData.service_type_id) {
        const { data: serviceTypeData } = await supabase
          .from('service_types')
          .select('*')
          .eq('id', tokenData.service_type_id)
          .single();

        if (serviceTypeData) {
          setServiceType(serviceTypeData);
        }
      }
    } catch (err) {
      setError('An error occurred while looking up your token.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-blue-700 bg-blue-100';
      case 'serving': return 'text-green-700 bg-green-100';
      case 'served': return 'text-gray-700 bg-gray-100';
      case 'cancelled': return 'text-red-700 bg-red-100';
      case 'no_show': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting in Queue';
      case 'serving': return 'Currently Being Served';
      case 'served': return 'Service Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check Your Token</h1>
          <p className="text-gray-600 mt-2">
            Enter your token ID to check your queue status
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-6">
          <div>
            <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-2">
              Token ID
            </label>
            <input
              id="tokenId"
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Enter your token ID..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !tokenId.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Looking up...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Check Status</span>
              </div>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {token && (
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Token Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(token.status)}`}>
                    {getStatusLabel(token.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Queue</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(token as any).queues?.name}
                  </span>
                </div>

                {token.status === 'waiting' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Position</span>
                      <span className="text-lg font-bold text-blue-600">#{token.position}</span>
                    </div>

                    {token.estimated_wait_minutes && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Est. Wait Time</span>
                        <span className="text-sm font-medium text-orange-600">
                          {token.estimated_wait_minutes} minutes
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Joined</span>
                  <span className="text-sm text-gray-900">
                    {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}
                  </span>
                </div>

                {serviceType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Type</span>
                    <span className="text-sm text-gray-900">{serviceType.name}</span>
                  </div>
                )}
              </div>
            </div>

            {token.status === 'waiting' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">What's Next?</span>
                </div>
                <p className="text-sm text-blue-800">
                  {token.position === 1 
                    ? "You're next! Please be ready to be served."
                    : token.position <= 3
                    ? "You're coming up soon. Please stay nearby."
                    : "Please wait for your turn. We'll serve you as soon as possible."
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}