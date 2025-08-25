'use client';

import { useState, useCallback, useEffect } from 'react';
import { Crown, CheckCircle, Clock, AlertCircle, Mic, MicOff } from 'lucide-react';
import { websocketService } from '@/lib/websocket';
import { useStudentStore } from '@/stores/student-store';
import { useAudioRecorder } from '@/features/audio-recording/hooks/use-audio-recorder';
import { PermissionRequestModal } from './PermissionRequestModal';
import { PermissionProgress } from './ProgressIndicator';
import { WaveListenerInfoModal, WaveListenerHelpIcon } from './WaveListenerInfoModal';

interface LeaderReadyControlProps {
  'data-testid'?: string;
}

export function LeaderReadyControl({ 'data-testid': testId }: LeaderReadyControlProps) {
  const { student, session, group, setGroupReadiness } = useStudentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  // Modal states for enhanced UX (SG-ST-01, SG-ST-04, SG-ST-05, SG-ST-15, SG-ST-16)
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionModalStage, setPermissionModalStage] = useState<'explanation' | 'request' | 'success' | 'denied'>('explanation');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStep, setProgressStep] = useState<'requesting' | 'processing' | 'ready' | 'error'>('requesting');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // SG-ST-02: Use audio recorder for permission management
  const { hasPermission, error: permissionError, requestPermission } = useAudioRecorder();
  
  // SG-ST-02: Proactively check mic permission on component mount and check if first-time user
  useEffect(() => {
    requestPermission();
    
    // Check if user has seen WaveListener info before (SG-ST-15)
    const hasSeenInfo = localStorage.getItem('wavelistener-info-seen');
    if (!hasSeenInfo) {
      setIsFirstTimeUser(true);
    }
  }, [requestPermission]);

  const handleToggleReady = useCallback(async () => {
    if (!session?.id || !group?.id || !student?.id) {
      console.error('Missing required data for leader ready toggle');
      return;
    }

    const newReadyState = !group.isReady;
    
    // SG-ST-03: Require mic permission before marking Ready=true with enhanced modal flow
    if (newReadyState && !hasPermission) {
      // SG-ST-01: Show explanation modal first if first-time user
      if (isFirstTimeUser) {
        setShowInfoModal(true);
        return;
      }
      
      // Show permission request modal for returning users
      setPermissionModalStage('explanation');
      setShowPermissionModal(true);
      return;
    }

    // If already has permission or marking not ready, proceed directly
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
  }, [session?.id, group?.id, group?.isReady, student?.id, setGroupReadiness, hasPermission, isFirstTimeUser]);

  // Enhanced permission request with progress indicators (SG-ST-06, SG-ST-08)
  const handleRequestPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    setShowProgress(true);
    setProgressStep('requesting');
    
    try {
      await requestPermission();
      setProgressStep('processing');
      
      // Small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (hasPermission) {
        setProgressStep('ready');
        setPermissionModalStage('success');
        
        // Auto-close progress after success
        setTimeout(() => {
          setShowProgress(false);
        }, 1500);
      } else {
        setProgressStep('error');
        setPermissionModalStage('denied');
        setShowProgress(false);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setProgressStep('error');
      setPermissionModalStage('denied');
      setShowProgress(false);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [requestPermission, hasPermission]);

  // Handle modal interactions
  const handleClosePermissionModal = useCallback(() => {
    setShowPermissionModal(false);
    setShowProgress(false);
    setPermissionModalStage('explanation');
  }, []);

  const handleCloseInfoModal = useCallback(() => {
    setShowInfoModal(false);
    setIsFirstTimeUser(false);
    localStorage.setItem('wavelistener-info-seen', 'true');
    
    // After first-time info, still need to check permission
    if (!hasPermission) {
      setPermissionModalStage('explanation');
      setShowPermissionModal(true);
    }
  }, [hasPermission]);

  const handleShowInfo = useCallback(() => {
    setShowInfoModal(true);
  }, []);

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
      {/* Header with help icon (SG-ST-16) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Group Leader</h3>
            <p className="text-sm text-gray-600">You are the leader of {group?.name}</p>
          </div>
        </div>
        <WaveListenerHelpIcon onClick={handleShowInfo} />
      </div>

      {/* Status Display with optional progress indicator (SG-ST-08) */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <StatusIcon className={`h-5 w-5 ${status.color}`} />
          <div>
            <p className={`font-medium ${status.color}`}>{status.label}</p>
            <p className="text-sm text-gray-600">{status.description}</p>
          </div>
        </div>
        
        {showProgress && (
          <div className="mt-3 p-3 bg-white/50 rounded border">
            <PermissionProgress 
              currentStep={progressStep} 
              error={permissionError || undefined}
            />
          </div>
        )}
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
      
      {/* Enhanced Modal System (SG-ST-01, SG-ST-04, SG-ST-05, SG-ST-15, SG-ST-16) */}
      <PermissionRequestModal
        isOpen={showPermissionModal}
        onClose={handleClosePermissionModal}
        onRequestPermission={handleRequestPermission}
        isRequestingPermission={isRequestingPermission}
        permissionError={permissionError}
        stage={permissionModalStage}
      />
      
      <WaveListenerInfoModal
        isOpen={showInfoModal}
        onClose={handleCloseInfoModal}
        mode={isFirstTimeUser ? 'first-time' : 'help'}
      />
    </div>
  );
}
