'use client';

import React from 'react';
import { Mail, Shield } from 'lucide-react';

interface ParentalConsentRequiredProps {
  studentName: string;
  parentEmail?: string;
  onCancel: () => void;
}

export function ParentalConsentRequired({
  studentName,
  parentEmail,
  onCancel
}: ParentalConsentRequiredProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-16 w-16 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Parent Permission Needed</h2>
            <p className="text-gray-600 mt-2">
              Hi {studentName}! Because you're under 13, we need your parent or guardian's permission first.
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
                  <li>• They'll get an email to give permission</li>
                  <li>• Once approved, you can join the class!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Why do we need permission?</h3>
            <p className="text-xs text-blue-800">
              It's a law called COPPA that helps keep kids safe online. We take your privacy very seriously!
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Please let your teacher know so they can help get permission from your parent.
            </p>
            
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}