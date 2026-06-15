import { NextRequest, NextResponse } from 'next/server'
import { getSetting } from '@/lib/blog-queue-db'

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { workflow, inputs } = data

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    // Get GitHub config from environment or settings
    const githubToken = process.env.GITHUB_TOKEN
    const githubRepo = process.env.GITHUB_REPO || await getSetting('github_repo')

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GITHUB_TOKEN environment variable is not configured' },
        { status: 500 }
      )
    }

    if (!githubRepo) {
      return NextResponse.json(
        { error: 'GitHub repository is not configured. Set GITHUB_REPO env var or github_repo setting.' },
        { status: 500 }
      )
    }

    // Determine workflow file based on workflow name
    let workflowFile: string
    switch (workflow) {
      case 'generate-briefs':
        workflowFile = 'generate-briefs.yml'
        break
      case 'draft-articles':
        workflowFile = 'draft-articles.yml'
        break
      case 'publish-articles':
        workflowFile = 'publish-articles.yml'
        break
      case 'full-pipeline':
        workflowFile = 'blog-pipeline.yml'
        break
      default:
        workflowFile = `${workflow}.yml`
    }

    // Trigger GitHub Actions workflow
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: inputs || {}
        })
      }
    )

    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: `Workflow ${workflow} triggered successfully`,
        workflow: workflowFile
      })
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: `Workflow file ${workflowFile} not found in repository ${githubRepo}` },
        { status: 404 }
      )
    }

    const errorText = await response.text()
    console.error('GitHub API error:', response.status, errorText)
    return NextResponse.json(
      { error: `Failed to trigger workflow: ${response.status}`, details: errorText },
      { status: response.status }
    )
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    )
  }
}
