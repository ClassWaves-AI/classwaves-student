'use client';

import React, { useState } from 'react';
import { Mail, Shield } from 'lucide-react';

interface ParentalConsentRequiredProps {
  studentName: string;
  onCancel: () => void;
  onConsentProvided?: () => void;
}

export function ParentalConsentRequired({
  studentName,
  onCancel,
  onConsentProvided
}: ParentalConsentRequiredProps) {
  const [parentEmail, setParentEmail] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail.trim() || !consentChecked) {
      return;
    }
    
    setIsSubmitting(true);
    // Simulate consent submission - in real implementation, this would call an API
    setTimeout(() => {
      setIsSubmitting(false);
      onConsentProvided?.();
    }, 1000);
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div data-testid="parental-consent-modal" className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-16 w-16 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Parent Permission Needed</h2>
            <p className="text-gray-600 mt-2">
              A parent or guardian must provide consent for you to continue.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">
                  What happens next:
                </p>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Your teacher will contact your parent</li>
                  <li>• They&apos;ll get an email to give permission</li>
                  <li>• Once approved, you can join the class!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Why do we need permission?</h3>
            <p className="text-xs text-blue-800">
              It&apos;s a law called COPPA that helps keep kids safe online. We take your privacy very seriously!
            </p>
          </div>

          <form onSubmit={handleSubmitConsent} className="space-y-4">
            <div>
              <label htmlFor="parent-email" className="block text-sm font-medium text-gray-700 mb-1">
                Parent/Guardian Email Address
              </label>
              <input
                id="parent-email"
                data-testid="parent-email-input"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="Enter parent's email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                id="consent-checkbox"
                data-testid="consent-checkbox"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label htmlFor="consent-checkbox" className="text-sm text-gray-700">
                I confirm that my parent/guardian has given permission for me to use ClassWaves and agrees to the privacy policy.
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                Go Back
              </button>
              <button
                type="submit"
                data-testid="submit-consent-button"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!parentEmail.trim() || !consentChecked || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Consent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}