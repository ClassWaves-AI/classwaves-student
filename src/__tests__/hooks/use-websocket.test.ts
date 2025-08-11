import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/use-websocket';
import { wsService } from '@/lib/websocket';

// Mock the WebSocket service
jest.mock('@/lib/websocket', () => ({
  wsService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    isConnected: jest.fn(),
    markLeaderReady: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

describe('useWebSocket Hook (Student)', () => {
  const mockCallbacks = {
    onConnect: jest.fn(),
    onDisconnect: jest.fn(),
    onGroupUpdate: jest.fn(),
    onTranscription: jest.fn(),
    onInsight: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (wsService.isConnected as jest.Mock).mockReturnValue(false);
  });

  it('should connect to WebSocket on mount', () => {
    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    expect(wsService.connect).toHaveBeenCalled();
  });

  it('should join session when sessionId is provided', () => {
    (wsService.isConnected as jest.Mock).mockReturnValue(true);

    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    expect(wsService.joinSession).toHaveBeenCalledWith('session-123');
  });

  it('should leave session when sessionId changes', () => {
    (wsService.isConnected as jest.Mock).mockReturnValue(true);

    const { rerender } = renderHook(
      ({ sessionId }) =>
        useWebSocket({
          sessionId,
          ...mockCallbacks,
        }),
      {
        initialProps: { sessionId: 'session-123' },
      }
    );

    expect(wsService.joinSession).toHaveBeenCalledWith('session-123');

    // Change session ID
    rerender({ sessionId: 'session-456' });

    expect(wsService.leaveSession).toHaveBeenCalled();
    expect(wsService.joinSession).toHaveBeenCalledWith('session-456');
  });

  it('should register event listeners on connect', () => {
    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    // Should register for relevant events
    expect(wsService.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(wsService.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(wsService.on).toHaveBeenCalledWith('group:update', expect.any(Function));
    expect(wsService.on).toHaveBeenCalledWith('group:status_changed', expect.any(Function));
    expect(wsService.on).toHaveBeenCalledWith('transcription:new', expect.any(Function));
    expect(wsService.on).toHaveBeenCalledWith('insight:new', expect.any(Function));
  });

  it('should handle group status updates', () => {
    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    // Get the registered event handler
    const statusUpdateCall = (wsService.on as jest.Mock).mock.calls.find(
      call => call[0] === 'group:status_changed'
    );
    const statusUpdateHandler = statusUpdateCall[1];

    // Simulate group status update
    const mockStatusUpdate = {
      groupId: 'group-123',
      status: 'ready',
      isReady: true,
    };

    act(() => {
      statusUpdateHandler(mockStatusUpdate);
    });

    expect(mockCallbacks.onGroupUpdate).toHaveBeenCalledWith(mockStatusUpdate);
  });

  it('should handle connection events', () => {
    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    // Get the connect handler
    const connectCall = (wsService.on as jest.Mock).mock.calls.find(
      call => call[0] === 'connect'
    );
    const connectHandler = connectCall[1];

    // Get the disconnect handler
    const disconnectCall = (wsService.on as jest.Mock).mock.calls.find(
      call => call[0] === 'disconnect'
    );
    const disconnectHandler = disconnectCall[1];

    // Simulate connection
    act(() => {
      connectHandler();
    });

    expect(mockCallbacks.onConnect).toHaveBeenCalled();

    // Simulate disconnection
    act(() => {
      disconnectHandler();
    });

    expect(mockCallbacks.onDisconnect).toHaveBeenCalled();
  });

  it('should handle transcription events', () => {
    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    // Get the transcription handler
    const transcriptionCall = (wsService.on as jest.Mock).mock.calls.find(
      call => call[0] === 'transcription:new'
    );
    const transcriptionHandler = transcriptionCall[1];

    const mockTranscription = {
      id: 'transcription-123',
      groupId: 'group-123',
      text: 'Hello world',
      timestamp: '2024-01-15T10:00:00Z',
      confidence: 0.95,
    };

    act(() => {
      transcriptionHandler(mockTranscription);
    });

    expect(mockCallbacks.onTranscription).toHaveBeenCalledWith(mockTranscription);
  });

  it('should handle insight events', () => {
    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    // Get the insight handler
    const insightCall = (wsService.on as jest.Mock).mock.calls.find(
      call => call[0] === 'insight:new'
    );
    const insightHandler = insightCall[1];

    const mockInsight = {
      id: 'insight-123',
      groupId: 'group-123',
      type: 'engagement',
      content: 'High engagement detected',
      timestamp: '2024-01-15T10:00:00Z',
    };

    act(() => {
      insightHandler(mockInsight);
    });

    expect(mockCallbacks.onInsight).toHaveBeenCalledWith(mockInsight);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    unmount();

    expect(wsService.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(wsService.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(wsService.off).toHaveBeenCalledWith('group:update', expect.any(Function));
    expect(wsService.off).toHaveBeenCalledWith('group:status_changed', expect.any(Function));
    expect(wsService.off).toHaveBeenCalledWith('transcription:new', expect.any(Function));
    expect(wsService.off).toHaveBeenCalledWith('insight:new', expect.any(Function));
  });

  it('should disconnect from WebSocket on unmount', () => {
    const { unmount } = renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    unmount();

    expect(wsService.disconnect).toHaveBeenCalled();
  });

  it('should handle session changes', () => {
    (wsService.isConnected as jest.Mock).mockReturnValue(true);

    const { rerender } = renderHook(
      ({ sessionId }) =>
        useWebSocket({
          sessionId,
          ...mockCallbacks,
        }),
      {
        initialProps: { sessionId: 'session-123' },
      }
    );

    expect(wsService.joinSession).toHaveBeenCalledWith('session-123');

    // Change to different session
    rerender({ sessionId: 'session-456' });

    expect(wsService.leaveSession).toHaveBeenCalled();
    expect(wsService.joinSession).toHaveBeenCalledWith('session-456');

    // Change to no session
    rerender({ sessionId: undefined });

    expect(wsService.leaveSession).toHaveBeenCalled();
  });

  it('should not join session when not connected', () => {
    (wsService.isConnected as jest.Mock).mockReturnValue(false);

    renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    expect(wsService.joinSession).not.toHaveBeenCalled();
  });

  it('should attempt to rejoin session when connection is restored', () => {
    const { rerender } = renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    // Initially not connected
    expect(wsService.joinSession).not.toHaveBeenCalled();

    // Connection restored
    (wsService.isConnected as jest.Mock).mockReturnValue(true);
    rerender();

    expect(wsService.joinSession).toHaveBeenCalledWith('session-123');
  });

  it('should provide current connection status', () => {
    (wsService.isConnected as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() =>
      useWebSocket({
        sessionId: 'session-123',
        ...mockCallbacks,
      })
    );

    expect(result.current.isConnected).toBe(true);

    // Connection lost
    (wsService.isConnected as jest.Mock).mockReturnValue(false);

    expect(result.current.isConnected).toBe(false);
  });

  it('should handle rapid session changes gracefully', () => {
    (wsService.isConnected as jest.Mock).mockReturnValue(true);

    const { rerender } = renderHook(
      ({ sessionId }) =>
        useWebSocket({
          sessionId,
          ...mockCallbacks,
        }),
      {
        initialProps: { sessionId: 'session-1' },
      }
    );

    expect(wsService.joinSession).toHaveBeenCalledWith('session-1');

    // Rapid session changes
    rerender({ sessionId: 'session-2' });
    rerender({ sessionId: 'session-3' });
    rerender({ sessionId: 'session-4' });

    // Should handle all changes
    expect(wsService.leaveSession).toHaveBeenCalledTimes(3);
    expect(wsService.joinSession).toHaveBeenLastCalledWith('session-4');
  });
});
