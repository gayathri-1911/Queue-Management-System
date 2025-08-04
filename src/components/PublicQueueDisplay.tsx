import React, { useEffect, useState } from 'react';
import { Users, Clock, Tv } from 'lucide-react';
import { Token, Queue, ServiceType } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface PublicQueueDisplayProps {
  queue: Queue;
  tokens: Token[];
  serviceTypes: ServiceType[];
}

export function PublicQueueDisplay({ queue, tokens, serviceTypes }: PublicQueueDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getServiceTypeName = (serviceTypeId?: string) => {
    if (!serviceTypeId) return null;
    const serviceType = serviceTypes.find(st => st.id === serviceTypeId);
    return serviceType?.name;
  };

  const currentlyServing = tokens.find(t => t.status === 'serving');
  const waitingTokens = tokens.filter(t => t.status === 'waiting').slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Tv className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{queue.name}</h1>
          <p className="text-xl text-gray-600">Queue Status Display</p>
          <div className="text-lg text-gray-500 mt-4">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Currently Serving */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Now Serving</h2>
              <div className="w-16 h-1 bg-green-500 mx-auto rounded-full"></div>
            </div>

            {currentlyServing ? (
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-green-700">
                    {currentlyServing.position}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {currentlyServing.person_name}
                </h3>
                {getServiceTypeName(currentlyServing.service_type_id) && (
                  <p className="text-gray-600">
                    Service: {getServiceTypeName(currentlyServing.service_type_id)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">No one currently being served</p>
              </div>
            )}
          </div>

          {/* Queue Status */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Queue Status</h2>
              <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-gray-900">People Waiting</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {waitingTokens.length}
                </span>
              </div>

              {waitingTokens.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                    <span className="font-medium text-gray-900">Est. Wait Time</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {waitingTokens[waitingTokens.length - 1]?.estimated_wait_minutes || 15} min
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Waiting List */}
        {waitingTokens.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Next in Line</h2>
              <div className="w-16 h-1 bg-purple-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingTokens.slice(0, 6).map((token, index) => (
                <div
                  key={token.id}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {token.position}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {token.person_name}
                      </h4>
                      {getServiceTypeName(token.service_type_id) && (
                        <p className="text-sm text-gray-600">
                          {getServiceTypeName(token.service_type_id)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Waiting {formatDistanceToNow(new Date(token.created_at))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {waitingTokens.length > 6 && (
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  ... and {waitingTokens.length - 6} more people waiting
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>This display updates automatically • Last updated: {currentTime.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}