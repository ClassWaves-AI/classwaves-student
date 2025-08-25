'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Wifi, WifiOff, Loader2, LogOut } from 'lucide-react'
import { useStudentStore } from '@/stores/student-store' // This store may need simplification as well
import { useAudioRecorder } from '@/features/audio-recording/hooks/use-audio-recorder'
import { useWebSocket } from '@/hooks/use-websocket'
import { useSessionAudioControl } from '@/hooks/use-session-audio-control'
import { wsService } from '@/lib/websocket'
import { LeaderReadyControl } from '@/components/LeaderReadyControl'
import { CountdownOverlay, WaveListenerStatus } from '@/components/CountdownOverlay'
import { WaveListenerControls, WaveListenerToggle } from '@/components/WaveListenerControls'
import { RejoinSessionModal } from '@/components/RejoinSessionModal'
import { WaveListenerHints } from '@/components/WaveListenerHints'
import { useSessionPersistence } from '@/hooks/use-session-persistence'

interface SessionPageProps {
  params: { sessionId: string }
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const { student, session, group, logout } = useStudentStore()
  
  // Session persistence state (SG-ST-14)
  const [showRejoinModal, setShowRejoinModal] = useState(false)
  const [rejoinableSession, setRejoinableSession] = useState<any>(null)
  const [isRejoining, setIsRejoining] = useState(false)
  const { checkForRejoinableSession, clearPersistedSession } = useSessionPersistence()

  // Auto-start audio control (SG-ST-09, SG-ST-10, SG-ST-11, SG-ST-12, SG-ST-13)
  const {
    isAutoStarting,
    countdown,
    isAutoRecording,
    autoStartError,
    audioLevel,
    hasPermission,
    handleSessionStatusChange,
    stopAutoRecording,
    clearAutoStartError,
  } = useSessionAudioControl();

  // WebSocket connection with auto-start integration
  const { isConnected } = useWebSocket({
    onSessionStatusChanged: handleSessionStatusChange,
  });

  // Fallback manual audio recorder (for manual control when needed)
  const handleAudioChunk = useCallback((blob: Blob) => {
    if (!isConnected || !group) return;
    wsService.sendGroupAudio(group.id, blob, 'audio/webm;codecs=opus');
  }, [isConnected, group]);

  const {
    isRecording: isManualRecording,
    error: audioError,
    startRecording: startManualRecording,
    stopRecording: stopManualRecording,
  } = useAudioRecorder({
    onDataAvailable: handleAudioChunk,
    chunkSize: 2000,
  });

  // Manual recording controls (fallback)
  const handleManualStart = useCallback(async () => {
    if (session?.status !== 'active' || !group?.id) return;
    
    wsService.startAudioStream(group.id);
    await startManualRecording();
  }, [session?.status, group?.id, startManualRecording]);

  const handleManualStop = useCallback(async () => {
    if (!group?.id) return;
    
    wsService.endAudioStream(group.id);
    await stopManualRecording();
  }, [group?.id, stopManualRecording]);

  // Auto-recording control handlers
  const handlePause = useCallback(async () => {
    // TODO: Implement pause functionality in useSessionAudioControl
    setIsPaused(true);
    console.log('Pause functionality - to be implemented');
  }, []);

  const handleResume = useCallback(async () => {
    setIsPaused(false);
    console.log('Resume functionality - to be implemented');
  }, []);

  const handleStop = useCallback(async () => {
    await stopAutoRecording();
    setIsPaused(false);
  }, [stopAutoRecording]);

  const handleLeaveSession = useCallback(() => {
    // Stop any active recordings
    if (isAutoRecording) {
      stopAutoRecording();
    }
    if (isManualRecording) {
      stopManualRecording();
    }
    
    // Clear persisted session since user is intentionally leaving
    clearPersistedSession();
    logout();
    router.push('/');
  }, [isAutoRecording, isManualRecording, stopAutoRecording, stopManualRecording, clearPersistedSession, logout, router]);

  // Session persistence handlers (SG-ST-14)
  const handleRejoinSession = useCallback(async (sessionData: any) => {
    setIsRejoining(true);
    try {
      // Navigate to the persisted session
      router.push(`/session/${sessionData.sessionId}`);
      setShowRejoinModal(false);
    } catch (error) {
      console.error('Failed to rejoin session:', error);
      setIsRejoining(false);
    }
  }, [router]);

