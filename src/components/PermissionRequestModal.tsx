'use client';

import { useState } from 'react';
import { Mic, Shield, Volume2, Users, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface PermissionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<void>;
  isRequestingPermission: boolean;
  permissionError?: string | null;
  stage: 'explanation' | 'request' | 'success' | 'denied';
  onRetry?: () => void;
}

// Browser-specific instruction detection
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    return { name: 'Chrome', icon: '🔗' };
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return { name: 'Safari', icon: '🧭' };
  } else if (userAgent.includes('Firefox')) {
    return { name: 'Firefox', icon: '🦊' };
  } else if (userAgent.includes('Edge')) {
    return { name: 'Edge', icon: '🌐' };
  }
  return { name: 'Browser', icon: '🌐' };
};

export function PermissionRequestModal({
  isOpen,
  onClose,
  onRequestPermission,
  isRequestingPermission,
  permissionError,
  stage,
  onRetry
}: PermissionRequestModalProps) {
  const [showTechnicalHelp, setShowTechnicalHelp] = useState(false);
  const browser = getBrowserInfo();

  if (!isOpen) return null;

  // SG-ST-01: Pre-permission explanation modal
  const renderExplanationStage = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">WaveListener Setup</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              data-testid="close-modal-button"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Benefits explanation */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              WaveListener needs microphone access to capture your group&apos;s discussion and provide AI-powered insights to help your learning.
            </p>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What WaveListener does:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Mic className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Captures your group&apos;s discussion audio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Provides real-time collaboration insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span>Respects your privacy - no audio is stored permanently</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Privacy Protected</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Audio is processed in real-time and not permanently stored. All data handling follows FERPA and COPPA guidelines.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onRequestPermission}
              disabled={isRequestingPermission}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              data-testid="allow-microphone-button"
            >
              {isRequestingPermission ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Allow Microphone
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium"
              data-testid="maybe-later-button"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // SG-ST-06: Success feedback
  const renderSuccessStage = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">✅ WaveListener is Ready!</h2>
          <p className="text-gray-600 mb-4">
            You can now mark your group as Ready. Your microphone will automatically activate when the session starts.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            data-testid="success-continue-button"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  // SG-ST-04: Enhanced permission denial flow
  const renderDeniedStage = () => {
    const getBrowserInstructions = () => {
      switch (browser.name) {
        case 'Chrome':
          return {
            steps: [
              'Look for the 🎤 icon in the address bar',
              'Click it and select "Always allow" for microphone',
              'Refresh this page and try again'
            ],
            settingsPath: 'Settings > Privacy and security > Site Settings > Microphone'
          };
        case 'Safari':
          return {
            steps: [
              'Look for the microphone icon in the address bar',
              'Click it and select "Allow"',
              'Or go to Safari menu > Settings for This Website'
            ],
            settingsPath: 'Safari > Settings > Websites > Microphone'
          };
        case 'Firefox':
          return {
            steps: [
              'Look for the 🎤 icon in the address bar',
              'Click it and select "Allow"',
              'Make sure to check "Remember this decision"'
            ],
            settingsPath: 'Settings > Privacy & Security > Permissions > Microphone'
          };
        case 'Edge':
          return {
            steps: [
              'Look for the 🎤 icon in the address bar',
              'Click it and select "Allow"',
              'Refresh this page and try again'
            ],
            settingsPath: 'Settings > Cookies and site permissions > Microphone'
          };
        default:
          return {
            steps: [
              'Look for a microphone icon in your browser',
              'Allow microphone access for this site',
              'Refresh and try again'
            ],
            settingsPath: 'Check your browser settings for microphone permissions'
          };
      }
    };

    const instructions = getBrowserInstructions();

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Microphone Access Needed</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Error message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                {permissionError || 'Microphone permission was denied. WaveListener needs access to participate in the session.'}
              </p>
            </div>

            {/* Browser-specific instructions */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span>{browser.icon}</span>
                Instructions for {browser.name}:
              </h3>
              <ol className="space-y-2 text-sm text-gray-700">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="bg-blue-100 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Advanced help toggle */}
            <div className="mb-4">
              <button
                onClick={() => setShowTechnicalHelp(!showTechnicalHelp)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                data-testid="show-technical-help"
              >
                <ExternalLink className="h-3 w-3" />
                {showTechnicalHelp ? 'Hide' : 'Show'} technical help
              </button>

              {showTechnicalHelp && (
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
                  <p className="font-medium mb-1">Advanced Settings:</p>
                  <p>{instructions.settingsPath}</p>
                  <p className="mt-2">Make sure this site (classwaves.com) is allowed to access your microphone.</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {/* SG-ST-05: "Grant Permission" button with fallback help */}
              <button
                onClick={onRetry || onRequestPermission}
                disabled={isRequestingPermission}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                data-testid="retry-permission-button"
              >
                {isRequestingPermission ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Try Again
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg transition-colors"
                data-testid="skip-for-now-button"
              >
                Skip for Now
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              Need help? Contact your teacher or IT support if these steps don&apos;t work.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render based on current stage
  switch (stage) {
    case 'explanation':
      return renderExplanationStage();
    case 'success':
      return renderSuccessStage();
    case 'denied':
      return renderDeniedStage();
    default:
      return null;
  }
}
