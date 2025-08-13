import { renderHook, act } from '@testing-library/react';
import { useStudentStore } from '@/stores/student-store';

// Mock any external dependencies if needed
jest.mock('@/lib/websocket', () => ({
  websocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
  },
}));

describe('Student Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useStudentStore());
    act(() => {
      result.current.reset?.();
    });
  });

  it('should set group readiness correctly', () => {
    const { result } = renderHook(() => useStudentStore());

    // Initially, group should not be ready
    expect(result.current.group?.isReady).toBeFalsy();

    act(() => {
      result.current.setGroupReadiness(true);
    });

    expect(result.current.group?.isReady).toBe(true);

    act(() => {
      result.current.setGroupReadiness(false);
    });

    expect(result.current.group?.isReady).toBe(false);
  });

  it('should track leader status correctly', () => {
    const { result } = renderHook(() => useStudentStore());

    // Set up student as leader
    act(() => {
      result.current.setStudent?.({
        id: 'student-123',
        name: 'John Doe',
        sessionId: 'session-456',
      });

      result.current.setGroup?.({
        id: 'group-789',
        name: 'Group A',
        isLeader: true,
        isReady: false,
        members: ['student-123', 'student-124'],
      });
    });

    expect(result.current.group?.isLeader).toBe(true);
    expect(result.current.group?.id).toBe('group-789');
    expect(result.current.group?.name).toBe('Group A');
  });

  it('should handle WebSocket readiness events', () => {
    const { result } = renderHook(() => useStudentStore());

    // Set up initial state
    act(() => {
      result.current.setGroup?.({
        id: 'group-789',
        name: 'Group A',
        isLeader: true,
        isReady: false,
        members: ['student-123', 'student-124'],
      });
    });

    // Simulate WebSocket readiness event
    act(() => {
      result.current.handleGroupReadinessUpdate?.({
        groupId: 'group-789',
        isReady: true,
        status: 'ready',
      });
    });

    expect(result.current.group?.isReady).toBe(true);
  });

  it('should maintain session state', () => {
    const { result } = renderHook(() => useStudentStore());

    const sessionData = {
      id: 'session-456',
      topic: 'Math Class',
      status: 'active',
    };

    act(() => {
      result.current.setSession?.(sessionData);
    });

    expect(result.current.session).toEqual(sessionData);
  });

  it('should maintain student state', () => {
    const { result } = renderHook(() => useStudentStore());

    const studentData = {
      id: 'student-123',
      name: 'John Doe',
      sessionId: 'session-456',
    };

    act(() => {
      result.current.setStudent?.(studentData);
    });

    expect(result.current.student).toEqual(studentData);
  });

  it('should handle group assignment', () => {
    const { result } = renderHook(() => useStudentStore());

    const groupData = {
      id: 'group-789',
      name: 'Group A',
      isLeader: false,
      isReady: false,
      members: ['student-123', 'student-124', 'student-125'],
    };

    act(() => {
      result.current.setGroup?.(groupData);
    });

    expect(result.current.group).toEqual(groupData);
  });

  it('should handle leader status changes', () => {
    const { result } = renderHook(() => useStudentStore());

    // Start as non-leader
    act(() => {
      result.current.setGroup?.({
        id: 'group-789',
        name: 'Group A',
        isLeader: false,
        isReady: false,
        members: ['student-123', 'student-124'],
      });
    });

    expect(result.current.group?.isLeader).toBe(false);

    // Promote to leader
    act(() => {
      result.current.setGroup?.({
        id: 'group-789',
        name: 'Group A',
        isLeader: true,
        isReady: false,
        members: ['student-123', 'student-124'],
      });
    });

    expect(result.current.group?.isLeader).toBe(true);
  });

  it('should handle multiple readiness toggles', () => {
    const { result } = renderHook(() => useStudentStore());

    // Start not ready
    act(() => {
      result.current.setGroupReadiness(false);
    });
    expect(result.current.group?.isReady).toBe(false);

    // Toggle to ready
    act(() => {
      result.current.setGroupReadiness(true);
    });
    expect(result.current.group?.isReady).toBe(true);

    // Toggle back to not ready
    act(() => {
      result.current.setGroupReadiness(false);
    });
    expect(result.current.group?.isReady).toBe(false);

    // Toggle to ready again
    act(() => {
      result.current.setGroupReadiness(true);
    });
    expect(result.current.group?.isReady).toBe(true);
  });

  it('should persist state during component re-renders', () => {
    const { result, rerender } = renderHook(() => useStudentStore());

    act(() => {
      result.current.setStudent?.({
        id: 'student-123',
        name: 'John Doe',
        sessionId: 'session-456',
      });

      result.current.setGroup?.({
        id: 'group-789',
        name: 'Group A',
        isLeader: true,
        isReady: true,
        members: ['student-123'],
      });
    });

    // Re-render the hook
    rerender();

    // State should persist
    expect(result.current.student?.id).toBe('student-123');
    expect(result.current.group?.isReady).toBe(true);
    expect(result.current.group?.isLeader).toBe(true);
  });

  it('should handle invalid readiness updates gracefully', () => {
    const { result } = renderHook(() => useStudentStore());

    // Set up group first
    act(() => {
      result.current.setGroup?.({
        id: 'group-789',
        name: 'Group A',
        isLeader: true,
        isReady: false,
        members: ['student-123'],
      });
    });

    const initialReadiness = result.current.group?.isReady;

    // Try to update readiness for wrong group
    act(() => {
      result.current.handleGroupReadinessUpdate?.({
        groupId: 'wrong-group-id',
        isReady: true,
        status: 'ready',
      });
    });

    // Readiness should not change
    expect(result.current.group?.isReady).toBe(initialReadiness);
  });

  it('should handle connection status changes', () => {
    const { result } = renderHook(() => useStudentStore());

    // Should initially reflect connected state
    expect(result.current.isConnected).toBeDefined();

    // Handle connection status updates
    act(() => {
      result.current.setConnectionStatus?.(false);
    });

    expect(result.current.isConnected).toBe(false);

    act(() => {
      result.current.setConnectionStatus?.(true);
    });

    expect(result.current.isConnected).toBe(true);
  });
});