  const handleStartNewSession = useCallback(() => {
    clearPersistedSession();
    setShowRejoinModal(false);
    setRejoinableSession(null);
    // Stay on current session - user chose to start fresh
  }, [clearPersistedSession]);

  const handleCloseRejoinModal = useCallback(() => {
    setShowRejoinModal(false);
    setRejoinableSession(null);
  }, []);
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Check for rejoinable sessions on mount (SG-ST-14)
  useEffect(() => {
    const checkRejoinable = () => {
      const rejoinable = checkForRejoinableSession();
      if (rejoinable && rejoinable.sessionId !== params.sessionId) {
        setRejoinableSession(rejoinable);
        setShowRejoinModal(true);
      }
    };
    
    // Small delay to ensure other initialization is complete
    setTimeout(checkRejoinable, 1000);
  }, [checkForRejoinableSession, params.sessionId]);

  // Redirect if not properly joined
  useEffect(() => {
    if (!student || !session || !group) {
      router.push('/');
    }
  }, [student, session, group, router]);

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2">Joining group...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-medium text-gray-900">{session?.title}</h1>
            <p className="text-sm text-gray-600">
              Session: <span className="font-mono">{params.sessionId}</span> • Group: <span className="font-semibold">{group.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm">
                {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-yellow-600" />}
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={handleLeaveSession}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-8">
        {/* Leader Ready Control */}
        <LeaderReadyControl data-testid="leader-ready-control" />
        
        {/* WaveListener Section */}
        <div className="flex flex-col items-center">
          <Users className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">WaveListener</h2>
          <p className="text-gray-600 mb-4">
            AI-powered audio assistant that starts automatically when the session begins.
          </p>
          
          {/* Helpful Hints for WaveListener Usage (SG-UX-03) */}
          <WaveListenerHints
            variant="tips-only"
            isRecording={isAutoRecording || !!autoStartError}
            permissionStatus={hasPermission ? 'granted' : 'prompt'}
            className="mb-4"
          />
        
          {/* Auto-start WaveListener or Manual Toggle */}
          {session?.status === 'active' && group?.isReady ? (
            <div className="text-center">
              <div className="text-lg font-medium text-green-700 mb-2">
                Auto-Recording Active
              </div>
              <p className="text-sm text-gray-600 mb-4">
                WaveListener started automatically when the session began
              </p>
            </div>
          ) : (
            <WaveListenerToggle
              isAutoRecording={isAutoRecording || isManualRecording}
              hasPermission={hasPermission}
              isGroupReady={group?.isReady ?? false}
              sessionStatus={session?.status ?? 'pending'}
              onManualStart={handleManualStart}
              onManualStop={isAutoRecording ? handleStop : handleManualStop}
              disabled={!isConnected}
            />
          )}

          {/* Status Text */}
          <div className="mt-8 h-10">
            {(audioError || autoStartError) && (
              <div className="text-center">
                <p className="text-red-600 font-medium">{audioError || autoStartError}</p>
                {autoStartError && (
                  <button
                    onClick={clearAutoStartError}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
            
            {!audioError && !autoStartError && (
              <>
                {(isAutoRecording || isManualRecording) && (
                  <p className="text-green-600 font-medium">
                    🎙️ WaveListener is capturing audio for AI analysis...
                  </p>
                )}
                {session?.status === 'active' && !isAutoRecording && !isManualRecording && group?.isReady && (
                  <p className="text-gray-600">
                    WaveListener will start automatically, or tap to start manually.
                  </p>
                )}
                {session?.status !== 'active' && (
                  <p className="text-yellow-600">
                    Waiting for teacher to start the session...
                  </p>
                )}
                {!group?.isReady && session?.status === 'active' && (
                  <p className="text-orange-600">
                    Mark your group as ready to enable WaveListener.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Auto-start Overlays and Controls */}
      <CountdownOverlay countdown={countdown} isVisible={isAutoStarting} />
      
      <WaveListenerStatus
        isAutoRecording={isAutoRecording}
        isAutoStarting={isAutoStarting}
        audioLevel={audioLevel}
        autoStartError={autoStartError}
      />

      <WaveListenerControls
        isAutoRecording={isAutoRecording}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        disabled={!isConnected}
      />

      {/* Session Persistence Modal (SG-ST-14) */}
      <RejoinSessionModal
        isOpen={showRejoinModal}
        sessionData={rejoinableSession}
        onRejoin={handleRejoinSession}
        onStartNew={handleStartNewSession}
        onClose={handleCloseRejoinModal}
        isRejoining={isRejoining}
      />
    </div>
  )
}
