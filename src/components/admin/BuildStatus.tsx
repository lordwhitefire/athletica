'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Clock, AlertTriangle } from 'lucide-react'

interface BuildStatus {
  status: 'idle' | 'success' | 'failed' | 'error'
  lastBuild?: string
  dataTypes?: Record<string, string>
  errors?: Array<{ type: string; error: string }>
  buildId?: string
  success?: boolean
}

interface BuildStatusProps {
  className?: string
}

export default function BuildStatus({ className = '' }: BuildStatusProps) {
  const [status, setStatus] = useState<BuildStatus>({
    status: 'idle',
    lastBuild: null,
    dataTypes: {},
    errors: []
  })
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Poll for build status every 30 seconds
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch('/api/admin/build-status')
        const data = await response.json()
        setStatus(data)
        setLastChecked(new Date())
      } catch (error) {
        console.error('Failed to fetch build status:', error)
        setStatus(prev => ({
          ...prev,
          status: 'error',
          errors: [{ type: 'API', error: 'Failed to fetch status' }]
        }))
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    pollStatus()

    // Set up polling interval
    const interval = setInterval(pollStatus, 30000) // 30 seconds

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return 'Invalid time'
    }
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusMessage = () => {
    switch (status.status) {
      case 'success':
        return 'Build successful'
      case 'failed':
        return 'Build failed'
      case 'error':
        return 'Error checking status'
      default:
        return 'No recent builds'
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'error':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const successfulTypes = Object.entries(status.dataTypes || {}).filter(([_, typeStatus]) => 
    typeStatus === 'success'
  ).length

  const failedTypes = Object.entries(status.dataTypes || {}).filter(([_, typeStatus]) => 
    typeStatus?.includes('failed')
  ).length

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()} ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          getStatusIcon()
        )}
        <div className="flex-1">
          <h3 className="font-medium text-sm">
            {loading ? 'Checking status...' : getStatusMessage()}
          </h3>
          {status.buildId && (
            <p className="text-xs opacity-75">Build ID: {status.buildId}</p>
          )}
        </div>
        {lastChecked && (
          <span className="text-xs opacity-75">
            Updated {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>

      {status.lastBuild && (
        <div className="text-xs mb-2 opacity-75">
          Last build: {formatTime(status.lastBuild)}
        </div>
      )}

      {(successfulTypes > 0 || failedTypes > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>✅ Successful: {successfulTypes}</span>
            <span>❌ Failed: {failedTypes}</span>
          </div>
          
          {failedTypes > 0 && (
            <div className="mt-2 space-y-1">
              {status.errors?.map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-1 rounded">
                  <strong>{error.type}:</strong> {error.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status.status === 'idle' && (
        <p className="text-xs opacity-75">
          Waiting for first build...
        </p>
      )}
    </div>
  )
}