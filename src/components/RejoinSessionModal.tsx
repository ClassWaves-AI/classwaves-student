'use client';

import { ArrowRight, Clock, Users, X } from 'lucide-react';

interface PersistedSessionData {
  sessionId: string;
  groupId: string;
  studentId: string;
  timestamp: number;
  status: 'pending' | 'active' | 'rejoining';
  lastActivity: number;
}

interface RejoinSessionModalProps {
  isOpen: boolean;
  sessionData: PersistedSessionData | null;
  onRejoin: (sessionData: PersistedSessionData) => void;
  onStartNew: () => void;
  onClose: () => void;
  isRejoining?: boolean;
}

export function RejoinSessionModal({
  isOpen,
  sessionData,
  onRejoin,
  onStartNew,
  onClose,
  isRejoining = false
}: RejoinSessionModalProps) {
  if (!isOpen || !sessionData) return null;

  const getTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getStatusInfo = () => {
    switch (sessionData.status) {
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          status: 'Session was Active',
          description: 'Your group session was running when you left'
        };
      case 'rejoining':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          status: 'Session Interrupted',
          description: 'It looks like you left unexpectedly during the session'
        };
      default:
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          status: 'Session was Pending',
          description: 'Your group was getting ready when you left'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Welcome Back!</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              data-testid="close-rejoin-modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Session status */}
          <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor} mb-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Users className={`h-4 w-4 ${statusInfo.color}`} />
              <span className={`font-medium ${statusInfo.color}`}>{statusInfo.status}</span>
            </div>
            <p className="text-sm text-gray-700">{statusInfo.description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Last activity: {getTimeAgo(sessionData.lastActivity)}</span>
            </div>
          </div>

          {/* Session details */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Session Details:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Session ID: <span className="font-mono text-xs">{sessionData.sessionId.slice(-8)}</span></p>
              <p>Group ID: <span className="font-mono text-xs">{sessionData.groupId.slice(-8)}</span></p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <button
              onClick={() => onRejoin(sessionData)}
              disabled={isRejoining}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              data-testid="rejoin-session-button"
            >
              {isRejoining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rejoining Session...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Rejoin My Session
                </>
              )}
            </button>

            <button
              onClick={onStartNew}
              className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg transition-colors"
              data-testid="start-new-session-button"
            >
              Start a New Session Instead
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            If you&apos;re having trouble rejoining, try starting a new session or contact your teacher.
          </p>
        </div>
      </div>
    </div>
  );
}
