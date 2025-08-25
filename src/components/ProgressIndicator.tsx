'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

export function ProgressIndicator({ 
  steps, 
  className = '', 
  size = 'md',
  orientation = 'vertical'
}: ProgressIndicatorProps) {
  const [animatedSteps, setAnimatedSteps] = useState<string[]>([]);

  // Animate step transitions
  useEffect(() => {
    const completedSteps = steps.filter(step => step.status === 'completed').map(step => step.id);
    const newlyCompleted = completedSteps.filter(id => !animatedSteps.includes(id));
    
    if (newlyCompleted.length > 0) {
      // Add delay for animation effect
      setTimeout(() => {
        setAnimatedSteps(prev => [...prev, ...newlyCompleted]);
      }, 150);
    }
  }, [steps, animatedSteps]);

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className={`text-green-600 ${getSizeClasses().icon}`} />;
      case 'active':
        return (
          <div className={`relative ${getSizeClasses().iconWrapper}`}>
            <Circle className={`text-blue-600 animate-pulse ${getSizeClasses().icon}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`bg-blue-600 rounded-full ${getSizeClasses().dot}`} />
            </div>
          </div>
        );
      case 'error':
        return <Circle className={`text-red-600 ${getSizeClasses().icon}`} />;
      default:
        return <Circle className={`text-gray-300 ${getSizeClasses().icon}`} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'w-4 h-4',
          iconWrapper: 'w-4 h-4',
          dot: 'w-1.5 h-1.5',
          text: 'text-sm',
          description: 'text-xs'
        };
      case 'lg':
        return {
          icon: 'w-8 h-8',
          iconWrapper: 'w-8 h-8',
          dot: 'w-3 h-3',
          text: 'text-lg',
          description: 'text-sm'
        };
      default:
        return {
          icon: 'w-6 h-6',
          iconWrapper: 'w-6 h-6',
          dot: 'w-2 h-2',
          text: 'text-base',
          description: 'text-sm'
        };
    }
  };

  const getTextColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-800';
      case 'active':
        return 'text-blue-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-gray-500';
    }
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`flex items-center space-x-4 ${className}`} data-testid="progress-indicator">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className={animatedSteps.includes(step.id) ? 'animate-bounce' : ''}>
                {getStepIcon(step)}
              </div>
              <span className={`${getSizeClasses().text} font-medium ${getTextColor(step)}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="ml-4 w-8 h-px bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="progress-indicator">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start space-x-3">
          <div className="flex flex-col items-center">
            <div className={animatedSteps.includes(step.id) ? 'animate-bounce' : ''}>
              {getStepIcon(step)}
            </div>
            {index < steps.length - 1 && (
              <div className="w-px h-6 bg-gray-200 mt-2" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${getSizeClasses().text} font-medium ${getTextColor(step)}`}>
              {step.label}
            </p>
            {step.description && (
              <p className={`${getSizeClasses().description} text-gray-600 mt-0.5`}>
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// SG-ST-08: Specific component for permission request progress
interface PermissionProgressProps {
  currentStep: 'requesting' | 'processing' | 'ready' | 'error';
  error?: string;
  className?: string;
}

export function PermissionProgress({ currentStep, error, className }: PermissionProgressProps) {
  const steps: ProgressStep[] = [
    {
      id: 'requesting',
      label: 'Requesting microphone...',
      description: 'Asking your browser for permission',
      status: currentStep === 'requesting' ? 'active' : 
             ['processing', 'ready'].includes(currentStep) ? 'completed' : 
             currentStep === 'error' ? 'error' : 'pending'
    },
    {
      id: 'processing',
      label: 'Setting up WaveListener...',
      description: 'Preparing audio capture system',
      status: currentStep === 'processing' ? 'active' :
             currentStep === 'ready' ? 'completed' :
             currentStep === 'error' ? 'error' : 'pending'
    },
    {
      id: 'ready',
      label: 'WaveListener Ready',
      description: currentStep === 'error' && error ? error : 'Your microphone is ready for the session',
      status: currentStep === 'ready' ? 'completed' :
             currentStep === 'error' ? 'error' : 'pending'
    }
  ];

  return <ProgressIndicator steps={steps} className={className} size="sm" />;
}
