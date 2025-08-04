import React, { useState } from 'react';
import { ArrowLeft, Plus, Users, Play, BarChart3, Tv, Search } from 'lucide-react';
import { Queue, Token } from '../types';
import { EnhancedTokenCard } from './EnhancedTokenCard';
import { EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard';
import { EnhancedTokenForm } from './EnhancedTokenForm';
import { QueueControls } from './QueueControls';
import { PublicQueueDisplay } from './PublicQueueDisplay';
import { useServiceTypes } from '../hooks/useServiceTypes';
import { useQueueSettings } from '../hooks/useQueueSettings';

interface QueueManagementProps {
  queue: Queue;
  tokens: Token[];
  onBack: () => void;
  onAddToken: (tokenData: {
    personName: string;
    contactNumber?: string;
    serviceTypeId?: string;
    priorityLevel?: number;
  }) => Promise<{ error: any }>;
  onServeToken: (tokenId: string) => Promise<{ error: any }>;
  onCancelToken: (tokenId: string) => Promise<{ error: any }>;
  onMarkNoShow: (tokenId: string) => Promise<{ error: any }>;
  onReorderTokens: (tokens: Token[]) => Promise<void>;
  loading: boolean;
}

export function QueueManagement({
  queue,
  tokens,
  onBack,
  onAddToken,
  onServeToken,
  onCancelToken,
  onMarkNoShow,
  onReorderTokens,
  loading
}: QueueManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPublicDisplay, setShowPublicDisplay] = useState(false);

  const { serviceTypes } = useServiceTypes(queue.id);
  const { settings, pauseQueue, resumeQueue, updateSettings } = useQueueSettings(queue.id);

  const handleServeNext = async () => {
    if (tokens.length > 0) {
      await onServeToken(tokens[0].id);
    }
  };

  const moveToken = async (tokenId: string, direction: 'up' | 'down') => {
    const currentIndex = tokens.findIndex(t => t.id === tokenId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= tokens.length) return;

    const newTokens = [...tokens];
    [newTokens[currentIndex], newTokens[newIndex]] = [newTokens[newIndex], newTokens[currentIndex]];
    
    await onReorderTokens(newTokens);
  };

  if (showPublicDisplay) {
    return (
      <PublicQueueDisplay 
        queue={queue}
        tokens={tokens}
        serviceTypes={serviceTypes}
      />
    );
  }
  if (showAnalytics) {
    return (
      <EnhancedAnalyticsDashboard 
        queueId={queue.id} 
        queueName={queue.name}
        onBack={() => setShowAnalytics(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{queue.name}</h1>
              <p className="text-gray-600 mt-1">
                {tokens.length} {tokens.length === 1 ? 'person' : 'people'} waiting
                {settings?.is_paused && (
                  <span className="ml-2 text-orange-600 font-medium">• Queue Paused</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPublicDisplay(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Tv className="w-5 h-5" />
              <span>Public Display</span>
            </button>
            
            <button
              onClick={() => setShowAnalytics(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>
            
            <button
              onClick={() => setShowAddForm(true)}
              disabled={settings?.is_paused}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span>Add Person</span>
            </button>
            
            {tokens.length > 0 && !settings?.is_paused && (
              <button
                onClick={handleServeNext}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Serve Next</span>
              </button>
            )}
          </div>
        </div>

        {/* Queue Controls */}
        {settings && (
          <div className="mb-8">
            <QueueControls
              settings={settings}
              onPauseQueue={pauseQueue}
              onResumeQueue={resumeQueue}
              onUpdateSettings={updateSettings}
              tokensCount={tokens.length}
            />
          </div>
        )}
        {/* Add Person Form */}
        {showAddForm && (
          <div className="mb-8">
            <EnhancedTokenForm
              onSubmit={onAddToken}
              onCancel={() => setShowAddForm(false)}
              serviceTypes={serviceTypes}
              loading={loading}
              priorityEnabled={settings?.priority_enabled || false}
            />
          </div>
        )}

        {/* Queue Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading queue...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Queue is empty</h3>
            <p className="text-gray-600 mb-6">Add people to the queue to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add First Person
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <EnhancedTokenCard
                key={token.id}
                token={token}
                position={index + 1}
                isNext={index === 0}
                serviceType={serviceTypes.find(st => st.id === token.service_type_id)}
                onServe={() => onServeToken(token.id)}
                onCancel={() => onCancelToken(token.id)}
                onMarkNoShow={() => onMarkNoShow(token.id)}
                onMoveUp={index > 0 ? () => moveToken(token.id, 'up') : undefined}
                onMoveDown={index < tokens.length - 1 ? () => moveToken(token.id, 'down') : undefined}
              />
            ))}
          </div>
        )}

        {/* Token Lookup Link */}
        <div className="mt-8 text-center">
          <a
            href="/token-lookup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Search className="w-4 h-4" />
            <span>Token Lookup Page</span>
          </a>
        </div>
      </div>
    </div>
  );
}