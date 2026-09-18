import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { getGitHubConfig, githubHeaders, githubErrorResponse } from '@/lib/blog-queue-github'

const WORKFLOW_FILES: Record<string, string> = {
  'generate-briefs': 'generate-briefs.yml',
  'draft-articles': 'draft-articles.yml',
  'publish-articles': 'publish-articles.yml',
  'full-pipeline': 'blog-pipeline.yml',
}

export async function POST(request: NextRequest) {
  // Require a valid admin session (adminSessionToken cookie or Bearer token)
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const data = await request.json()
    const { workflow, inputs } = data

    if (!workflow || typeof workflow !== 'string') {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    const workflowFile = WORKFLOW_FILES[workflow]
    if (!workflowFile) {
      return NextResponse.json(
        {
          error: `Unknown workflow "${workflow}"`,
          details: `Expected one of: ${Object.keys(WORKFLOW_FILES).join(', ')}`,
        },
        { status: 400 }
      )
    }

    const { config, error: configError } = await getGitHubConfig()
    if (configError) return configError

    // Trigger GitHub Actions workflow
    const response = await fetch(
      `https://api.github.com/repos/${config.repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          ...githubHeaders(config.token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: inputs || {},
        }),
      }
    )

    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: `Workflow ${workflow} triggered successfully`,
        workflow: workflowFile,
      })
    }

    return githubErrorResponse(response, {
      action: `trigger ${workflowFile}`,
      repo: config.repo,
      workflowFile,
    })
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger workflow',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
