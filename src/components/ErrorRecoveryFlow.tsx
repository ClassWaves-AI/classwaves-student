'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Mic,
  WifiOff,
  Volume2,
  Settings,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ErrorRecoveryFlowProps {
  errorType: 'permission_denied' | 'permission_revoked' | 'audio_failed' | 'connection_lost' | 'device_not_found';
  errorMessage?: string;
  onRetry?: () => Promise<void>;
  onRequestHelp?: () => void;
  onRejoinSession?: () => void;
  className?: string;
  showFullFlow?: boolean;
}

/**
 * Error Recovery Flow Component
 * 
 * Implements SG-UX-04: Error recovery flows
 * - If WaveListener fails, provide "rejoin" or "re-grant permission" flows
 * - Rather than dead-end error messages, provide actionable recovery steps
 * - Progressive disclosure of troubleshooting options
 */
export function ErrorRecoveryFlow({
  errorType,
  errorMessage,
  onRetry,
  onRequestHelp,
  onRejoinSession,
  className,
  showFullFlow = true
}: ErrorRecoveryFlowProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'error' | 'attempting' | 'success'>('error');

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    setRecoveryStep('attempting');
    
    try {
      await onRetry();
      setRecoveryStep('success');
      setTimeout(() => setRecoveryStep('error'), 3000); // Reset after success message
    } catch (error) {
      setRecoveryStep('error');
    } finally {
      setIsRetrying(false);
    }
  };

  // Get error configuration based on type
  const getErrorConfig = () => {
    switch (errorType) {
      case 'permission_denied':
        return {
          icon: Mic,
          title: "Microphone Permission Needed",
          description: "WaveListener needs microphone access to capture your group discussions",
          primaryAction: "Grant Permission",
          primaryIcon: Mic,
          color: 'red',
          recoverySteps: [
            "1. Click 'Grant Permission' below",
            "2. Allow microphone access in your browser",
            "3. Try marking your group as ready again"
          ],
          troubleshooting: [
            "Check if your browser blocked the permission request",
            "Look for a microphone icon in your browser's address bar",
            "Try refreshing the page and granting permission again",
            "Make sure your microphone is connected and working"
          ]
        };
      
      case 'permission_revoked':
        return {
          icon: AlertTriangle,
          title: "Microphone Access Lost",
          description: "WaveListener lost access to your microphone during the session",
          primaryAction: "Re-grant Permission",
          primaryIcon: RefreshCw,
          color: 'orange',
          recoverySteps: [
            "1. Click 'Re-grant Permission' below",
            "2. Allow microphone access when prompted",
            "3. Your recording will resume automatically"
          ],
          troubleshooting: [
            "This can happen if you manually revoked permission",
            "Check your browser's site settings for microphone access",
            "Make sure your microphone device wasn't disconnected",
            "Try using a different browser if issues persist"
          ]
        };
      
      case 'audio_failed':
        return {
          icon: Volume2,
          title: "Audio Recording Failed",
          description: "WaveListener encountered an issue while recording audio",
          primaryAction: "Restart Recording",
          primaryIcon: RefreshCw,
          color: 'red',
          recoverySteps: [
            "1. Click 'Restart Recording' to try again",
            "2. Make sure your microphone is working properly",
            "3. Check that no other apps are using your microphone"
          ],
          troubleshooting: [
            "Close other applications that might be using your microphone",
            "Try unplugging and reconnecting your microphone",
            "Check your computer's audio settings",
            "Restart your browser if problems continue"
          ]
        };
      
      case 'connection_lost':
        return {
          icon: WifiOff,
          title: "Connection Lost",
          description: "Lost connection to the session server",
          primaryAction: "Rejoin Session",
          primaryIcon: RefreshCw,
          color: 'yellow',
          recoverySteps: [
            "1. Check your internet connection",
            "2. Click 'Rejoin Session' below",
            "3. Your session state will be restored automatically"
          ],
          troubleshooting: [
            "Check if your internet connection is stable",
            "Try refreshing the page",
            "Make sure you're not connected to a restricted network",
            "Contact your teacher if connection issues persist"
          ]
        };
      
      case 'device_not_found':
        return {
          icon: Settings,
          title: "Microphone Not Found",
          description: "No microphone device was detected on your system",
          primaryAction: "Check Device Settings",
          primaryIcon: Settings,
          color: 'gray',
          recoverySteps: [
            "1. Make sure your microphone is connected",
            "2. Check your computer's audio settings",
            "3. Refresh the page and try again"
          ],
          troubleshooting: [
            "Ensure your microphone is properly connected",
            "Check that your microphone is not muted",
            "Try using a different microphone or headset",
            "Restart your browser after connecting a microphone"
          ]
        };
      
      default:
        return {
          icon: AlertTriangle,
          title: "WaveListener Error",
          description: errorMessage || "An unexpected error occurred",
          primaryAction: "Try Again",
          primaryIcon: RefreshCw,
          color: 'red',
          recoverySteps: ["1. Click 'Try Again' to retry", "2. Contact support if the issue persists"],
          troubleshooting: ["Try refreshing the page", "Contact your teacher for assistance"]
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;
  const PrimaryIcon = config.primaryIcon;

  const colorVariants = {
    red: {
      container: 'border-red-200 bg-red-50',
      text: 'text-red-700',
      title: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      badge: 'bg-red-100 text-red-800'
    },
    orange: {
      container: 'border-orange-200 bg-orange-50',
      text: 'text-orange-700',
      title: 'text-orange-900',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
      badge: 'bg-orange-100 text-orange-800'
    },
    yellow: {
      container: 'border-yellow-200 bg-yellow-50',
      text: 'text-yellow-700',
      title: 'text-yellow-900',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    gray: {
      container: 'border-gray-200 bg-gray-50',
      text: 'text-gray-700',
      title: 'text-gray-900',
      button: 'bg-gray-600 hover:bg-gray-700 text-white',
      badge: 'bg-gray-100 text-gray-800'
    }
  };

  const colors = colorVariants[config.color as keyof typeof colorVariants] || colorVariants.red;

  if (recoveryStep === 'success') {
    return (
      <Alert className="border-green-200 bg-green-50" data-testid="error-recovery-success">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <span className="font-medium text-green-900">Recovery Successful!</span>
          <br />
          <span className="text-green-700">WaveListener has been restored and is working normally.</span>
        </AlertDescription>
      </Alert>
    );
  }

  if (!showFullFlow) {
    // Compact version - just show error and primary action
    return (
      <Alert className={cn(colors.container, className)} data-testid="error-recovery-compact">
        <Icon className={cn('h-4 w-4', colors.text)} />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <span className={cn('font-medium', colors.title)}>{config.title}</span>
              <br />
              <span className={colors.text}>{config.description}</span>
            </div>
            <Button
              size="sm"
              className={colors.button}
              onClick={handleRetry}
              disabled={isRetrying}
              data-testid="primary-recovery-action"
            >
              {isRetrying ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <PrimaryIcon className="h-3 w-3 mr-1" />
              )}
              {config.primaryAction}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Full recovery flow interface
  return (
    <Card className={cn(colors.container, className)} data-testid="error-recovery-full">
      <CardHeader className="pb-3">
        <CardTitle className={cn('flex items-center gap-2', colors.title)}>
          <Icon className="h-5 w-5" />
          {config.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className={colors.text}>{config.description}</p>

        {/* Primary Recovery Action */}
        <div className="flex gap-2">
          <Button
            className={colors.button}
            onClick={handleRetry}
            disabled={isRetrying}
            data-testid="primary-recovery-action"
          >
            {isRetrying ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PrimaryIcon className="h-4 w-4 mr-2" />
            )}
            {isRetrying ? 'Retrying...' : config.primaryAction}
          </Button>
          
          {onRejoinSession && (
            <Button
              variant="outline"
              onClick={onRejoinSession}
              data-testid="rejoin-session-action"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Rejoin Session
            </Button>
          )}
        </div>

        {/* Recovery Steps */}
        <div className="bg-white/70 rounded-lg p-3">
          <h4 className={cn('font-medium text-sm mb-2', colors.title)}>
            Quick Recovery Steps:
          </h4>
          <div className="space-y-1">
            {config.recoverySteps.map((step, index) => (
              <div key={index} className={cn('text-sm', colors.text)}>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Troubleshooting */}
        <div>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={cn(
              'flex items-center gap-2 text-sm font-medium hover:underline transition-colors',
              colors.title
            )}
            data-testid="show-advanced-options"
          >
            <HelpCircle className="h-4 w-4" />
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Troubleshooting
          </button>
          
          {showAdvancedOptions && (
            <div className="mt-2 bg-white/70 rounded-lg p-3">
              <h5 className={cn('font-medium text-sm mb-2', colors.title)}>
                Additional Troubleshooting:
              </h5>
              <div className="space-y-1">
                {config.troubleshooting.map((tip, index) => (
                  <div key={index} className={cn('text-sm', colors.text)}>
                    • {tip}
                  </div>
                ))}
              </div>
              
              {onRequestHelp && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={onRequestHelp}
                  data-testid="request-help-action"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  Get Help from Teacher
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
