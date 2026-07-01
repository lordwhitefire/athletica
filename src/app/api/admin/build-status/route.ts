import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'

export async function GET() {
  try {
    // Read the build metadata file
    const metadataPath = process.cwd() + '/data/build-metadata.json'
    
    let buildStatus = {
      status: 'idle',
      lastBuild: null,
      dataTypes: {},
      errors: [],
      buildId: null,
      success: false
    }

    try {
      const fileContent = await fs.readFile(metadataPath, 'utf-8')
      const metadata = JSON.parse(fileContent)
      
      // Determine overall status
      const hasErrors = metadata.errors && metadata.errors.length > 0
      buildStatus = {
        status: hasErrors ? 'failed' : 'success',
        lastBuild: metadata.endTime || metadata.startTime,
        dataTypes: metadata.dataTypes || {},
        errors: metadata.errors || [],
        buildId: metadata.buildId,
        success: metadata.success || false
      }
    } catch (error) {
      // If metadata file doesn't exist or is corrupted, return idle status
      console.warn('Could not read build metadata:', error instanceof Error ? error.message : error)
    }

    return NextResponse.json(buildStatus)
  } catch (error) {
    console.error('Error in build status API:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch build status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, buildId, timestamp, error } = body

    // Log the webhook notification
    console.log('Build status webhook received:', { status, buildId, timestamp })

    // You could store this in a database for more persistent tracking
    // For now, we'll just log it
    const webhookLog = {
      timestamp: new Date().toISOString(),
      receivedStatus: status,
      buildId,
      error,
      source: 'github-action'
    }

    // Save webhook log (optional)
    try {
      const logPath = process.cwd() + '/data/webhook-logs.json'
      let logs = []
      
      // Read existing logs
      try {
        const existingContent = await fs.readFile(logPath, 'utf-8')
        logs = JSON.parse(existingContent)
      } catch (error) {
        // File doesn't exist or is empty, start fresh
        logs = []
      }
      
      // Add new log entry
      logs.unshift(webhookLog)
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs = logs.slice(0, 100)
      }
      
      // Save logs
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.warn('Failed to save webhook log:', error)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Build status notification received',
      received: webhookLog 
    })
  } catch (error) {
    console.error('Error in build status webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 400 }
    )
  }
}