'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, Users, Wifi, WifiOff, Loader2, LogOut } from 'lucide-react'
import { useStudentStore } from '@/stores/student-store' // This store may need simplification as well
import { useAudioRecorder } from '@/features/audio-recording/hooks/use-audio-recorder'
import { useWebSocket } from '@/hooks/use-websocket'
import { wsService } from '@/lib/websocket'

interface SessionPageProps {
  params: { sessionId: string }
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const { student, session, group, logout } = useStudentStore()

  // WebSocket connection for the session
  const { isConnected, error: wsError } = useWebSocket({ sessionId: params.sessionId });

  // Refactored audio handler to stream via WebSocket
  const handleAudioChunk = useCallback((blob: Blob) => {
    if (!isConnected || !group) return;
    // Send raw audio blob over the websocket for the group
    wsService.sendGroupAudio(group.id, blob);
  }, [isConnected, group]);

  const {
    isRecording,
    audioLevel,
    error: audioError,
    startRecording,
    stopRecording,
  } = useAudioRecorder({
    onDataAvailable: handleAudioChunk,
    chunkSize: 2000, // 2-second chunks for lower latency
  });

  const toggleRecording = () => {
    if (session?.status !== 'active') return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleLeaveSession = () => {
    stopRecording();
    logout();
    router.push('/');
  };
  
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
              Group: <span className="font-semibold">{group.name}</span>
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
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Group Audio Capture</h2>
        <p className="text-gray-600 mb-8">This device is capturing audio for your group.</p>
        
        {/* Recording Button */}
        <button
          onClick={toggleRecording}
          disabled={session?.status !== 'active' || !isConnected}
          className={`touch-target rounded-full p-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 recording-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRecording ? (
            <MicOff className="h-16 w-16 text-white" />
          ) : (
            <Mic className="h-16 w-16 text-white" />
          )}
        </button>

        {/* Status Text */}
        <div className="mt-8 h-10">
          {audioError && <p className="text-red-600 font-medium">{audioError}</p>}
          {wsError && <p className="text-red-600 font-medium">{wsError}</p>}
          {!audioError && !wsError && (
             <>
              {session?.status === 'active' && isRecording && (
                <p className="text-green-600 font-medium">Recording audio for the group...</p>
              )}
              {session?.status === 'active' && !isRecording && (
                <p className="text-gray-600">Tap the microphone to start recording.</p>
              )}
              {session?.status !== 'active' && (
                <p className="text-yellow-600">Recording paused. Waiting for teacher to resume session.</p>
              )}
             </>
          )}
        </div>
      </main>
    </div>
  )
}
