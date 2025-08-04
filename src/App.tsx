import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useQueues } from './hooks/useQueues';
import { useTokens } from './hooks/useTokens';
import { LoginForm } from './components/LoginForm';
import { QueueList } from './components/QueueList';
import { QueueManagement } from './components/QueueManagement';
import { TokenLookup } from './components/TokenLookup';
import { Queue } from './types';

function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { queues, loading: queuesLoading, createQueue } = useQueues(user?.id);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [showTokenLookup, setShowTokenLookup] = useState(false);
  
  const {
    tokens,
    loading: tokensLoading,
    addToken,
    serveToken,
    cancelToken,
    markNoShow,
    reorderTokens
  } = useTokens(selectedQueue?.id);

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm onSignIn={signIn} onSignUp={signUp} />;
  }

  // Show token lookup if requested
  if (showTokenLookup) {
    return <TokenLookup />;
  }
  // Show queue management if a queue is selected
  if (selectedQueue) {
    return (
      <QueueManagement
        queue={selectedQueue}
        tokens={tokens}
        onBack={() => setSelectedQueue(null)}
        onAddToken={addToken}
        onServeToken={serveToken}
        onCancelToken={cancelToken}
        onMarkNoShow={markNoShow}
        onReorderTokens={reorderTokens}
        loading={tokensLoading}
      />
    );
  }

  // Show queue list with header
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Queue Manager</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTokenLookup(true)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Token Lookup
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <QueueList
        queues={queues}
        onCreateQueue={createQueue}
        onSelectQueue={setSelectedQueue}
        loading={queuesLoading}
      />
    </div>
  );
}

export default App;