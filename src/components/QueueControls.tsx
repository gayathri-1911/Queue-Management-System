import React, { useState } from 'react';
import { Play, Pause, Settings, Users, Clock, AlertCircle } from 'lucide-react';
import { QueueSettings } from '../types';

interface QueueControlsProps {
  settings: QueueSettings;
  onPauseQueue: (reason?: string) => Promise<{ error: any }>;
  onResumeQueue: () => Promise<{ error: any }>;
  onUpdateSettings: (updates: Partial<QueueSettings>) => Promise<{ error: any }>;
  tokensCount: number;
}

export function QueueControls({ 
  settings, 
  onPauseQueue, 
  onResumeQueue, 
  onUpdateSettings,
  tokensCount 
}: QueueControlsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  const handlePause = async () => {
    const { error } = await onPauseQueue(pauseReason.trim() || undefined);
    if (!error) {
      setShowPauseDialog(false);
      setPauseReason('');
    }
  };

  const handleResume = async () => {
    await onResumeQueue();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Queue Controls</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Queue Status */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          settings.is_paused 
            ? 'bg-orange-100 text-orange-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {settings.is_paused ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Paused</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Active</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span>{tokensCount} waiting</span>
        </div>
      </div>

      {/* Pause Reason */}
      {settings.is_paused && settings.pause_reason && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              Reason: {settings.pause_reason}
            </span>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-3">
        {settings.is_paused ? (
          <button
            onClick={handleResume}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Resume Queue</span>
          </button>
        ) : (
          <button
            onClick={() => setShowPauseDialog(true)}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Pause className="w-4 h-4" />
            <span>Pause Queue</span>
          </button>
        )}
      </div>

      {/* Pause Dialog */}
      {showPauseDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pause Queue</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g., Lunch break, System maintenance..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePause}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                Pause Queue
              </button>
              <button
                onClick={() => {
                  setShowPauseDialog(false);
                  setPauseReason('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Queue Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-serve</label>
                <p className="text-xs text-gray-500">Automatically serve next token</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_serve_enabled}
                onChange={(e) => onUpdateSettings({ auto_serve_enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {settings.auto_serve_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-serve delay (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.auto_serve_minutes}
                  onChange={(e) => onUpdateSettings({ auto_serve_minutes: parseInt(e.target.value) })}
                  className="w-20 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Priority Levels</label>
                <p className="text-xs text-gray-500">Enable VIP and high priority tokens</p>
              </div>
              <input
                type="checkbox"
                checked={settings.priority_enabled}
                onChange={(e) => onUpdateSettings({ priority_enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}