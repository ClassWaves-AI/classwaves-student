import { useEffect, useCallback } from 'react';
import { websocketService, GroupJoinedData } from '@/lib/websocket';
import { useStudentStore } from '@/stores/student-store';

interface UseWebSocketOptions {
  onSessionStatusChanged?: (status: string) => void;
  onGroupAssigned?: (group: { id: string; name: string }) => void;
  onTranscription?: (data: unknown) => void;
  onInsight?: (data: unknown) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, session, setConnected, setGroup, setGroupReadiness } = useStudentStore();

  // Handle connection
  useEffect(() => {
    if (!token || !session) {
      console.log('No token or session, skipping WebSocket connection');
      return;
    }

    console.log('Connecting to WebSocket...');

    websocketService.connect(token, {
      onConnect: () => {
        console.log('WebSocket connected successfully');
        setConnected(true);
        
        // Join the session room
        if (session?.id) {
          websocketService.joinSession(session.id);
        }
      },
      
      onDisconnect: (reason) => {
        console.log('WebSocket disconnected:', reason);
        setConnected(false);
      },
      
      onError: (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      },
      
      onSessionJoined: (data) => {
        console.log('Successfully joined session:', data);
      },
      
      onSessionStatusChanged: (data) => {
        options.onSessionStatusChanged?.((data as { status: string }).status);
      },
      
      onGroupJoined: (data: GroupJoinedData) => {
        setGroup({
          id: data.groupId,
          name: data.groupName ?? data.groupInfo?.name ?? 'Group',
          members: []
        });
        options.onGroupAssigned?.({ id: data.groupId, name: data.groupName ?? data.groupInfo?.name ?? 'Group' });
      },
      
      onGroupStatusChanged: (data) => {
        // Update group readiness based on status
        // According to SOW: ready status means leader has marked ready
        const isReady = data.status === 'ready' || data.status === 'recording';
        setGroupReadiness(isReady);
      },
      
      // Support both naming conventions
      onGroupTranscriptionReceived: options.onTranscription,
      onGroupInsightReceived: options.onInsight,
    });

    // Cleanup on unmount
    return () => {
      if (session?.id) {
        websocketService.leaveSession(session.id);
      }
      websocketService.disconnect();
      setConnected(false);
    };
    // Include relevant deps to satisfy lint without over-subscribing
  }, [token, session, setConnected, setGroup, setGroupReadiness, options]);

  // Mute/unmute functions
  const updateMuteStatus = useCallback((isMuted: boolean) => {
    websocketService.updateMuteStatus(isMuted);
  }, []);

  const startSpeaking = useCallback(() => {
    websocketService.startSpeaking();
  }, []);

  const stopSpeaking = useCallback(() => {
    websocketService.stopSpeaking();
  }, []);

  return {
    isConnected: websocketService.isConnected(),
    updateMuteStatus,
    startSpeaking,
    stopSpeaking,
  };
}