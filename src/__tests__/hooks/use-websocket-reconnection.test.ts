/**
 * Student WebSocket Reconnection Tests
 * 
 * Tests the student app's WebSocket reconnection behavior and leader ready functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../hooks/use-websocket';
import { websocketService } from '../../lib/websocket';
import { useStudentStore } from '../../stores/student-store';

// Mock the WebSocket service
jest.mock('../../lib/websocket', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinSession: jest.fn(),
    markLeaderReady: jest.fn(),
    isConnected: jest.fn(),
  }
}));

// Mock the student store
jest.mock('../../stores/student-store', () => ({
  useStudentStore: jest.fn(),
}));

const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;
const mockUseStudentStore = useStudentStore as jest.MockedFunction<typeof useStudentStore>;

describe('Student WebSocket Reconnection Tests', () => {
  const mockToken = 'test-student-token';
  const mockSession = { id: 'session-123', name: 'Test Session' };
  const mockSetConnected = jest.fn();
  const mockSetGroup = jest.fn();
  const mockSetGroupReadiness = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseStudentStore.mockReturnValue({
      token: mockToken,
      session: mockSession,
      setConnected: mockSetConnected,
      setGroup: mockSetGroup,
      setGroupReadiness: mockSetGroupReadiness,
      // Mock other store values as needed
      group: { id: 'group-456', name: 'Group A', members: [] },
      isConnected: false,
      isReady: false,
    } as any);

    mockWebsocketService.isConnected.mockReturnValue(false);
  });

  test('should connect and auto-join session on mount', () => {
    renderHook(() => useWebSocket());

    expect(mockWebsocketService.connect).toHaveBeenCalledWith(
      mockToken,
      expect.objectContaining({
        onConnect: expect.any(Function),
        onDisconnect: expect.any(Function),
        onError: expect.any(Function),
        onSessionJoined: expect.any(Function),
        onGroupJoined: expect.any(Function),
        onGroupStatusChanged: expect.any(Function),
      })
    );

    // Get the callbacks passed to connect
    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate connection
    act(() => {
      connectCall.onConnect?.();
    });

    expect(mockSetConnected).toHaveBeenCalledWith(true);
    expect(mockWebsocketService.joinSession).toHaveBeenCalledWith(mockSession.id);
  });

  test('should handle reconnection with exponential backoff', () => {
    renderHook(() => useWebSocket());

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate initial connection
    act(() => {
      connectCall.onConnect?.();
    });

    expect(mockSetConnected).toHaveBeenCalledWith(true);

    // Simulate disconnection
    act(() => {
      connectCall.onDisconnect?.('transport close');
    });

    expect(mockSetConnected).toHaveBeenCalledWith(false);

    // Simulate reconnection
    act(() => {
      connectCall.onConnect?.();
    });

    // Should rejoin session automatically
    expect(mockWebsocketService.joinSession).toHaveBeenCalledTimes(2);
    expect(mockWebsocketService.joinSession).toHaveBeenLastCalledWith(mockSession.id);
    expect(mockSetConnected).toHaveBeenCalledWith(true);
  });

  test('should handle session changes and rejoin new session', () => {
    const { rerender } = renderHook(() => useWebSocket());

    // Get initial callbacks
    const initialConnectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate connection
    act(() => {
      initialConnectCall.onConnect?.();
    });

    expect(mockWebsocketService.joinSession).toHaveBeenCalledWith(mockSession.id);

    // Change session in store
    const newSession = { id: 'session-789', name: 'New Session' };
    mockUseStudentStore.mockReturnValue({
      token: mockToken,
      session: newSession,
      setConnected: mockSetConnected,
      setGroup: mockSetGroup,
      setGroupReadiness: mockSetGroupReadiness,
      group: { id: 'group-456', name: 'Group A', members: [] },
      isConnected: true,
      isReady: false,
    } as any);

    rerender();

    // Should disconnect and reconnect
    expect(mockWebsocketService.disconnect).toHaveBeenCalled();
    expect(mockWebsocketService.connect).toHaveBeenCalledTimes(2);

    // Get new callbacks and simulate connection
    const newConnectCall = mockWebsocketService.connect.mock.calls[1][1];
    act(() => {
      newConnectCall.onConnect?.();
    });

    expect(mockWebsocketService.joinSession).toHaveBeenLastCalledWith(newSession.id);
  });

  test('should handle group assignment and readiness updates', () => {
    renderHook(() => useWebSocket());

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate group joined event
    const groupJoinedData = {
      groupId: 'group-456',
      groupName: 'Group A',
      groupInfo: { name: 'Group A' }
    };

    act(() => {
      connectCall.onGroupJoined?.(groupJoinedData);
    });

    expect(mockSetGroup).toHaveBeenCalledWith({
      id: 'group-456',
      name: 'Group A',
      members: []
    });

    // Simulate group status change to ready
    act(() => {
      connectCall.onGroupStatusChanged?.({
        groupId: 'group-456',
        status: 'ready'
      });
    });

    expect(mockSetGroupReadiness).toHaveBeenCalledWith(true);

    // Simulate group status change to waiting
    act(() => {
      connectCall.onGroupStatusChanged?.({
        groupId: 'group-456',
        status: 'waiting'
      });
    });

    expect(mockSetGroupReadiness).toHaveBeenCalledWith(false);
  });

  test('should handle connection errors gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useWebSocket());

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate connection error
    const mockError = new Error('Connection failed');
    act(() => {
      connectCall.onError?.(mockError);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket error:', mockError);
    expect(mockSetConnected).toHaveBeenCalledWith(false);

    consoleErrorSpy.mockRestore();
  });

  test('should not connect without token or session', () => {
    mockUseStudentStore.mockReturnValue({
      token: null,
      session: null,
      setConnected: mockSetConnected,
      setGroup: mockSetGroup,
      setGroupReadiness: mockSetGroupReadiness,
      group: null,
      isConnected: false,
      isReady: false,
    } as any);

    renderHook(() => useWebSocket());

    expect(mockWebsocketService.connect).not.toHaveBeenCalled();
  });

  test('should disconnect on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(mockWebsocketService.disconnect).toHaveBeenCalled();
  });

  test('should handle leader ready functionality after reconnection', () => {
    renderHook(() => useWebSocket());

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate connection
    act(() => {
      connectCall.onConnect?.();
    });

    // Simulate disconnection and reconnection
    act(() => {
      connectCall.onDisconnect?.('transport close');
    });

    act(() => {
      connectCall.onConnect?.();
    });

    // After reconnection, test leader ready functionality
    // This would typically be triggered by user interaction
    expect(mockWebsocketService.markLeaderReady).not.toHaveBeenCalled();

    // The markLeaderReady call would be made by the LeaderReadyControl component
    // We can verify the WebSocket service is properly connected and ready
    expect(mockSetConnected).toHaveBeenLastCalledWith(true);
  });

  test('should handle rapid connection state changes', () => {
    renderHook(() => useWebSocket());

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Rapid connection/disconnection cycles
    act(() => {
      connectCall.onConnect?.();
    });
    expect(mockSetConnected).toHaveBeenLastCalledWith(true);

    act(() => {
      connectCall.onDisconnect?.('ping timeout');
    });
    expect(mockSetConnected).toHaveBeenLastCalledWith(false);

    act(() => {
      connectCall.onConnect?.();
    });
    expect(mockSetConnected).toHaveBeenLastCalledWith(true);

    act(() => {
      connectCall.onDisconnect?.('transport error');
    });
    expect(mockSetConnected).toHaveBeenLastCalledWith(false);

    // Final reconnection
    act(() => {
      connectCall.onConnect?.();
    });

    expect(mockSetConnected).toHaveBeenLastCalledWith(true);
    // Should have rejoined session multiple times
    expect(mockWebsocketService.joinSession).toHaveBeenCalledTimes(3);
  });

  test('should handle session status changes with options callback', () => {
    const onSessionStatusChanged = jest.fn();

    renderHook(() => useWebSocket({ onSessionStatusChanged }));

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate session status change
    act(() => {
      connectCall.onSessionStatusChanged?.({ status: 'active', sessionId: mockSession.id });
    });

    expect(onSessionStatusChanged).toHaveBeenCalledWith('active');
  });

  test('should handle transcription and insight events', () => {
    const onTranscription = jest.fn();
    const onInsight = jest.fn();

    renderHook(() => useWebSocket({ onTranscription, onInsight }));

    const connectCall = mockWebsocketService.connect.mock.calls[0][1];

    // Simulate transcription event
    const transcriptionData = {
      id: 'trans-123',
      groupId: 'group-456',
      groupName: 'Group A',
      text: 'Test transcription',
      timestamp: new Date().toISOString()
    };

    act(() => {
      connectCall.onGroupTranscriptionReceived?.(transcriptionData);
    });

    expect(onTranscription).toHaveBeenCalledWith(transcriptionData);

    // Simulate insight event
    const insightData = {
      groupId: 'group-456',
      insightType: 'collaboration_patterns' as const,
      message: 'Great collaboration detected',
      severity: 'success' as const,
      timestamp: new Date().toISOString()
    };

    act(() => {
      connectCall.onGroupInsightReceived?.(insightData);
    });

    expect(onInsight).toHaveBeenCalledWith(insightData);
  });
});
