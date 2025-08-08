import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '@/features/audio-recording/hooks/use-audio-recorder';

// Mock MediaRecorder
class MockMediaRecorder {
  state: RecordingState = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;

  constructor(public stream: MediaStream, public options?: MediaRecorderOptions) {}

  start() {
    this.state = 'recording';
    // Simulate data available after a delay
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['audio'], { type: 'audio/webm' }) });
      }
    }, 100);
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Mock getUserMedia
const mockGetUserMedia = jest.fn();

beforeAll(() => {
  global.MediaRecorder = MockMediaRecorder as any;
  global.navigator.mediaDevices = {
    getUserMedia: mockGetUserMedia,
  } as any;
});

describe('useAudioRecorder', () => {
  const mockStream = {
    getTracks: jest.fn(() => [{ stop: jest.fn() }]),
  } as unknown as MediaStream;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAudioRecorder());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.duration).toBe(0);
    expect(result.current.hasPermission).toBe(false);
  });

  it('requests microphone permission', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(result.current.hasPermission).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles permission denial', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.error).toBe('Microphone permission denied');
  });

  it('starts recording after permission granted', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    // Request permission first
    await act(async () => {
      await result.current.requestPermission();
    });

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('prevents recording without permission', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Microphone permission not granted');
  });

  it('stops recording and generates audio blob', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    // Setup recording
    await act(async () => {
      await result.current.requestPermission();
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    // Stop recording
    await act(async () => {
      await result.current.stopRecording();
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
    expect(result.current.audioUrl).toMatch(/^blob:/);
  });

  it('pauses and resumes recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
      await result.current.startRecording();
    });

    // Pause
    act(() => {
      result.current.pauseRecording();
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.isRecording).toBe(true);

    // Resume
    act(() => {
      result.current.resumeRecording();
    });

    expect(result.current.isPaused).toBe(false);
    expect(result.current.isRecording).toBe(true);
  });

  it('tracks recording duration', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
      await result.current.startRecording();
    });

    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.duration).toBe(5);

    await act(async () => {
      await result.current.stopRecording();
    });

    jest.useRealTimers();
  });

  it('clears recording data', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    // Create a recording
    await act(async () => {
      await result.current.requestPermission();
      await result.current.startRecording();
      await result.current.stopRecording();
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.audioBlob).not.toBeNull();
    expect(result.current.audioUrl).not.toBeNull();

    // Clear recording
    act(() => {
      result.current.clearRecording();
    });

    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.duration).toBe(0);
  });

  it('handles recording errors', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
    });

    // Mock MediaRecorder to throw error
    const originalMediaRecorder = global.MediaRecorder;
    global.MediaRecorder = class {
      constructor() {
        throw new Error('MediaRecorder not supported');
      }
    } as any;

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Failed to start recording');

    // Restore
    global.MediaRecorder = originalMediaRecorder;
  });

  it('cleans up media stream on unmount', async () => {
    const stopTrack = jest.fn();
    const mockStreamWithStop = {
      getTracks: jest.fn(() => [{ stop: stopTrack }]),
    } as unknown as MediaStream;
    
    mockGetUserMedia.mockResolvedValueOnce(mockStreamWithStop);

    const { result, unmount } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
    });

    unmount();

    expect(stopTrack).toHaveBeenCalled();
  });

  it('prevents multiple simultaneous recordings', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.requestPermission();
      await result.current.startRecording();
    });

    // Try to start another recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Should still be recording the first one
    expect(result.current.isRecording).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles pause when not recording', () => {
    const { result } = renderHook(() => useAudioRecorder());

    act(() => {
      result.current.pauseRecording();
    });

    expect(result.current.isPaused).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles stop when not recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioBlob).toBeNull();
  });
});