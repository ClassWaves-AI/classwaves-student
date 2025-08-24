'use client';

import React from 'react';
import { Mic } from 'lucide-react';

interface CountdownOverlayProps {
  countdown: number | null;
  isVisible?: boolean;
}

/**
 * SG-ST-10: Visual countdown overlay for auto-start WaveListener
 * Shows 3-2-1 countdown with pulse animation and visual feedback
 */
export function CountdownOverlay({ countdown, isVisible = true }: CountdownOverlayProps) {
  if (!isVisible || countdown === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center max-w-sm mx-4">
        {/* Mic icon with pulse animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-red-200 animate-ping"></div>
          <div className="relative bg-red-500 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center">
            <Mic className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Countdown number */}
        <div className="text-6xl font-bold text-gray-900 mb-4 animate-in zoom-in duration-300">
          {countdown}
        </div>
        
        {/* Status message */}
        <div className="text-lg text-gray-600 mb-2">
          WaveListener starting in...
        </div>
        
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mt-4">
          {[3, 2, 1].map((count) => (
            <div
              key={count}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                count >= countdown ? 'bg-red-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface WaveListenerStatusProps {
  isAutoRecording: boolean;
  isAutoStarting: boolean;
  audioLevel?: number;
  autoStartError?: string | null;
}

/**
 * SG-ST-10: Visual/audio feedback when WaveListener is active
 * Pulse animation and status indicator
 */
export function WaveListenerStatus({ 
  isAutoRecording, 
  isAutoStarting, 
  audioLevel = 0,
  autoStartError 
}: WaveListenerStatusProps) {
  if (!isAutoRecording && !isAutoStarting && !autoStartError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border p-3 flex items-center space-x-3">
        {/* Status icon with animation */}
        <div className="relative">
          {isAutoRecording && (
            <>
              {/* Pulse animation based on audio level */}
              <div 
                className="absolute inset-0 bg-red-200 rounded-full animate-pulse"
                style={{
                  transform: `scale(${1 + audioLevel * 0.5})`,
                  opacity: 0.6 + audioLevel * 0.4,
                }}
              />
              {/* Mic icon */}
              <div className="relative bg-red-500 rounded-full p-2">
                <Mic className="w-4 h-4 text-white" />
              </div>
            </>
          )}
          
          {isAutoStarting && (
            <div className="bg-yellow-500 rounded-full p-2 animate-pulse">
              <Mic className="w-4 h-4 text-white" />
            </div>
          )}
          
          {autoStartError && (
            <div className="bg-red-500 rounded-full p-2">
              <Mic className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        {/* Status text */}
        <div className="text-sm">
          {isAutoRecording && (
            <div>
              <div className="font-medium text-green-700">WaveListener Active</div>
              <div className="text-gray-500">Recording audio...</div>
            </div>
          )}
          
          {isAutoStarting && (
            <div>
              <div className="font-medium text-yellow-700">Getting Ready...</div>
              <div className="text-gray-500">Starting WaveListener...</div>
            </div>
          )}
          
          {autoStartError && (
            <div>
              <div className="font-medium text-red-700">Audio Issue</div>
              <div className="text-gray-500 text-xs">{autoStartError}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
