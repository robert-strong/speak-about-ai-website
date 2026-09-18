import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { getGitHubConfig, githubHeaders, githubErrorResponse } from '@/lib/blog-queue-github'

export async function GET(request: NextRequest) {
  // Require a valid admin session (adminSessionToken cookie or Bearer token)
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { config, error: configError } = await getGitHubConfig()
    if (configError) return configError

    // Fetch recent workflow runs
    const response = await fetch(
      `https://api.github.com/repos/${config.repo}/actions/runs?per_page=10`,
      { headers: githubHeaders(config.token) }
    )

    if (!response.ok) {
      return githubErrorResponse(response, {
        action: 'list workflow runs',
        repo: config.repo,
      })
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
      actor: run.actor
        ? {
            login: run.actor.login,
            avatar_url: run.actor.avatar_url,
          }
        : null,
    }))

    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Error fetching workflow runs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch workflow runs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
