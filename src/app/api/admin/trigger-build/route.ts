import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Trigger GitHub Action workflow
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/workflows/sanity-json-update.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          ref: 'main', // or your main branch
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to trigger GitHub Action');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Build triggered successfully' 
    });
  } catch (error) {
    console.error('Error triggering build:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to trigger build',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}