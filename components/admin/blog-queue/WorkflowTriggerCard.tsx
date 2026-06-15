'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Play,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  Zap,
  FileText,
  Send
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  run_number: number
  created_at: string
  html_url: string
  head_sha: string
  actor?: {
    login: string
    avatar_url: string
  }
}

export function WorkflowTriggerCard() {
  const { toast } = useToast()
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [briefCount, setBriefCount] = useState('5')

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/blog-queue/workflow-runs', {
        headers: { 'x-admin-request': 'true' }
      })
      if (response.ok) {
        const data = await response.json()
        setRuns(data.runs || [])
      }
    } catch (error) {
      console.error('Error fetching workflow runs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
    // Poll every 30 seconds when there are in-progress runs
    const interval = setInterval(() => {
      if (runs.some(r => r.status === 'in_progress' || r.status === 'queued')) {
        fetchRuns()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const triggerWorkflow = async (workflow: string, inputs?: Record<string, string>) => {
    setTriggering(workflow)
    try {
      const response = await fetch('/api/admin/blog-queue/trigger-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-request': 'true'
        },
        body: JSON.stringify({ workflow, inputs })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Workflow Triggered',
          description: data.message || `${workflow} workflow started`
        })
        // Refresh runs after a short delay
        setTimeout(fetchRuns, 2000)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to trigger workflow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error triggering workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to trigger workflow',
        variant: 'destructive'
      })
    } finally {
      setTriggering(null)
    }
  }

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'completed') {
      if (conclusion === 'success') {
        return <CheckCircle className="h-4 w-4 text-green-500" />
      } else if (conclusion === 'failure') {
        return <XCircle className="h-4 w-4 text-red-500" />
      } else {
        return <Clock className="h-4 w-4 text-gray-500" />
      }
    }
    if (status === 'in_progress') {
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
    }
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === 'completed') {
      if (conclusion === 'success') {
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      } else if (conclusion === 'failure') {
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      } else {
        return <Badge variant="secondary">{conclusion || 'Completed'}</Badge>
      }
    }
    if (status === 'in_progress') {
      return <Badge className="bg-yellow-100 text-yellow-800">Running</Badge>
    }
    if (status === 'queued') {
      return <Badge variant="outline">Queued</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>GitHub Actions Workflows</CardTitle>
            <CardDescription>
              Trigger blog pipeline workflows and monitor their status
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRuns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Generate Briefs</h4>
            </div>
            <p className="text-sm text-gray-500">
              Use Claude to generate new blog briefs with web search
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="count" className="text-sm">Count:</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="10"
                value={briefCount}
                onChange={(e) => setBriefCount(e.target.value)}
                className="w-16 h-8"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => triggerWorkflow('generate-briefs', { count: briefCount })}
              disabled={triggering === 'generate-briefs'}
            >
              {triggering === 'generate-briefs' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Generate Briefs
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium">Draft Articles</h4>
            </div>
            <p className="text-sm text-gray-500">
              Generate article content from queued briefs
            </p>
            <Button
              className="w-full mt-auto"
              variant="outline"
              onClick={() => triggerWorkflow('draft-articles')}
              disabled={triggering === 'draft-articles'}
            >
              {triggering === 'draft-articles' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Draft Articles
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              <h4 className="font-medium">Publish to Contentful</h4>
            </div>
            <p className="text-sm text-gray-500">
              Publish drafted articles to Contentful CMS
            </p>
            <Button
              className="w-full mt-auto"
              variant="outline"
              onClick={() => triggerWorkflow('publish-articles')}
              disabled={triggering === 'publish-articles'}
            >
              {triggering === 'publish-articles' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Publish Articles
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <Play className="h-4 w-4 mr-2" />
                Run Full Pipeline
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Pipeline Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => triggerWorkflow('full-pipeline')}
                disabled={triggering === 'full-pipeline'}
              >
                {triggering === 'full-pipeline' && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Run All Steps
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => triggerWorkflow('full-pipeline', { skip_briefs: 'true' })}
              >
                Skip Brief Generation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => triggerWorkflow('full-pipeline', { dry_run: 'true' })}
              >
                Dry Run (No Publishing)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Recent Runs */}
        <div>
          <h4 className="font-medium mb-3">Recent Workflow Runs</h4>
          {loading && runs.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : runs.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No workflow runs yet. Configure GitHub Actions to enable pipeline automation.
            </p>
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status, run.conclusion)}
                    <div>
                      <p className="font-medium text-sm">{run.name}</p>
                      <p className="text-xs text-gray-500">
                        #{run.run_number} • {new Date(run.created_at).toLocaleString()}
                        {run.actor && ` • ${run.actor.login}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(run.status, run.conclusion)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(run.html_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
