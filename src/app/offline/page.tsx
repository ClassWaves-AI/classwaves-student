'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function OfflinePage() {
  const [pendingUploads, setPendingUploads] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Start syncing
      syncPendingUploads()
    }
    
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load pending uploads from local storage
    const stored = localStorage.getItem('pendingUploads')
    if (stored) {
      setPendingUploads(JSON.parse(stored))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncPendingUploads = async () => {
    // In a real app, this would upload pending recordings
    console.log('Syncing pending uploads...')
    
    // Simulate upload
    setTimeout(() => {
      setPendingUploads([])
      localStorage.removeItem('pendingUploads')
    }, 3000)
  }

  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Status Header */}
        <div className="text-center">
          {isOnline ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Back Online</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-yellow-700">
              <WifiOff className="h-5 w-5" />
              <span className="font-medium">Offline Mode</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Offline Storage</h1>
          
          {pendingUploads.length === 0 ? (
            <div className="mt-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">No pending uploads</p>
              <p className="mt-1 text-sm text-gray-500">
                Recordings will appear here when you&apos;re offline
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">
                {pendingUploads.length} recording{pendingUploads.length > 1 ? 's' : ''} waiting to upload
              </p>
              
              {pendingUploads.map((upload, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Recording {idx + 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        {upload.duration || '2:34'} • {upload.size || '1.2 MB'}
                      </p>
                    </div>
                  </div>
                  {isOnline && (
                    <div className="text-sm text-green-600">Syncing...</div>
                  )}
                </div>
              ))}
              
              {!isOnline && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                      Recordings will upload automatically when you&apos;re back online
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isOnline && pendingUploads.length > 0 && (
            <button
              onClick={syncPendingUploads}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700"
            >
              Sync Now
            </button>
          )}
          
          <a
            href="/"
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}