import React from 'react';
import { Play, X, ArrowUp, ArrowDown, Clock, User } from 'lucide-react';
import { Token } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface TokenCardProps {
  token: Token;
  position: number;
  isNext: boolean;
  onServe: () => void;
  onCancel: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function TokenCard({ 
  token, 
  position, 
  isNext, 
  onServe, 
  onCancel, 
  onMoveUp, 
  onMoveDown 
}: TokenCardProps) {
  const waitTime = formatDistanceToNow(new Date(token.created_at), { addSuffix: true });

  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
      isNext ? 'ring-2 ring-green-500 ring-opacity-50' : ''
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              isNext 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {position}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">{token.person_name}</h3>
                {isNext && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    Next
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                <Clock className="w-4 h-4" />
                <span>Waiting {waitTime}</span>
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
                onClick={onCancel}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}