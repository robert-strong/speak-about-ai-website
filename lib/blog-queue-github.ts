import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/blog-queue-db'

/**
 * Shared helpers for the blog-queue routes that talk to the GitHub Actions API.
 */

export interface GitHubConfig {
  token: string
  repo: string
}

/**
 * Resolve the GitHub token and repo, or return an error response explaining
 * what is missing.
 */
export async function getGitHubConfig(): Promise<
  { config: GitHubConfig; error: null } | { config: null; error: NextResponse }
> {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO || (await getSetting('github_repo'))

  if (!token) {
    return {
      config: null,
      error: NextResponse.json(
        {
          error: 'GitHub token is not configured',
          details: 'Set the GITHUB_TOKEN environment variable in Vercel and redeploy.',
          code: 'GITHUB_TOKEN_MISSING',
        },
        { status: 500 }
      ),
    }
  }

  if (!repo) {
    return {
      config: null,
      error: NextResponse.json(
        {
          error: 'GitHub repository is not configured',
          details: 'Set the GITHUB_REPO environment variable or the github_repo setting (owner/repo).',
          code: 'GITHUB_REPO_MISSING',
        },
        { status: 500 }
      ),
    }
  }

  return { config: { token, repo }, error: null }
}

export function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/**
 * Translate a failed GitHub API response into a clear error for the admin UI.
 *
 * GitHub's own status is never passed through as ours: a GitHub 401 would
 * otherwise look like the admin's session had expired. Upstream failures are
 * reported as 502 (bad gateway) with a message that says what to fix.
 */
export async function githubErrorResponse(
  response: Response,
  context: { action: string; repo: string; workflowFile?: string }
): Promise<NextResponse> {
  const body = await response.text().catch(() => '')
  let githubMessage = ''
  try {
    githubMessage = JSON.parse(body)?.message || ''
  } catch {
    githubMessage = body.slice(0, 200)
  }

  console.error(`GitHub API error while trying to ${context.action}:`, response.status, body)

  let error: string
  let details: string
  let code: string

  switch (response.status) {
    case 401:
      error = 'GitHub token rejected'
      details =
        'GitHub reported bad credentials. The GITHUB_TOKEN in Vercel has expired or been revoked. Create a new token and redeploy.'
      code = 'GITHUB_TOKEN_REJECTED'
      break
    case 403:
      error = 'GitHub token lacks permission'
      details = `The token cannot ${context.action} on ${context.repo}. It needs Actions: Read and write (fine-grained) or the repo and workflow scopes (classic).`
      code = 'GITHUB_FORBIDDEN'
      break
    case 404:
      error = context.workflowFile
        ? `Workflow ${context.workflowFile} not found`
        : `Repository ${context.repo} not found`
      details = context.workflowFile
        ? `GitHub could not find ${context.workflowFile} in ${context.repo}. Either the file is missing from the main branch or the token has no access to the repository.`
        : `GitHub could not find ${context.repo}, or the token has no access to it.`
      code = 'GITHUB_NOT_FOUND'
      break
    case 422:
      error = 'GitHub rejected the workflow inputs'
      details = githubMessage || 'The workflow inputs did not match what the workflow file declares.'
      code = 'GITHUB_UNPROCESSABLE'
      break
    default:
      error = `GitHub API error (${response.status})`
      details = githubMessage || `Failed to ${context.action}.`
      code = 'GITHUB_ERROR'
  }

  return NextResponse.json({ error, details, code, githubStatus: response.status }, { status: 502 })
}
