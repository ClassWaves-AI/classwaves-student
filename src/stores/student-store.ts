import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Student {
  id: string;
  name: string;
  sessionId: string;
}

interface Session {
  id: string;
  title: string;
  status: string;
}

interface Group {
  id: string;
  name: string;
  members: any[];
  isLeader?: boolean; // Whether current student is the leader of this group
  isReady?: boolean; // Whether the group leader has marked ready
}

interface StudentState {
  // Authentication
  isAuthenticated: boolean;
  token: string | null;
  
  // Student info
  student: Student | null;
  session: Session | null;
  group: Group | null;
  
  // Recording state
  isRecording: boolean;
  isMuted: boolean;
  audioLevel: number;
  
  // WebSocket connection
  isConnected: boolean;
  
  // Actions
  setAuth: (token: string, student: Student) => void;
  setSession: (session: Session) => void;
  setGroup: (group: Group | null) => void;
  setGroupReadiness: (isReady: boolean) => void; // Update group readiness status
  setRecording: (isRecording: boolean) => void;
  setMuted: (isMuted: boolean) => void;
  setAudioLevel: (level: number) => void;
  setConnected: (isConnected: boolean) => void;
  logout: () => void;
}

export const useStudentStore = create<StudentState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isAuthenticated: false,
        token: null,
        student: null,
        session: null,
        group: null,
        isRecording: false,
        isMuted: false,
        audioLevel: 0,
        isConnected: false,
        
        // Actions
        setAuth: (token, student) =>
          set({ isAuthenticated: true, token, student }),
          
        setSession: (session) => set({ session }),
        
        setGroup: (group) => set({ group }),
        
        setGroupReadiness: (isReady) => 
          set((state) => ({
            group: state.group ? { ...state.group, isReady } : null
          })),
        
        setRecording: (isRecording) => set({ isRecording }),
        
        setMuted: (isMuted) => set({ isMuted }),
        
        setAudioLevel: (audioLevel) => set({ audioLevel }),
        
        setConnected: (isConnected) => set({ isConnected }),
        
        logout: () =>
          set({
            isAuthenticated: false,
            token: null,
            student: null,
            session: null,
            group: null,
            isRecording: false,
            isMuted: false,
            audioLevel: 0,
            isConnected: false,
          }),
      }),
      {
        name: 'student-storage',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          token: state.token,
          student: state.student,
          session: state.session,
        }),
      }
    )
  )
);