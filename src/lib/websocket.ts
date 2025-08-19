import { io, Socket } from 'socket.io-client';

export interface SessionStatusChangedData {
  status: string;
  sessionId: string;
}

export interface GroupJoinedData {
  groupId: string;
  sessionId: string;
  groupInfo?: { name?: string };
  groupName?: string;
}

export interface GroupTranscriptionData {
  id: string;
  groupId: string;
  groupName: string;
  text: string;
  timestamp: string;
}

export interface GroupInsightData {
  groupId: string;
  insightType:
    | 'argumentation_quality'
    | 'collaboration_patterns'
    | 'conceptual_understanding'
    | 'topical_focus';
  message: string;
  severity: 'info' | 'warning' | 'success';
  timestamp: string;
}

interface GroupWebSocketEvents {
  // Connection
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: unknown) => void;
  
  // Session events
  onSessionJoined?: (data: { sessionId: string; status?: string }) => void;
  onSessionStatusChanged?: (data: SessionStatusChangedData) => void;
  
  // Group kiosk events
  onGroupJoined?: (data: GroupJoinedData) => void;
  onGroupReady?: (data: { groupId: string; sessionId: string }) => void;
  onGroupRecording?: (data: { groupId: string; isRecording: boolean }) => void;
  onGroupStatusChanged?: (data: { groupId: string; status: 'waiting' | 'ready' | 'recording' | 'error' }) => void;
  
  // Real-time updates (group-focused)
  onGroupTranscriptionReceived?: (data: GroupTranscriptionData) => void;
  
  onGroupInsightReceived?: (data: GroupInsightData) => void;

  // Audio streaming events
  onAudioStreamStart?: (data: { groupId: string }) => void;
  onAudioStreamEnd?: (data: { groupId: string }) => void;
  onAudioError?: (data: { groupId: string; error: string }) => void;
}

class GroupKioskWebSocketService {
  private socket: Socket | null = null;
  private events: GroupWebSocketEvents = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  connect(token: string, events: GroupWebSocketEvents) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.events = events;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.events.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.events.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.events.onError?.('Failed to connect after multiple attempts');
      } else {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
      }
    });

    this.socket.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
      this.events.onError?.(error);
    });

    // Session events
    this.socket.on('session:status_changed', (data: SessionStatusChangedData) => {
      console.log('Session status changed:', data);
      this.events.onSessionStatusChanged?.(data);
    });

    // Student session join confirmation
    this.socket.on('student:session:joined', (data: { sessionId: string; groupId: string; groupName: string }) => {
      console.log('Student successfully joined session and group:', data);
    });

    // Group kiosk events
    this.socket.on('group:joined', (data: GroupJoinedData) => {
      console.log('Group joined:', data);
      this.events.onGroupJoined?.(data);
    });

    this.socket.on('group:ready', (data: { groupId: string; sessionId: string }) => {
      console.log('Group ready:', data);
      this.events.onGroupReady?.(data);
    });

    this.socket.on('group:recording', (data: { groupId: string; isRecording: boolean }) => {
      console.log('Group recording status:', data);
      this.events.onGroupRecording?.(data);
    });

    this.socket.on('group:status_changed', (data: { groupId: string; status: 'waiting' | 'ready' | 'recording' | 'error' }) => {
      console.log('Group status changed:', data);
      this.events.onGroupStatusChanged?.(data);
    });

    // Real-time group content
    this.socket.on('transcription:group:new', (data: GroupTranscriptionData) => {
      console.log('Group transcription received:', data);
      this.events.onGroupTranscriptionReceived?.(data);
    });

    this.socket.on('insight:group:new', (data: GroupInsightData) => {
      console.log('Group insight received:', data);
      this.events.onGroupInsightReceived?.(data);
    });

    // Audio streaming events
    this.socket.on('audio:stream:start', (data: { groupId: string }) => {
      console.log('Audio stream started:', data);
      this.events.onAudioStreamStart?.(data);
    });

    this.socket.on('audio:stream:end', (data: { groupId: string }) => {
      console.log('Audio stream ended:', data);
      this.events.onAudioStreamEnd?.(data);
    });

    this.socket.on('audio:error', (data: { groupId: string; error: string }) => {
      console.log('Audio error:', data);
      this.events.onAudioError?.(data);
    });
  }

  // Group kiosk emitters
  joinSession(sessionId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    // Use student-specific session join event
    this.socket.emit('student:session:join', { sessionId });
    this.events.onSessionJoined?.({ sessionId });
  }

  leaveSession(sessionId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('session:leave', { sessionId });
  }

  joinGroupSession(groupId: string, sessionId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('group:join', { groupId, sessionId });
  }

  leaveGroupSession(groupId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('group:leave', { groupId });
  }

  updateGroupStatus(groupId: string, isReady: boolean) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('group:status_update', { groupId, isReady });
  }

  // New method for leader ready functionality as per SOW requirements
  markLeaderReady(sessionId: string, groupId: string, ready: boolean) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('group:leader_ready', { sessionId, groupId, ready });
  }

  // Audio streaming emitters
  startAudioStream(groupId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('audio:stream:start', { groupId });
  }

  sendAudioChunk(groupId: string, audioData: ArrayBuffer, mimeType: string = 'audio/webm;codecs=opus') {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('audio:chunk', { 
      groupId, 
      audioData, 
      format: mimeType,
      timestamp: Date.now()
    });
  }

  endAudioStream(groupId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    this.socket.emit('audio:stream:end', { groupId });
  }

  async sendGroupAudio(groupId: string, blob: Blob, mimeType: string = 'audio/webm;codecs=opus') {
    const arrayBuffer = await blob.arrayBuffer();
    this.sendAudioChunk(groupId, arrayBuffer, mimeType);
  }

  // Stubs to satisfy hook API
  updateMuteStatus(isMuted: boolean) {
    void isMuted;
  }
  startSpeaking() {
    // no-op for now
  }
  stopSpeaking() {
    // no-op for now
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const groupKioskWebSocket = new GroupKioskWebSocketService();
// Aliases for compatibility with hooks/pages
export const wsService = groupKioskWebSocket;
export const websocketService = groupKioskWebSocket;