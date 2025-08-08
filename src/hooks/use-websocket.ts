import { useEffect, useCallback } from 'react';
import { websocketService } from '@/lib/websocket';
import { useStudentStore } from '@/stores/student-store';

interface UseWebSocketOptions {
  onSessionStatusChanged?: (status: string) => void;
  onGroupAssigned?: (group: { id: string; name: string }) => void;
  onTranscription?: (data: any) => void;
  onInsight?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, session, setConnected, setGroup } = useStudentStore();

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
        options.onSessionStatusChanged?.(data.status);
      },
      
      onGroupAssigned: (data) => {
        setGroup({
          id: data.groupId,
          name: data.groupName,
          members: []
        });
        options.onGroupAssigned?.(data);
      },
      
      onTranscriptionReceived: options.onTranscription,
      onInsightReceived: options.onInsight,
    });

    // Cleanup on unmount
    return () => {
      if (session?.id) {
        websocketService.leaveSession(session.id);
      }
      websocketService.disconnect();
      setConnected(false);
    };
  }, [token, session?.id]);

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