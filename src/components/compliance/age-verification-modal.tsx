'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface AgeVerificationModalProps {
  sessionId: string;
  studentName: string;
  onVerified: (dateOfBirth: Date, requiresConsent: boolean) => void;
  onCancel: () => void;
}

export function AgeVerificationModal({
  sessionId,
  studentName,
  onVerified,
  onCancel
}: AgeVerificationModalProps) {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const calculateAge = (dob: Date): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const dob = new Date(dateOfBirth);
      const age = calculateAge(dob);

      if (age < 4) {
        setError('Students must be at least 4 years old to use ClassWaves');
        setIsVerifying(false);
        return;
      }

      const requiresConsent = age < 13;
      onVerified(dob, requiresConsent);
    } catch (err) {
      setError('Please enter a valid date');
      console.error('Age verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Age Verification Required</h2>
            <p className="text-gray-600 mt-2 text-sm">
              To keep ClassWaves safe for all students, we need to verify your age.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="date-of-birth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                id="date-of-birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This information is kept private and secure
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">Why we ask for your age:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• To follow important safety rules (COPPA)</li>
                <li>• Students under 13 need parent permission</li>
                <li>• Your recordings are always kept safe</li>
                <li>• Everything is deleted after 24 hours</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isVerifying || !dateOfBirth}
              >
                {isVerifying ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}