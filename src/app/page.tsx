'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic } from 'lucide-react'

export default function HomePage() {
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!joinCode.trim()) {
      setError('Please enter a join code')
      return
    }

    if (joinCode.length < 4) {
      setError('Join code must be at least 4 characters')
      return
    }

    // Navigate to join page
    router.push(`/join/${joinCode}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-6">
            <Mic className="h-16 w-16 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">ClassWaves</h1>
          <p className="mt-2 text-lg text-gray-600">Join your classroom session</p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoinSession} className="space-y-6">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700">
              Session Code
            </label>
            <input
              id="joinCode"
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="Enter code from your teacher"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-semibold uppercase tracking-widest shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={8}
              autoComplete="off"
              autoCapitalize="characters"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="touch-target w-full rounded-lg bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Join Session
          </button>
        </form>

        {/* Instructions */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900">How to join:</h3>
          <ol className="mt-2 space-y-1 text-sm text-gray-600">
            <li>1. Get the session code from your teacher</li>
            <li>2. Enter the code above</li>
            <li>3. Tap &quot;Join Session&quot;</li>
            <li>4. Wait for your teacher to start recording</li>
          </ol>
        </div>
      </div>
    </div>
  )
}