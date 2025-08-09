'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Loader2 } from 'lucide-react'
import { joinSession } from '@/features/session-joining/api/join-session'
import { useStudentStore } from '@/stores/student-store'
import { AgeVerificationModal } from '@/components/compliance/age-verification-modal'
import { ParentalConsentRequired } from '@/components/compliance/parental-consent-required'

interface JoinPageProps {
  params: {
    sessionId: string
  }
}

export default function JoinPage({ params }: JoinPageProps) {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [showAgeVerification, setShowAgeVerification] = useState(false)
  const [showParentalConsent, setShowParentalConsent] = useState(false)
  
  const { setAuth, setSession, setGroup } = useStudentStore()

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!studentName.trim()) {
      setError('Please enter your name')
      return
    }

    // Show age verification modal first
    setShowAgeVerification(true)
  }

  const handleAgeVerified = async (dateOfBirth: Date, requiresConsent: boolean) => {
    setShowAgeVerification(false)

    if (requiresConsent) {
      // Student is under 13, needs parental consent
      setShowParentalConsent(true)
      return
    }

    // Student is 13 or older, proceed with joining
    await completeJoinSession(dateOfBirth)
  }

  const completeJoinSession = async (dateOfBirth: Date) => {
    setIsJoining(true)
    setError('')

    try {
      const response = await joinSession({
        sessionCode: params.sessionId,
        studentName: studentName.trim(),
        gradeLevel: gradeLevel || undefined,
        dateOfBirth: dateOfBirth.toISOString(),
      })

      // Store authentication info (map to store types)
      setAuth(response.token, {
        id: response.student.id,
        name: response.student.displayName,
        sessionId: response.session.id,
      })
      setSession({ id: response.session.id, title: '', status: 'active' })
      if (response.group) {
        setGroup({ id: response.group.id, name: response.group.name, members: [] })
      }

      // Navigate to the session page
      router.push(`/session/${response.session.id}`)
    } catch (err: any) {
      console.error('Join session error:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 404) {
        setError('Session not found. Please check your code.')
      } else if (err.response?.status === 400) {
        setError('Session is not accepting new students.')
      } else {
        setError('Failed to join session. Please try again.')
      }
      setIsJoining(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Session Info */}
        <div className="rounded-lg bg-blue-50 p-6">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Join Classroom Session
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Session Code: <span className="font-mono font-bold">{params.sessionId}</span>
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoinSession} className="space-y-4">
          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <input
              id="studentName"
              type="text"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value)
                setError('')
              }}
              placeholder="Enter your first name"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoComplete="given-name"
              autoFocus
              disabled={isJoining}
            />
          </div>

          <div>
            <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">
              Grade Level (Optional)
            </label>
            <select
              id="gradeLevel"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isJoining}
            >
              <option value="">Select grade</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="touch-target w-full rounded-lg bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Joining...
              </span>
            ) : (
              'Join Session'
            )}
          </button>
        </form>

        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
        >
          Use a different code
        </button>
      </div>

      {/* Age Verification Modal */}
      {showAgeVerification && (
        <AgeVerificationModal
          sessionId={params.sessionId}
          studentName={studentName}
          onVerified={handleAgeVerified}
          onCancel={() => setShowAgeVerification(false)}
        />
      )}

      {/* Parental Consent Required Modal */}
      {showParentalConsent && (
        <ParentalConsentRequired
          studentName={studentName}
          onCancel={() => {
            setShowParentalConsent(false)
            setStudentName('')
            setGradeLevel('')
          }}
        />
      )}
    </div>
  )
}