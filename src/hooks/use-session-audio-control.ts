'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudentStore } from '@/stores/student-store';
import { useAudioRecorder } from '@/features/audio-recording/hooks/use-audio-recorder';
import { wsService } from '@/lib/websocket';

interface SessionAudioControlState {
  isAutoStarting: boolean;
  countdown: number | null;
  isAutoRecording: boolean;
  autoStartError: string | null;
}

/**
 * Hook for managing automatic WaveListener start/stop based on session status
 * SG-ST-09: Auto-start WaveListener on session:status_changed → active with 3-2-1 countdown
 * SG-ST-13: Auto-end WaveListener on session end, group end, or page leave
 */
export function useSessionAudioControl() {
  const { session, group, isConnected } = useStudentStore();
  const [controlState, setControlState] = useState<SessionAudioControlState>({
    isAutoStarting: false,
    countdown: null,
    isAutoRecording: false,
    autoStartError: null,
  });
  
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRecorderRef = useRef<ReturnType<typeof useAudioRecorder> | null>(null);

  // Initialize audio recorder for auto-start (separate from manual controls)
  const autoAudioRecorder = useAudioRecorder({
    onDataAvailable: useCallback((blob: Blob) => {
      if (!isConnected || !group?.id) return;
      // Send audio data via WebSocket
      wsService.sendGroupAudio(group.id, blob, 'audio/webm;codecs=opus');
    }, [isConnected, group?.id]),
    chunkSize: 2000, // 2-second chunks
  });

  autoRecorderRef.current = autoAudioRecorder;

  // Clear countdown on unmount or when auto-start is cancelled
  const clearCountdown = useCallback(() => {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    setControlState(prev => ({
      ...prev,
      countdown: null,
      isAutoStarting: false,
    }));
  }, []);

  // Start countdown and auto-start sequence
  const startCountdownThenRecord = useCallback(async () => {
    console.log('🎬 Starting auto-WaveListener countdown...');
    
    setControlState(prev => ({
      ...prev,
      isAutoStarting: true,
      autoStartError: null,
    }));

    // 3-2-1 countdown
    const countdownSequence = [3, 2, 1];
    
    for (const count of countdownSequence) {
      setControlState(prev => ({ ...prev, countdown: count }));
      
      // Wait 1 second between counts
      await new Promise(resolve => {
        countdownTimeoutRef.current = setTimeout(resolve, 1000);
      });
    }

    // Clear countdown display
    setControlState(prev => ({ ...prev, countdown: null }));

    try {
      // Check permissions one final time before starting
      if (!autoRecorderRef.current?.hasPermission) {
        throw new Error('Microphone permission not available');
      }

      // Start audio stream lifecycle
      if (group?.id) {
        wsService.startAudioStream(group.id);
        console.log('🎙️ Starting auto WaveListener recording...');
        
        await autoRecorderRef.current.startRecording();
        
        setControlState(prev => ({
          ...prev,
          isAutoRecording: true,
          isAutoStarting: false,
        }));

        console.log('✅ Auto WaveListener started successfully');
      }
    } catch (error) {
      console.error('❌ Auto WaveListener start failed:', error);
      
      setControlState(prev => ({
        ...prev,
        autoStartError: error instanceof Error ? error.message : 'Unknown error',
        isAutoStarting: false,
        countdown: null,
      }));

      // Report wavelistener:issue event for backend tracking
      if (group?.id && session?.id) {
        wsService.reportWaveListenerIssue(session.id, group.id, 'stream_failed');
      }
    }
  }, [group?.id, session?.id]);

  // Stop auto-recording
  const stopAutoRecording = useCallback(async () => {
    if (!controlState.isAutoRecording) return;

    try {
      console.log('⏹️ Stopping auto WaveListener recording...');
      
      // Stop recording
      await autoRecorderRef.current?.stopRecording();
      
      // End audio stream lifecycle
      if (group?.id) {
        wsService.endAudioStream(group.id);
      }

      setControlState(prev => ({
        ...prev,
        isAutoRecording: false,
      }));

      console.log('✅ Auto WaveListener stopped successfully');
    } catch (error) {
      console.error('❌ Auto WaveListener stop failed:', error);
    }
  }, [controlState.isAutoRecording, group?.id]);

  // Handle session status changes
  const handleSessionStatusChange = useCallback((status: string) => {
    console.log('📡 Session status changed:', status, { 
      groupIsReady: group?.isReady,
      hasPermission: autoRecorderRef.current?.hasPermission 
    });

    if (status === 'active' && group?.isReady && autoRecorderRef.current?.hasPermission) {
      // Auto-start conditions met: session active, group ready, permission granted
      if (!controlState.isAutoStarting && !controlState.isAutoRecording) {
        startCountdownThenRecord();
      }
    } else if (status === 'ended' || status === 'paused') {
      // Auto-end conditions met: session ended or paused
      clearCountdown();
      if (controlState.isAutoRecording) {
        stopAutoRecording();
      }
    }
  }, [group?.isReady, controlState.isAutoStarting, controlState.isAutoRecording, startCountdownThenRecord, clearCountdown, stopAutoRecording]);

  // SG-ST-13: Auto-end on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (controlState.isAutoRecording) {
        // Synchronously stop recording on page leave
        autoRecorderRef.current?.stopRecording();
        if (group?.id) {
          wsService.endAudioStream(group.id);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [controlState.isAutoRecording, group?.id]);

  // SG-ST-11: Monitor permission changes and device availability
  useEffect(() => {
    let permissionWatcher: PermissionStatus | null = null;
    let deviceChangeListener: (() => void) | null = null;

    const setupPermissionMonitoring = async () => {
      try {
        // Monitor microphone permission changes
        if ('permissions' in navigator) {
          permissionWatcher = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          const handlePermissionChange = () => {
            console.log('🎙️ Microphone permission changed:', permissionWatcher?.state);
            
            if (permissionWatcher?.state === 'denied' && controlState.isAutoRecording) {
              console.error('❌ Permission revoked during recording - stopping WaveListener');
              
              setControlState(prev => ({
                ...prev,
                autoStartError: 'Microphone permission was revoked. Please re-grant permission to continue.',
                isAutoRecording: false,
              }));

              // Report wavelistener:issue event
              if (group?.id && session?.id) {
                wsService.reportWaveListenerIssue(session.id, group.id, 'permission_revoked');
              }

              // Force stop recording
              autoRecorderRef.current?.stopRecording();
              if (group?.id) {
                wsService.endAudioStream(group.id);
              }
            }
          };

          permissionWatcher.addEventListener('change', handlePermissionChange);
        }

        // Monitor device changes (microphone disconnected, etc.)
        if ('mediaDevices' in navigator) {
          deviceChangeListener = () => {
            console.log('🔌 Media devices changed');
            
            // Check if microphone is still available
            navigator.mediaDevices.enumerateDevices().then(devices => {
              const audioInputs = devices.filter(device => device.kind === 'audioinput');
              
              if (audioInputs.length === 0 && controlState.isAutoRecording) {
                console.error('❌ No audio input devices available - stopping WaveListener');
                
                setControlState(prev => ({
                  ...prev,
                  autoStartError: 'Microphone device was disconnected. Please reconnect your microphone.',
                  isAutoRecording: false,
                }));

                // Report wavelistener:issue event
                if (group?.id && session?.id) {
                  wsService.reportWaveListenerIssue(session.id, group.id, 'device_error');
                }

                // Force stop recording
                autoRecorderRef.current?.stopRecording();
                if (group?.id) {
                  wsService.endAudioStream(group.id);
                }
              }
            }).catch(error => {
              console.error('Failed to enumerate devices:', error);
            });
          };

          navigator.mediaDevices.addEventListener('devicechange', deviceChangeListener);
        }
      } catch (error) {
        console.warn('Permission/device monitoring not available:', error);
      }
    };

    if (controlState.isAutoRecording) {
      setupPermissionMonitoring();
    }

    // Cleanup
    return () => {
      if (permissionWatcher && 'removeEventListener' in permissionWatcher) {
        permissionWatcher.removeEventListener('change', () => {});
      }
      if (deviceChangeListener && 'mediaDevices' in navigator) {
        navigator.mediaDevices.removeEventListener('devicechange', deviceChangeListener);
      }
    };
  }, [controlState.isAutoRecording, group?.id, session?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdown();
      if (controlState.isAutoRecording) {
        stopAutoRecording();
      }
    };
  }, [clearCountdown, controlState.isAutoRecording, stopAutoRecording]);

  return {
    // State
    isAutoStarting: controlState.isAutoStarting,
    countdown: controlState.countdown,
    isAutoRecording: controlState.isAutoRecording,
    autoStartError: controlState.autoStartError,
    
    // Audio recorder state
    audioLevel: autoRecorderRef.current?.audioLevel ?? 0,
    hasPermission: autoRecorderRef.current?.hasPermission ?? false,
    
    // Methods
    handleSessionStatusChange,
    stopAutoRecording,
    clearAutoStartError: useCallback(() => {
      setControlState(prev => ({ ...prev, autoStartError: null }));
    }, []),
  };
}
