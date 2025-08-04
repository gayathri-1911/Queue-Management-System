import React from 'react';
import { Play, X, ArrowUp, ArrowDown, Clock, User, Phone, Settings, AlertTriangle, Crown } from 'lucide-react';
import { Token, ServiceType } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedTokenCardProps {
  token: Token;
  position: number;
  isNext: boolean;
  serviceType?: ServiceType;
  onServe: () => void;
  onCancel: () => void;
  onMarkNoShow: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function EnhancedTokenCard({ 
  token, 
  position, 
  isNext, 
  serviceType,
  onServe, 
  onCancel, 
  onMarkNoShow,
  onMoveUp, 
  onMoveDown 
}: EnhancedTokenCardProps) {
  const waitTime = formatDistanceToNow(new Date(token.created_at), { addSuffix: true });
  const estimatedWait = token.estimated_wait_minutes;

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 3: return 'text-purple-700 bg-purple-100';
      case 2: return 'text-orange-700 bg-orange-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 3: return 'VIP';
      case 2: return 'High';
      default: return 'Normal';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
      isNext ? 'ring-2 ring-green-500 ring-opacity-50' : ''
    } ${token.priority_level > 1 ? 'border-l-4 border-l-purple-500' : ''}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative ${
              isNext 
                ? 'bg-green-100 text-green-700' 
                : getPriorityColor(token.priority_level)
            }`}>
              {position}
              {token.priority_level > 1 && (
                <Crown className="w-4 h-4 absolute -top-1 -right-1 text-purple-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <User className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">{token.person_name}</h3>
                {isNext && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    Next
                  </span>
                )}
                {token.priority_level > 1 && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(token.priority_level)}`}>
                    {getPriorityLabel(token.priority_level)}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Waiting {waitTime}</span>
                  {estimatedWait && (
                    <span className="text-blue-600 font-medium">
                      • Est. {estimatedWait} min remaining
                    </span>
                  )}
                </div>
                
                {token.contact_number && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>{token.contact_number}</span>
                  </div>
                )}
                
                {serviceType && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Settings className="w-4 h-4" />
                    <span>{serviceType.name} ({serviceType.estimated_duration_minutes} min)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Move buttons */}
            <div className="flex flex-col space-y-1">
              {onMoveUp && (
                <button
                  onClick={onMoveUp}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4 text-gray-600" />
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={onMoveDown}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={onServe}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Serve</span>
              </button>
              
              <button
                onClick={onMarkNoShow}
                className="bg-orange-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-1"
                title="Mark as No Show"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
              
              <button
                onClick={onCancel}
                className="bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
                title="Cancel Token"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}