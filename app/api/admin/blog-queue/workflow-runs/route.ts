import { NextRequest, NextResponse } from 'next/server'
import { getSetting } from '@/lib/blog-queue-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        { error: 'GitHub repository is not configured' },
        { status: 500 }
      )
    }

    // Fetch recent workflow runs
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/runs?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch workflow runs: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transform to a simpler format
    const runs = data.workflow_runs.map((run: any) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      workflow_id: run.workflow_id,
      run_number: run.run_number,
      event: run.event,
      created_at: run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url,
      head_branch: run.head_branch,
      head_sha: run.head_sha?.substring(0, 7),
      run_started_at: run.run_started_at,
      actor: run.actor ? {
        login: run.actor.login,
        avatar_url: run.actor.avatar_url
      } : null
    }))

    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Error fetching workflow runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs' },
      { status: 500 }
    )
  }
}
