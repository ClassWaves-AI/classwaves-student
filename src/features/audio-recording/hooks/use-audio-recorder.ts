import { useCallback, useRef, useState } from 'react'

interface UseAudioRecorderOptions {
  onDataAvailable?: (blob: Blob) => void
  chunkSize?: number // in milliseconds
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onDataAvailable, chunkSize = 5000 } = options
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      })

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start monitoring audio levels
      const monitorAudioLevel = () => {
        if (!analyserRef.current) return
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(Math.min(100, (average / 128) * 100))
        
        animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
      }
      monitorAudioLevel()

      // Handle data chunks
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          
          // Send chunk if callback provided
          if (onDataAvailable) {
            onDataAvailable(event.data)
          }
        }
      }

      // Start recording with time slicing
      mediaRecorder.start(chunkSize)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }, [chunkSize, onDataAvailable])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsRecording(false)
    setAudioLevel(0)
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    toggleRecording
  }
}