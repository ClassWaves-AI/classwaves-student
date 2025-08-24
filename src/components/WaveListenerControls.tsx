'use client';

import React from 'react';
import { Pause, Play, Square, Mic, MicOff } from 'lucide-react';

interface WaveListenerControlsProps {
  isAutoRecording: boolean;
  isPaused?: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * SG-ST-12: Provide clear Pause/Resume controls for WaveListener when active
 * Clean, accessible controls for managing auto-started WaveListener
 */
export function WaveListenerControls({
  isAutoRecording,
  isPaused = false,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: WaveListenerControlsProps) {
  if (!isAutoRecording) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white rounded-full shadow-2xl border border-gray-200 p-2 flex items-center space-x-2">
        {/* Recording status indicator */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isPaused ? 'Paused' : 'Recording'}
          </span>
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center space-x-1">
          {/* Pause/Resume button */}
          <button
            onClick={isPaused ? onResume : onPause}
            disabled={disabled}
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-white" />
            ) : (
              <Pause className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Stop button */}
          <button
            onClick={onStop}
            disabled={disabled}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Stop recording"
          >
            <Square className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface WaveListenerToggleProps {
  isAutoRecording: boolean;
  hasPermission: boolean;
  isGroupReady: boolean;
  sessionStatus: string;
  onManualStart: () => void;
  onManualStop: () => void;
  disabled?: boolean;
}

/**
 * Manual WaveListener toggle for when auto-start isn't applicable
 * Provides fallback control for users who want to manually control recording
 */
export function WaveListenerToggle({
  isAutoRecording,
  hasPermission,
  isGroupReady,
  sessionStatus,
  onManualStart,
  onManualStop,
  disabled = false,
}: WaveListenerToggleProps) {
  const canRecord = hasPermission && isGroupReady && (sessionStatus === 'active');
  const isRecordingAvailable = canRecord && !disabled;

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={isAutoRecording ? onManualStop : onManualStart}
        disabled={!isRecordingAvailable}
        className={`p-4 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isAutoRecording
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 shadow-lg'
            : isRecordingAvailable
            ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
        aria-label={isAutoRecording ? 'Stop WaveListener' : 'Start WaveListener'}
      >
        {isAutoRecording ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className={`w-8 h-8 ${isRecordingAvailable ? 'text-white' : 'text-gray-500'}`} />
        )}
      </button>
      
      {/* Status text */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700">
          {isAutoRecording ? 'WaveListener Active' : 'WaveListener'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {!hasPermission && 'Microphone permission needed'}
          {hasPermission && !isGroupReady && 'Mark group as ready first'}
          {hasPermission && isGroupReady && sessionStatus !== 'active' && 'Waiting for session to start'}
          {canRecord && !isAutoRecording && 'Tap to start recording'}
          {isAutoRecording && 'Recording audio for AI analysis'}
        </div>
      </div>
    </div>
  );
}
