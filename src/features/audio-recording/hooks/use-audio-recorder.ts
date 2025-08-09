import { useCallback, useRef, useState } from 'react'

interface UseAudioRecorderOptions {
  onDataAvailable?: (blob: Blob) => void
  chunkSize?: number // in milliseconds
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onDataAvailable, chunkSize = 500 } = options
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const requestPermission = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop tracks immediately; this is a permission probe
      stream.getTracks().forEach((t) => t.stop())
      setHasPermission(true)
    } catch (err) {
      setHasPermission(false)
      setError('Microphone permission denied')
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setAudioBlob(null)
      setAudioUrl(null)
      setDuration(0)
      setIsPaused(false)
      chunksRef.current = []
      if (!hasPermission) {
        setError('Microphone permission not granted')
        return
      }
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 16000 },
          sampleSize: { ideal: 16 },
        }
      })

      // Create MediaRecorder configured for speech (Opus @ 32kbps)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000
      })

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })
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
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          
          // Send chunk if callback provided
          if (onDataAvailable) {
            onDataAvailable(event.data)
          }
        }
      }

      mediaRecorder.onstop = () => {
        // Combine chunks into a single blob and create URL
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
          setAudioBlob(blob)
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
        }
      }

      // Start recording with time slicing
      mediaRecorder.start(chunkSize)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      // Start duration timer
      durationIntervalRef.current = window.setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }, [chunkSize, onDataAvailable, hasPermission])

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

    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    setIsRecording(false)
    setIsPaused(false)
    setAudioLevel(0)
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
    }
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    chunksRef.current = []
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
  }, [audioUrl])

  return {
    isRecording,
    isPaused,
    audioLevel,
    error,
    hasPermission,
    duration,
    audioBlob,
    audioUrl,
    requestPermission,
    startRecording,
    stopRecording,
    toggleRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  }
}