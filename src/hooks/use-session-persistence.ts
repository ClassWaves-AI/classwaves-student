import { useEffect, useCallback, useRef } from 'react';
import { useStudentStore } from '@/stores/student-store';

interface PersistedSessionData {
  sessionId: string;
  groupId: string;
  studentId: string;
  timestamp: number;
  status: 'pending' | 'active' | 'rejoining';
  lastActivity: number;
}

const STORAGE_KEY = 'classwaves-session-state';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_INTERVAL = 5000; // 5 seconds

export function useSessionPersistence() {
  const { student, session, group, isConnected } = useStudentStore();
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const beforeUnloadHandlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  // Save current session state to localStorage
  const persistSessionState = useCallback(() => {
    if (!session?.id || !group?.id || !student?.id) return;

    const sessionData: PersistedSessionData = {
      sessionId: session.id,
      groupId: group.id,
      studentId: student.id,
      timestamp: Date.now(),
      status: session.status === 'active' ? 'active' : 'pending',
      lastActivity: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      console.log('📦 Session state persisted:', sessionData);
    } catch (error) {
      console.warn('Failed to persist session state:', error);
    }
  }, [session, group, student]);

  // Load persisted session state from localStorage
  const loadPersistedSession = useCallback((): PersistedSessionData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const sessionData: PersistedSessionData = JSON.parse(stored);
      
      // Check if session is expired
      const isExpired = Date.now() - sessionData.timestamp > SESSION_TIMEOUT;
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY);
        console.log('📦 Expired session state removed');
        return null;
      }

      return sessionData;
    } catch (error) {
      console.warn('Failed to load persisted session state:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // Clear persisted session state
  const clearPersistedSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('📦 Session state cleared');
    } catch (error) {
      console.warn('Failed to clear session state:', error);
    }
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const sessionData: PersistedSessionData = JSON.parse(stored);
        sessionData.lastActivity = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      } catch (error) {
        console.warn('Failed to update activity timestamp:', error);
      }
    }
  }, []);

  // Check if there's a session to rejoin
  const checkForRejoinableSession = useCallback((): PersistedSessionData | null => {
    const persistedData = loadPersistedSession();
    if (!persistedData) return null;

    // Only suggest rejoin if not currently in the same session
    const currentSessionId = session?.id;
    if (currentSessionId === persistedData.sessionId) {
      return null; // Already in this session
    }

    return persistedData;
  }, [loadPersistedSession, session?.id]);

  // Automatically persist state when session data changes
  useEffect(() => {
    if (session && group && student && isConnected) {
      persistSessionState();
    }
  }, [session, group, student, isConnected, persistSessionState]);

  // Set up activity tracking when in an active session
  useEffect(() => {
    if (session?.id && group?.id && student?.id) {
      // Track user activity
      const trackActivity = () => {
        updateActivity();
      };

      // Set up periodic activity updates
      activityIntervalRef.current = setInterval(trackActivity, ACTIVITY_INTERVAL);

      // Track user interactions
      const events = ['click', 'keydown', 'mousemove', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, trackActivity, { passive: true });
      });

      return () => {
        // Cleanup interval
        if (activityIntervalRef.current) {
          clearInterval(activityIntervalRef.current);
          activityIntervalRef.current = null;
        }

        // Remove event listeners
        events.forEach(event => {
          document.removeEventListener(event, trackActivity);
        });
      };
    }
  }, [session?.id, group?.id, student?.id, updateActivity]);

  // Set up beforeunload handler to persist state before page closes
  useEffect(() => {
    if (session?.id && group?.id && student?.id) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        // Update session state as 'rejoining' to indicate unexpected exit
        if (session && group && student) {
          const sessionData: PersistedSessionData = {
            sessionId: session.id,
            groupId: group.id,
            studentId: student.id,
            timestamp: Date.now(),
            status: 'rejoining',
            lastActivity: Date.now()
          };

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
          } catch (error) {
            console.warn('Failed to persist session on beforeunload:', error);
          }
        }

        // Optionally show warning for active sessions
        if (session.status === 'active') {
          e.preventDefault();
          e.returnValue = 'You are in an active ClassWaves session. Are you sure you want to leave?';
          return e.returnValue;
        }
      };

      beforeUnloadHandlerRef.current = handleBeforeUnload;
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        if (beforeUnloadHandlerRef.current) {
          window.removeEventListener('beforeunload', beforeUnloadHandlerRef.current);
          beforeUnloadHandlerRef.current = null;
        }
      };
    }
  }, [session, group, student]);

  // Clean up when session ends normally
  useEffect(() => {
    if (session?.status === 'ended' || session?.status === 'completed') {
      clearPersistedSession();
    }
  }, [session?.status, clearPersistedSession]);

  // Handle page visibility changes (tab switching, minimizing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - update activity
        updateActivity();
      } else {
        // Page became hidden - persist current state
        persistSessionState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateActivity, persistSessionState]);

  return {
    persistSessionState,
    loadPersistedSession,
    clearPersistedSession,
    checkForRejoinableSession,
    updateActivity
  };
}
