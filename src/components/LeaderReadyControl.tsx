'use client';

import { useState, useCallback, useEffect } from 'react';
import { Crown, CheckCircle, Clock, AlertCircle, Mic, MicOff } from 'lucide-react';
import { websocketService } from '@/lib/websocket';
import { useStudentStore } from '@/stores/student-store';
import { useAudioRecorder } from '@/features/audio-recording/hooks/use-audio-recorder';

interface LeaderReadyControlProps {
  'data-testid'?: string;
}

export function LeaderReadyControl({ 'data-testid': testId }: LeaderReadyControlProps) {
  const { student, session, group, setGroupReadiness } = useStudentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // SG-ST-02: Use audio recorder for permission management
  const { hasPermission, error: permissionError, requestPermission } = useAudioRecorder();
  
  // SG-ST-02: Proactively check mic permission on component mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handleToggleReady = useCallback(async () => {
    if (!session?.id || !group?.id || !student?.id) {
      console.error('Missing required data for leader ready toggle');
      return;
    }

    const newReadyState = !group.isReady;
    
    // SG-ST-03: Require mic permission before marking Ready=true
    if (newReadyState && !hasPermission) {
      console.log('Permission required to mark ready - requesting...');
      setIsRequestingPermission(true);
      try {
        await requestPermission();
        if (!hasPermission) {
          console.log('Permission denied - cannot mark ready');
          setIsRequestingPermission(false);
          return;
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        setIsRequestingPermission(false);
        return;
      }
      setIsRequestingPermission(false);
    }

    setIsLoading(true);
    
    try {
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
  }, [session?.id, group?.id, group?.isReady, student?.id, setGroupReadiness, hasPermission, requestPermission]);

  // Handle permission request from UI
  const handleRequestPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      await requestPermission();
      console.log('Permission request completed');
    } catch (error) {
      console.error('Permission request failed:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [requestPermission]);

  // Only show for leaders - after all hooks
  if (!group?.isLeader) {
    return null;
  }

  const getStatusConfig = () => {
    // Ready state (permission already granted)
    if (group?.isReady) {
      return {
        icon: CheckCircle,
        label: 'Ready',
        description: 'Your group is marked as ready',
        buttonText: 'Mark Not Ready',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        showPermissionStatus: true
      };
    }
    
    // Permission denied state
    if (permissionError && !hasPermission) {
      return {
        icon: MicOff,
        label: 'Permission Needed',
        description: 'WaveListener needs microphone access to mark your group ready',
        buttonText: 'Grant Permission',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        buttonColor: 'bg-red-600 hover:bg-red-700',
        showPermissionStatus: false,
        isPermissionAction: true
      };
    }
    
    // Has permission but not ready yet
    if (hasPermission) {
      return {
        icon: Clock,
        label: 'Not Ready',
        description: '✅ WaveListener ready! You can now mark your group as ready',
        buttonText: 'Mark Ready',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-200',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        showPermissionStatus: true
      };
    }
    
    // Default state (checking permissions)
    return {
      icon: Mic,
      label: 'Checking Permissions',
      description: 'Checking microphone access...',
      buttonText: 'Mark Ready',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50', 
      borderColor: 'border-gray-200',
      buttonColor: 'bg-gray-400 cursor-not-allowed',
      showPermissionStatus: false,
      disabled: true
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

      {/* Permission Status */}
      {status.showPermissionStatus && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-white/50 rounded border">
          <Mic className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600 font-medium">WaveListener Ready</span>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={status.isPermissionAction ? handleRequestPermission : handleToggleReady}
        disabled={status.disabled || isLoading || isRequestingPermission || (!status.isPermissionAction && !websocketService.isConnected())}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${status.buttonColor}`}
        data-testid={status.isPermissionAction ? "request-permission-button" : "leader-ready-toggle"}
      >
        {(isLoading || isRequestingPermission) ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isRequestingPermission ? 'Requesting Permission...' : 'Updating...'}
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

      {/* Permission Error Help */}
      {permissionError && !hasPermission && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="flex items-center gap-2 mb-2">
            <MicOff className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Microphone Access Required</span>
          </div>
          <p className="text-yellow-700 mb-2">
            WaveListener needs to access your microphone to participate in the session.
          </p>
          <p className="text-xs text-yellow-600">
            Look for a microphone icon in your browser&apos;s address bar, or check your browser settings to allow microphone access for this site.
          </p>
        </div>
      )}
    </div>
  );
}
