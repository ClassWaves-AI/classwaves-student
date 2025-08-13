'use client';

import { useState, useCallback } from 'react';
import { Crown, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { websocketService } from '@/lib/websocket';
import { useStudentStore } from '@/stores/student-store';

interface LeaderReadyControlProps {
  'data-testid'?: string;
}

export function LeaderReadyControl({ 'data-testid': testId }: LeaderReadyControlProps) {
  const { student, session, group, setGroupReadiness } = useStudentStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Only show for leaders
  if (!group?.isLeader) {
    return null;
  }

  const handleToggleReady = useCallback(async () => {
    if (!session?.id || !group?.id || !student?.id) {
      console.error('Missing required data for leader ready toggle');
      return;
    }

    setIsLoading(true);
    
    try {
      const newReadyState = !group.isReady;
      
      // Emit the leader ready event via WebSocket
      websocketService.markLeaderReady(session.id, group.id, newReadyState);
      
      // Update local state optimistically
      setGroupReadiness(newReadyState);
      
      console.log(`Leader marked group ${newReadyState ? 'ready' : 'not ready'}`);
    } catch (error) {
      console.error('Failed to update leader ready status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.id, group?.id, group?.isReady, student?.id, setGroupReadiness]);

  const getStatusConfig = () => {
    if (group?.isReady) {
      return {
        icon: CheckCircle,
        label: 'Ready',
        description: 'Your group is marked as ready',
        buttonText: 'Mark Not Ready',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        buttonColor: 'bg-green-600 hover:bg-green-700'
      };
    }
    
    return {
      icon: Clock,
      label: 'Not Ready',
      description: 'Mark your group as ready when everyone is present',
      buttonText: 'Mark Ready',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    };
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div 
      className={`p-4 rounded-lg border-2 transition-all ${status.bgColor} ${status.borderColor}`}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Crown className="h-6 w-6 text-amber-600" />
        <div>
          <h3 className="font-semibold text-gray-900">Group Leader</h3>
          <p className="text-sm text-gray-600">You are the leader of {group?.name}</p>
        </div>
      </div>

      {/* Status Display */}
      <div className="flex items-center gap-3 mb-4">
        <StatusIcon className={`h-5 w-5 ${status.color}`} />
        <div>
          <p className={`font-medium ${status.color}`}>{status.label}</p>
          <p className="text-sm text-gray-600">{status.description}</p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleToggleReady}
        disabled={isLoading || !websocketService.isConnected()}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${status.buttonColor}`}
        data-testid="leader-ready-toggle"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating...
          </span>
        ) : (
          status.buttonText
        )}
      </button>

      {/* Connection Warning */}
      {!websocketService.isConnected() && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-600">Not connected - ready status cannot be updated</span>
        </div>
      )}
    </div>
  );
}
