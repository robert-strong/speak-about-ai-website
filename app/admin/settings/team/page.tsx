"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPost, authPut, authDelete } from "@/lib/auth-fetch"
import {
  Users,
  Plus,
  Trash2,
  Save,
  Send,
  Mail,
  Shield,
  UserPlus,
  Edit3,
  X,
  Check,
  AlertTriangle,
  Info,
  Eye,
  Copy,
  KeyRound,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react"

interface TeamMember {
  id: number
  name: string
  email: string
  role_id: number | null
  role_name: string | null
  role_permissions: Record<string, boolean> | null
  status: string
  last_login: string | null
  must_change_password: boolean
  created_at: string
  updated_at: string
}

interface RoleOption {
  id: number
  name: string
}

interface EmailTemplate {
  template_key: string
  subject: string
  body_html: string
}

export default function TeamSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [runningMigration, setRunningMigration] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'welcome-email'>('members')

  // Team members state
  const [members, setMembers] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [sendingWelcome, setSendingWelcome] = useState<number | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [tempPasswordMemberId, setTempPasswordMemberId] = useState<number | null>(null)

  // New member form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRoleId, setNewRoleId] = useState<number | null>(null)

  // Edit form
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRoleId, setEditRoleId] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState('active')

  // Welcome email template
  const [template, setTemplate] = useState<EmailTemplate>({
    template_key: 'welcome_team_member',
    subject: 'Welcome to the {{company_name}} Team!',
    body_html: '',
  })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadData()
  }, [router])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [membersRes, templateRes] = await Promise.all([
        authGet('/api/admin/team'),
        authGet('/api/admin/email-templates?key=welcome_team_member'),
      ])

      if (membersRes.ok) {
        const data = await membersRes.json()
        if (data.needs_migration) {
          setNeedsMigration(true)
        } else {
          setMembers(data.members || [])
          setRoles(data.roles || [])
        }
      }

      if (templateRes.ok) {
        const data = await templateRes.json()
        if (data.template && data.template.body_html) {
          setTemplate(data.template)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const runMigration = async () => {
    try {
      setRunningMigration(true)
      const response = await authPost('/api/admin/team/migrate')
      if (response.ok) {
        toast({ title: "Success", description: "Team tables created successfully" })
        setNeedsMigration(false)
        await loadData()
      } else {
        throw new Error('Migration failed')
      }
    } catch {
      toast({ title: "Error", description: "Failed to create tables", variant: "destructive" })
    } finally {
      setRunningMigration(false)
    }
  }

  const handleAddMember = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" })
      return
    }

    try {
      setSavingId(-1)
      const response = await authPost('/api/admin/team', {
        name: newName.trim(),
        email: newEmail.trim(),
        role_id: newRoleId,
      })

      if (response.ok) {
        const data = await response.json()
        toast({ title: "Member Added", description: `${newName} has been added to the team` })
        setTempPassword(data.temporary_password)
        setTempPasswordMemberId(data.member.id)
        setShowAddForm(false)
        setNewName('')
        setNewEmail('')
        setNewRoleId(null)
        await loadData()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add member", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const handleStartEdit = (member: TeamMember) => {
    setEditingId(member.id)
    setEditName(member.name)
    setEditEmail(member.email)
    setEditRoleId(member.role_id)
    setEditStatus(member.status)
  }

  const handleSaveEdit = async (memberId: number) => {
    try {
      setSavingId(memberId)
      const response = await authPut(`/api/admin/team/${memberId}`, {
        name: editName,
        email: editEmail,
        role_id: editRoleId,
        status: editStatus,
      })

      if (response.ok) {
        toast({ title: "Updated", description: `${editName} has been updated` })
        setEditingId(null)
        await loadData()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const handleResetPassword = async (memberId: number, memberName: string) => {
    if (!confirm(`Reset password for ${memberName}? A new temporary password will be generated.`)) return

    try {
      setSavingId(memberId)
      const member = members.find(m => m.id === memberId)
      if (!member) return

      const response = await authPut(`/api/admin/team/${memberId}`, {
        name: member.name,
        email: member.email,
        role_id: member.role_id,
        status: member.status,
        reset_password: true,
      })

      if (response.ok) {
        const data = await response.json()
        setTempPassword(data.temporary_password)
        setTempPasswordMemberId(memberId)
        toast({ title: "Password Reset", description: `New temporary password generated for ${memberName}` })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: "Error", description: "Failed to reset password", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team? This cannot be undone.`)) return

    try {
      const response = await authDelete(`/api/admin/team/${memberId}`)
      if (response.ok) {
        toast({ title: "Removed", description: `${memberName} has been removed` })
        await loadData()
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" })
    }
  }

  const handleSendWelcome = async (memberId: number) => {
    try {
      setSendingWelcome(memberId)
      const response = await authPost('/api/admin/team/send-welcome', { member_id: memberId })

      if (response.ok) {
        const data = await response.json()
        toast({ title: "Email Sent", description: data.message })
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: "Failed to Send", description: error.message || "Check SMTP configuration", variant: "destructive" })
    } finally {
      setSendingWelcome(null)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      setSavingTemplate(true)
      const response = await authPut('/api/admin/email-templates', {
        template_key: 'welcome_team_member',
        subject: template.subject,
        body_html: template.body_html,
      })

      if (response.ok) {
        toast({ title: "Saved", description: "Welcome email template updated" })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" })
    } finally {
      setSavingTemplate(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied", description: "Password copied to clipboard" })
  }

  const getPreviewHtml = () => {
    return template.body_html
      .replace(/\{\{name\}\}/g, 'Jane Smith')
      .replace(/\{\{email\}\}/g, 'jane@example.com')
      .replace(/\{\{temporary_password\}\}/g, 'TmpP4ssw0rd!')
      .replace(/\{\{login_url\}\}/g, `${window.location.origin}/admin`)
      .replace(/\{\{role\}\}/g, 'Sales Team')
      .replace(/\{\{company_name\}\}/g, 'Speak About AI')
  }

  if (!isLoggedIn || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed left-0 top-0 h-full z-[60]">
        <AdminSidebar />
      </div>
      <main className="flex-1 ml-72 min-h-screen overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Team Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage team members, assign roles, and configure welcome emails
            </p>
          </div>

          {/* Migration Warning */}
          {needsMigration && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Database Setup Required</AlertTitle>
              <AlertDescription className="text-amber-800">
                Team tables need to be created first.
                <div className="mt-3">
                  <Button size="sm" onClick={runMigration} disabled={runningMigration}>
                    {runningMigration ? 'Creating...' : 'Create Team Tables'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!needsMigration && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'members'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Team Members ({members.length})
                </button>
                <button
                  onClick={() => setActiveTab('welcome-email')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'welcome-email'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail className="h-4 w-4 inline mr-2" />
                  Welcome Email
                </button>
              </div>

              {/* Temp Password Banner */}
              {tempPassword && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <KeyRound className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Temporary Password Generated</AlertTitle>
                  <AlertDescription className="text-green-800">
                    <div className="flex items-center gap-3 mt-2">
                      <code className="bg-white px-3 py-1.5 rounded border border-green-200 font-mono text-lg">
                        {tempPassword}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(tempPassword)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      {tempPasswordMemberId && (
                        <Button
                          size="sm"
                          onClick={() => handleSendWelcome(tempPasswordMemberId)}
                          disabled={sendingWelcome === tempPasswordMemberId}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {sendingWelcome === tempPasswordMemberId ? 'Sending...' : 'Send Welcome Email'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setTempPassword(null); setTempPasswordMemberId(null) }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs mt-2 text-green-700">
                      Save this password now — it cannot be retrieved later. Use &quot;Send Welcome Email&quot; to email it to the user.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* ===== TEAM MEMBERS TAB ===== */}
              {activeTab === 'members' && (
                <div>
                  {/* Add Member Button */}
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </div>

                  {/* Add Member Form */}
                  {showAddForm && (
                    <Card className="mb-6 border-blue-200 bg-blue-50/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                          Add New Team Member
                        </CardTitle>
                        <CardDescription>
                          A temporary password will be auto-generated. You can send a welcome email after creating.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label>Full Name</Label>
                            <Input
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Jane Smith"
                            />
                          </div>
                          <div>
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="jane@company.com"
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <select
                              value={newRoleId || ''}
                              onChange={(e) => setNewRoleId(e.target.value ? Number(e.target.value) : null)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Select a role...</option>
                              {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddMember} disabled={savingId === -1}>
                            {savingId === -1 ? 'Adding...' : 'Add Member'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); setNewRoleId(null) }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Members Table */}
                  <Card>
                    <CardContent className="p-0">
                      {members.length === 0 ? (
                        <div className="p-12 text-center">
                          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Team Members Yet</h3>
                          <p className="text-gray-400 mb-4">Add your first team member to get started</p>
                          <Button onClick={() => setShowAddForm(true)}>
                            <UserPlus className="h-4 w-4 mr-2" /> Add First Member
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50/50">
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Member</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {members.map((member) => {
                                const isEditing = editingId === member.id
                                const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

                                return (
                                  <tr key={member.id} className="hover:bg-gray-50/50">
                                    <td className="py-3 px-4">
                                      {isEditing ? (
                                        <div className="space-y-2">
                                          <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Full Name"
                                            className="h-8 text-sm"
                                          />
                                          <Input
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="Email"
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {initials}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900 text-sm">{member.name}</div>
                                            <div className="text-xs text-gray-500">{member.email}</div>
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      {isEditing ? (
                                        <select
                                          value={editRoleId || ''}
                                          onChange={(e) => setEditRoleId(e.target.value ? Number(e.target.value) : null)}
                                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                          <option value="">No role</option>
                                          {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          <Shield className="h-3 w-3 mr-1" />
                                          {member.role_name || 'No Role'}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      {isEditing ? (
                                        <select
                                          value={editStatus}
                                          onChange={(e) => setEditStatus(e.target.value)}
                                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                          <option value="active">Active</option>
                                          <option value="inactive">Inactive</option>
                                        </select>
                                      ) : (
                                        <Badge className={`text-xs ${
                                          member.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {member.status === 'active' ? (
                                            <UserCheck className="h-3 w-3 mr-1" />
                                          ) : (
                                            <UserX className="h-3 w-3 mr-1" />
                                          )}
                                          {member.status}
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {member.last_login
                                          ? new Date(member.last_login).toLocaleDateString()
                                          : 'Never'}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center justify-end gap-1">
                                        {isEditing ? (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={() => handleSaveEdit(member.id)}
                                              disabled={savingId === member.id}
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 px-2"
                                              onClick={() => setEditingId(null)}
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </Button>
                                          </>
                                        ) : (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 px-2 text-gray-500 hover:text-blue-600"
                                              onClick={() => handleStartEdit(member)}
                                              title="Edit"
                                            >
                                              <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 px-2 text-gray-500 hover:text-amber-600"
                                              onClick={() => handleResetPassword(member.id, member.name)}
                                              disabled={savingId === member.id}
                                              title="Reset Password"
                                            >
                                              <KeyRound className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 px-2 text-gray-500 hover:text-green-600"
                                              onClick={() => handleSendWelcome(member.id)}
                                              disabled={sendingWelcome === member.id}
                                              title="Send Welcome Email"
                                            >
                                              {sendingWelcome === member.id ? (
                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-600" />
                                              ) : (
                                                <Send className="h-3.5 w-3.5" />
                                              )}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 px-2 text-gray-500 hover:text-red-600"
                                              onClick={() => handleDeleteMember(member.id, member.name)}
                                              title="Remove"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ===== WELCOME EMAIL TAB ===== */}
              {activeTab === 'welcome-email' && (
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Template Variables</AlertTitle>
                    <AlertDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['{{name}}', '{{email}}', '{{temporary_password}}', '{{login_url}}', '{{role}}', '{{company_name}}'].map(v => (
                          <code key={v} className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{v}</code>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Welcome Email Template
                      </CardTitle>
                      <CardDescription>
                        This email is sent when you click &quot;Send Welcome Email&quot; for a team member
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={template.subject}
                          onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Welcome to {{company_name}}!"
                        />
                      </div>
                      <div>
                        <Label>Email Body (HTML)</Label>
                        <Textarea
                          value={template.body_html}
                          onChange={(e) => setTemplate(prev => ({ ...prev, body_html: e.target.value }))}
                          placeholder="Enter HTML email template..."
                          rows={20}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                          {savingTemplate ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Template
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {showPreview ? 'Hide Preview' : 'Preview'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  {showPreview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Email Preview</CardTitle>
                        <CardDescription>
                          Subject: <strong>{template.subject.replace(/\{\{company_name\}\}/g, 'Speak About AI')}</strong>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <iframe
                            srcDoc={getPreviewHtml()}
                            className="w-full h-[600px] border-0"
                            title="Email Preview"
                            sandbox=""
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
