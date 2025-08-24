'use client';

import { useState } from 'react';
import { X, Volume2, Brain, Shield, Users, ChevronDown, ChevronRight } from 'lucide-react';

interface WaveListenerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'first-time' | 'help';  // first-time shows on first join, help shows on demand
}

export function WaveListenerInfoModal({ 
  isOpen, 
  onClose, 
  mode = 'help' 
}: WaveListenerInfoModalProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const faqSections = [
    {
      id: 'how-it-works',
      question: 'How does WaveListener work?',
      answer: 'WaveListener uses AI to analyze your group discussions in real-time. It listens for patterns in conversation, identifies key topics, and provides insights to help improve your collaborative learning experience.'
    },
    {
      id: 'privacy',
      question: 'Is my voice recorded and stored?',
      answer: 'No! WaveListener processes audio in real-time but does not permanently store your voice recordings. Audio data is analyzed and then immediately discarded, following strict privacy guidelines including FERPA and COPPA compliance.'
    },
    {
      id: 'what-analyzed',
      question: 'What exactly is being analyzed?',
      answer: 'WaveListener analyzes speech patterns, participation levels, topic transitions, and collaboration dynamics. It does NOT identify individual voices or store personal voice data. The focus is on group learning patterns, not individual identification.'
    },
    {
      id: 'teacher-sees',
      question: 'What does my teacher see?',
      answer: 'Teachers receive aggregate insights about group collaboration, discussion topics, and engagement patterns. They do not receive individual voice recordings or personal audio data. All insights are focused on improving the learning experience.'
    },
    {
      id: 'opt-out',
      question: 'Can I opt out or pause?',
      answer: 'Yes! As a group leader, you control when WaveListener is active. You can pause or stop audio capture at any time during the session. Your participation is important, but your comfort is our priority.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">What is WaveListener?</h2>
                <p className="text-sm text-gray-600">Understanding AI-powered collaborative learning</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
              data-testid="close-info-modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* First-time welcome */}
          {mode === 'first-time' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Welcome to your first ClassWaves session! 👋</h3>
              <p className="text-sm text-blue-800">
                Your teacher is using WaveListener to enhance group learning. Here&apos;s what you need to know:
              </p>
            </div>
          )}

          {/* Overview */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Learning Assistant
            </h3>
            <p className="text-gray-700 leading-relaxed">
              WaveListener is an artificial intelligence system that helps improve group collaboration by analyzing 
              discussion patterns and providing insights to both students and teachers. It&apos;s designed to enhance 
              your learning experience while protecting your privacy.
            </p>
          </div>

          {/* Key Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Group Collaboration Analysis</p>
                  <p className="text-sm text-gray-600">Identifies discussion patterns and participation levels</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Real-time Insights</p>
                  <p className="text-sm text-gray-600">Provides feedback to help improve group dynamics</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Privacy-First Design</p>
                  <p className="text-sm text-gray-600">No permanent voice storage, FERPA/COPPA compliant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Emphasis */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Your Privacy is Protected</h3>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Audio is processed in real-time and immediately discarded</li>
              <li>• No voice recordings are permanently stored</li>
              <li>• Individual voices are not identified or tracked</li>
              <li>• All analysis focuses on group patterns, not individual behavior</li>
              <li>• Complies with FERPA and COPPA privacy regulations</li>
            </ul>
          </div>

          {/* FAQ Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {faqSections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                    data-testid={`faq-toggle-${section.id}`}
                  >
                    <span className="font-medium text-gray-900">{section.question}</span>
                    {expandedSection === section.id ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSection === section.id && (
                    <div className="px-3 pb-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{section.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {mode === 'first-time' ? (
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                data-testid="got-it-button"
              >
                Got it! Let&apos;s start
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                data-testid="close-help-button"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SG-ST-16: Persistent help icon component
interface WaveListenerHelpIconProps {
  onClick: () => void;
  className?: string;
}

export function WaveListenerHelpIcon({ onClick, className = '' }: WaveListenerHelpIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors text-blue-600 hover:text-blue-700"
        data-testid="wavelistener-help-icon"
        aria-label="What is WaveListener?"
      >
        <Volume2 className="h-4 w-4" />
      </button>
      
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
          What is WaveListener?
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}
