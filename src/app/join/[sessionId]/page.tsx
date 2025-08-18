'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [email, setEmail] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [showAgeVerification, setShowAgeVerification] = useState(false)
  const [showParentalConsent, setShowParentalConsent] = useState(false)
  
  const { setAuth, setSession, setGroup } = useStudentStore()

  // Auto-populate email from URL parameters on component mount
  useEffect(() => {
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setEmail(emailFromUrl)
      console.log('✅ Email auto-populated from invitation link:', emailFromUrl)
    }
  }, [searchParams])

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!studentName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!email.trim()) {
      setError('Email address is required to join as a group leader')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
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
        email: email.trim(),
        gradeLevel: gradeLevel || undefined,
        dateOfBirth: dateOfBirth.toISOString(),
      })

      // Store authentication info (map to store types)
      const studentData = {
        id: response.student.id,
        name: response.student.displayName,
        sessionId: response.session.id,
        ...(response.student.email && { email: response.student.email }),
        ...(response.student.isGroupLeader !== undefined && { isGroupLeader: response.student.isGroupLeader }),
        ...(response.student.isFromRoster !== undefined && { isFromRoster: response.student.isFromRoster }),
      };
      setAuth(response.token, studentData)

      // Auto-populate form if user details were found in roster
      if (response.student.isFromRoster) {
        setStudentName(response.student.displayName)
        if (response.student.email) {
          setEmail(response.student.email)
        }
        console.log('✅ Student details auto-populated from roster')
      }
      setSession({ id: response.session.id, title: '', status: 'active' })
      if (response.group) {
        // Check if this student is the leader of the assigned group
        const isLeader = response.group.leaderId === response.student.id;
        setGroup({ 
          id: response.group.id, 
          name: response.group.name, 
          members: [],
          isLeader: isLeader,
          isReady: false // Initial state - group is not ready
        })
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {email ? 'Confirm Your Email Address' : 'Your Email Address'}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder={email ? 'Email address from invitation' : 'Enter your email address'}
              className={`mt-1 block w-full rounded-lg border px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                email ? 'bg-green-50 border-green-300' : 'border-gray-300'
              }`}
              autoComplete="email"
              disabled={isJoining}
            />
            {email && (
              <p className="mt-1 text-sm text-green-600">
                ✅ Email auto-populated from your invitation
              </p>
            )}
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