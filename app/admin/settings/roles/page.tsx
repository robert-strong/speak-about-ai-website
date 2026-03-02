"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useToast } from "@/hooks/use-toast"
import { authGet, authPost, authPut, authDelete } from "@/lib/auth-fetch"
import {
  Shield,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Settings,
  ShoppingCart,
  Briefcase,
  Globe,
  Megaphone,
  Home
} from "lucide-react"

interface PermissionKey {
  key: string
  label: string
  section: string
  description: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: Record<string, boolean>
  is_default: boolean
  created_at: string
  updated_at: string
}

const SECTION_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'standalone': { icon: Home, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'Sales': { icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Operations': { icon: Briefcase, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Website': { icon: Globe, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Marketing': { icon: Megaphone, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'System': { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' },
}

export default function RolesSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionKeys, setPermissionKeys] = useState<PermissionKey[]>([])
  const [expandedRole, setExpandedRole] = useState<number | null>(null)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean> | null>(null)
  const [editingDescription, setEditingDescription] = useState<string>('')
  const [showAddRole, setShowAddRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [runningMigration, setRunningMigration] = useState(false)

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
    if (!isAdminLoggedIn) {
      router.push("/admin")
      return
    }
    setIsLoggedIn(true)
    loadRoles()
  }, [router])

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await authGet('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
        setPermissionKeys(data.permission_keys || [])
        setNeedsMigration(data.needs_migration || false)
      } else {
        throw new Error('Failed to load roles')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      toast({
        title: "Error",
        description: "Failed to load roles configuration",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const runMigration = async () => {
    try {
      setRunningMigration(true)
      const response = await authPost('/api/admin/roles/migrate')
      if (response.ok) {
        toast({ title: "Success", description: "Roles table created successfully" })
        setNeedsMigration(false)
        await loadRoles()
      } else {
        throw new Error('Migration failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run migration. Please run 014_create_roles_table.sql manually.",
        variant: "destructive"
      })
    } finally {
      setRunningMigration(false)
    }
  }

  const handleExpandRole = (roleId: number) => {
    if (expandedRole === roleId) {
      setExpandedRole(null)
      setEditingPermissions(null)
      setEditingDescription('')
    } else {
      const role = roles.find(r => r.id === roleId)
      if (role) {
        setExpandedRole(roleId)
        setEditingPermissions({ ...role.permissions })
        setEditingDescription(role.description || '')
      }
    }
  }

  const handleTogglePermission = (key: string) => {
    if (!editingPermissions) return
    setEditingPermissions(prev => prev ? { ...prev, [key]: !prev[key] } : null)
  }

  const handleToggleSection = (section: string) => {
    if (!editingPermissions) return
    const sectionKeys = permissionKeys.filter(p => p.section === section).map(p => p.key)
    const allEnabled = sectionKeys.every(k => editingPermissions[k])
    setEditingPermissions(prev => {
      if (!prev) return null
      const updated = { ...prev }
      sectionKeys.forEach(k => { updated[k] = !allEnabled })
      return updated
    })
  }

  const handleToggleAll = (enable: boolean) => {
    if (!editingPermissions) return
    setEditingPermissions(prev => {
      if (!prev) return null
      const updated = { ...prev }
      permissionKeys.forEach(p => { updated[p.key] = enable })
      return updated
    })
  }

  const handleSaveRole = async (roleId: number) => {
    if (!editingPermissions) return
    const role = roles.find(r => r.id === roleId)
    if (!role) return

    try {
      setSaving(roleId)
      const response = await authPut('/api/admin/roles', {
        id: roleId,
        name: role.name,
        description: editingDescription,
        permissions: editingPermissions
      })

      if (response.ok) {
        toast({ title: "Saved", description: `${role.name} permissions updated` })
        await loadRoles()
        // Keep the role expanded after save
        const freshRole = (await (await authGet('/api/admin/roles')).json()).roles.find((r: Role) => r.id === roleId)
        if (freshRole) {
          setEditingPermissions({ ...freshRole.permissions })
          setEditingDescription(freshRole.description || '')
        }
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive"
      })
    } finally {
      setSaving(null)
    }
  }

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast({ title: "Error", description: "Role name is required", variant: "destructive" })
      return
    }

    try {
      setSaving(-1)
      // New roles start with no permissions
      const permissions: Record<string, boolean> = {}
      permissionKeys.forEach(p => { permissions[p.key] = false })

      const response = await authPost('/api/admin/roles', {
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        permissions
      })

      if (response.ok) {
        toast({ title: "Created", description: `Role "${newRoleName}" created` })
        setShowAddRole(false)
        setNewRoleName('')
        setNewRoleDescription('')
        await loadRoles()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create role')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive"
      })
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Delete the "${roleName}" role? This cannot be undone.`)) return

    try {
      const response = await authDelete(`/api/admin/roles?id=${roleId}`)
      if (response.ok) {
        toast({ title: "Deleted", description: `Role "${roleName}" removed` })
        if (expandedRole === roleId) {
          setExpandedRole(null)
          setEditingPermissions(null)
        }
        await loadRoles()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive"
      })
    }
  }

  // Group permissions by section
  const permissionsBySection = permissionKeys.reduce((acc, perm) => {
    if (!acc[perm.section]) acc[perm.section] = []
    acc[perm.section].push(perm)
    return acc
  }, {} as Record<string, PermissionKey[]>)

  const getEnabledCount = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length
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
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Roles & Permissions
              </h1>
              <p className="text-gray-600 mt-2">
                Define team roles and control which sidebar menu items each role can access
              </p>
            </div>
            <Button
              onClick={() => setShowAddRole(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>

          {/* Migration Warning */}
          {needsMigration && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Database Setup Required</AlertTitle>
              <AlertDescription className="text-amber-800">
                The roles table hasn&apos;t been created yet. Run the migration to get started.
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={runMigration}
                    disabled={runningMigration}
                  >
                    {runningMigration ? 'Creating...' : 'Create Roles Table'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Add Role Form */}
          {showAddRole && (
            <Card className="mb-6 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Create New Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="new-role-name">Role Name</Label>
                    <Input
                      id="new-role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Intern, Coordinator..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-role-desc">Description</Label>
                    <Input
                      id="new-role-desc"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Brief description of this role's responsibilities"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddRole} disabled={saving === -1} size="sm">
                    {saving === -1 ? 'Creating...' : 'Create Role'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowAddRole(false); setNewRoleName(''); setNewRoleDescription('') }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>How Roles Work</AlertTitle>
            <AlertDescription>
              Each role defines which sidebar menu items a team member can see. Click on a role to expand
              and configure its permissions. The Admin Team role has full access by default and cannot be deleted.
            </AlertDescription>
          </Alert>

          {/* Roles List */}
          <div className="space-y-4">
            {roles.map((role) => {
              const isExpanded = expandedRole === role.id
              const enabledCount = getEnabledCount(role.permissions)
              const totalCount = permissionKeys.length

              return (
                <Card
                  key={role.id}
                  className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-300 shadow-lg' : 'hover:shadow-md'}`}
                >
                  {/* Role Header */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer"
                    onClick={() => handleExpandRole(role.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                        role.is_default ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'
                      }`}>
                        {role.is_default ? (
                          <ShieldCheck className="h-6 w-6 text-white" />
                        ) : (
                          <Users className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                          {role.is_default && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <div className="text-sm font-medium text-gray-700">
                          {enabledCount} / {totalCount}
                        </div>
                        <div className="text-xs text-gray-400">permissions</div>
                      </div>
                      {/* Permission bar indicator */}
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            enabledCount === totalCount
                              ? 'bg-green-500'
                              : enabledCount > totalCount / 2
                              ? 'bg-blue-500'
                              : enabledCount > 0
                              ? 'bg-amber-500'
                              : 'bg-gray-300'
                          }`}
                          style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Permission Editor */}
                  {isExpanded && editingPermissions && (
                    <div className="border-t border-gray-100">
                      <div className="p-5">
                        {/* Description field */}
                        <div className="mb-5">
                          <Label htmlFor={`desc-${role.id}`} className="text-sm font-medium text-gray-700">
                            Role Description
                          </Label>
                          <Input
                            id={`desc-${role.id}`}
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            placeholder="Describe what this role is for..."
                            className="mt-1"
                          />
                        </div>

                        {/* Quick toggle buttons */}
                        <div className="flex items-center gap-2 mb-5">
                          <span className="text-sm text-gray-500 mr-2">Quick:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAll(true)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Enable All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAll(false)}
                            className="text-xs"
                          >
                            <EyeOff className="h-3 w-3 mr-1" />
                            Disable All
                          </Button>
                        </div>

                        {/* Permissions grouped by section */}
                        <div className="space-y-4">
                          {Object.entries(permissionsBySection).map(([section, perms]) => {
                            const sectionConf = SECTION_CONFIG[section] || SECTION_CONFIG['standalone']
                            const SectionIcon = sectionConf.icon
                            const sectionEnabled = perms.filter(p => editingPermissions[p.key]).length
                            const allSectionEnabled = sectionEnabled === perms.length

                            return (
                              <div key={section} className="border border-gray-100 rounded-lg overflow-hidden">
                                {/* Section Header */}
                                <div
                                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${sectionConf.bgColor}`}
                                  onClick={() => handleToggleSection(section)}
                                >
                                  <div className="flex items-center gap-3">
                                    <SectionIcon className={`h-4 w-4 ${sectionConf.color}`} />
                                    <span className="text-sm font-semibold text-gray-800">
                                      {section === 'standalone' ? 'Dashboard' : section}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      {sectionEnabled}/{perms.length}
                                    </Badge>
                                  </div>
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    allSectionEnabled
                                      ? 'bg-blue-600 border-blue-600'
                                      : sectionEnabled > 0
                                      ? 'bg-blue-200 border-blue-400'
                                      : 'border-gray-300'
                                  }`}>
                                    {allSectionEnabled && <Check className="h-3 w-3 text-white" />}
                                    {!allSectionEnabled && sectionEnabled > 0 && (
                                      <div className="w-2 h-0.5 bg-blue-600 rounded" />
                                    )}
                                  </div>
                                </div>

                                {/* Permission Items */}
                                <div className="divide-y divide-gray-50">
                                  {perms.map((perm) => (
                                    <div
                                      key={perm.key}
                                      className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                                      onClick={() => handleTogglePermission(perm.key)}
                                    >
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-700">{perm.label}</div>
                                        <div className="text-xs text-gray-400">{perm.description}</div>
                                      </div>
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        editingPermissions[perm.key]
                                          ? 'bg-blue-600 border-blue-600'
                                          : 'border-gray-300'
                                      }`}>
                                        {editingPermissions[perm.key] && <Check className="h-3 w-3 text-white" />}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                          <div>
                            {!role.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteRole(role.id, role.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Role
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setExpandedRole(null); setEditingPermissions(null) }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveRole(role.id)}
                              disabled={saving === role.id}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {saving === role.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Permissions
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {!needsMigration && roles.length === 0 && (
            <Card className="p-12 text-center">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Roles Configured</h3>
              <p className="text-gray-400 mb-4">Create your first role to start managing permissions</p>
              <Button onClick={() => setShowAddRole(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Role
              </Button>
            </Card>
          )}

          {/* Summary Table */}
          {roles.length > 1 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Permission Matrix</CardTitle>
                <CardDescription>Quick overview of all role permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 font-medium text-gray-600 sticky left-0 bg-white min-w-[160px]">
                          Menu Item
                        </th>
                        {roles.map(role => (
                          <th key={role.id} className="text-center py-2 px-2 font-medium text-gray-600 min-w-[80px]">
                            <div className="text-xs leading-tight">{role.name}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissionKeys.map((perm) => (
                        <tr key={perm.key} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 pr-4 text-gray-700 sticky left-0 bg-white">
                            <div className="font-medium">{perm.label}</div>
                            <div className="text-xs text-gray-400">{perm.section}</div>
                          </td>
                          {roles.map(role => (
                            <td key={role.id} className="text-center py-2 px-2">
                              {role.permissions[perm.key] ? (
                                <Check className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-gray-300 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
