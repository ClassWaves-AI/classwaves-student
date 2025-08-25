'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Mic, 
  Volume2, 
  Smartphone, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Headphones,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface WaveListenerHintsProps {
  className?: string;
  variant?: 'full' | 'compact' | 'tips-only';
  isRecording?: boolean;
  permissionStatus?: 'granted' | 'denied' | 'prompt';
  showAudioQualityTips?: boolean;
}

/**
 * Helpful hints component for WaveListener usage
 * 
 * Implements SG-UX-03: Helpful hints
 * - "Keep your device close for best WaveListener quality"
 * - Audio quality optimization tips
 * - Device positioning guidance
 * - Environment optimization suggestions
 */
export function WaveListenerHints({
  className,
  variant = 'full',
  isRecording = false,
  permissionStatus,
  showAudioQualityTips = true
}: WaveListenerHintsProps) {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  // Rotate through tips every 15 seconds
  useEffect(() => {
    if (variant === 'compact') {
      const interval = setInterval(() => {
        setCurrentHintIndex(prev => (prev + 1) % hints.length);
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [variant]);

  // Core hints for optimal WaveListener experience
  const hints = [
    {
      id: 'device-proximity',
      icon: Smartphone,
      title: "Keep your device close",
      description: "Position your device 2-3 feet from your group for best WaveListener quality",
      type: 'positioning' as const,
      priority: 'high' as const
    },
    {
      id: 'group-center',
      icon: MapPin,
      title: "Center of your group",
      description: "Place the device where all group members can be heard clearly",
      type: 'positioning' as const,
      priority: 'high' as const
    },
    {
      id: 'quiet-environment',
      icon: Volume2,
      title: "Minimize background noise",
      description: "WaveListener works best in quiet environments - close doors and windows if possible",
      type: 'environment' as const,
      priority: 'medium' as const
    },
    {
      id: 'speak-clearly',
      icon: Mic,
      title: "Speak clearly and naturally",
      description: "No need to speak louder - just speak normally as you would in any discussion",
      type: 'speaking' as const,
      priority: 'medium' as const
    },
    {
      id: 'avoid-movement',
      icon: Headphones,
      title: "Keep device stable",
      description: "Avoid moving your device around during recording for consistent audio quality",
      type: 'technical' as const,
      priority: 'low' as const
    }
  ];

  // Get contextual hints based on current state
  const getContextualHints = () => {
    const contextualHints = [...hints];

    // Add permission-specific hints
    if (permissionStatus === 'denied') {
      contextualHints.unshift({
        id: 'permission-required',
        icon: AlertTriangle,
        title: "Microphone permission needed",
        description: "WaveListener needs microphone access to capture your group's discussion",
        type: 'permission' as const,
        priority: 'critical' as const
      });
    }

    // Add recording-specific hints
    if (isRecording) {
      contextualHints.unshift({
        id: 'recording-active',
        icon: CheckCircle,
        title: "WaveListener is capturing audio",
        description: "Your discussion is being recorded for AI analysis - continue your conversation naturally",
        type: 'status' as const,
        priority: 'info' as const
      });
    }

    return contextualHints;
  };

  const contextualHints = getContextualHints();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'info':
        return 'text-green-700 bg-green-50 border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (variant === 'compact') {
    const currentHint = contextualHints[currentHintIndex % contextualHints.length];
    const Icon = currentHint.icon;

    return (
      <Alert 
        className={cn(
          'transition-all duration-500',
          getPriorityColor(currentHint.priority),
          className
        )}
        data-testid="wavelistener-hint-compact"
      >
        <Icon className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">{currentHint.title}</span>
              <br />
              <span className="text-sm">{currentHint.description}</span>
            </div>
            <Badge variant="outline" className="ml-4 text-xs">
              💡 Tip {currentHintIndex + 1}/{contextualHints.length}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'tips-only') {
    return (
      <div className={cn('space-y-2', className)}>
        {contextualHints.slice(0, 3).map((hint) => {
          const Icon = hint.icon;
          return (
            <div 
              key={hint.id}
              className="flex items-center gap-2 text-sm text-gray-600"
              data-testid={`wavelistener-tip-${hint.id}`}
            >
              <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>{hint.description}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant - show all hints in cards
  return (
    <div className={cn('space-y-4', className)} data-testid="wavelistener-hints-full">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="font-medium text-gray-900">
          WaveListener Tips for Best Results
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {contextualHints.map((hint) => {
          const Icon = hint.icon;
          return (
            <Card 
              key={hint.id}
              className={cn(
                'transition-all duration-200 hover:shadow-sm',
                getPriorityColor(hint.priority)
              )}
              data-testid={`wavelistener-hint-${hint.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">{hint.title}</h4>
                    <p className="text-sm mt-1 opacity-90">
                      {hint.description}
                    </p>
                    {hint.priority === 'critical' && (
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs bg-white/50"
                      >
                        Required
                      </Badge>
                    )}
                    {hint.priority === 'high' && (
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs bg-white/50"
                      >
                        Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAudioQualityTips && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 text-sm">
                Audio Quality Checklist
              </span>
            </div>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Device positioned 2-3 feet from group center</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Minimal background noise and distractions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>All group members speaking at normal volume</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Device stable and not being moved around</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
