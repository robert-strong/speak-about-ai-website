"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"
  multiline?: boolean
  placeholder?: string
  isModified?: boolean
  editorMode?: boolean
}

export function EditableText({
  value,
  onChange,
  className,
  as: Component = "span",
  multiline = false,
  placeholder = "Click to edit...",
  isModified = false,
  editorMode = true
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setLocalValue(value)
      setIsEditing(false)
    }
    if (e.key === "Enter" && !multiline) {
      handleBlur()
    }
  }

  if (!editorMode) {
    return <Component className={className}>{value || placeholder}</Component>
  }

  if (isEditing) {
    const inputClasses = cn(
      "w-full bg-white border-2 border-blue-500 rounded px-2 py-1 outline-none shadow-lg",
      "text-inherit font-inherit",
      className
    )

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(inputClasses, "min-h-[100px] resize-y")}
          placeholder={placeholder}
        />
      )
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClasses}
        placeholder={placeholder}
      />
    )
  }

  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={cn(
        className,
        "cursor-pointer transition-all duration-150",
        "hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-offset-2 hover:bg-blue-50/50",
        isModified && "outline outline-2 outline-amber-400 outline-offset-1 bg-amber-50/30",
        !value && "text-gray-400 italic"
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </Component>
  )
}

// For editing images
interface EditableImageProps {
  src: string
  alt: string
  onChange: (src: string) => void
  onAltChange?: (alt: string) => void
  className?: string
  isModified?: boolean
  editorMode?: boolean
  uploadFolder?: string
}

export function EditableImage({
  src,
  alt,
  onChange,
  onAltChange,
  className,
  isModified = false,
  editorMode = true,
  uploadFolder = 'uploads/website'
}: EditableImageProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localSrc, setLocalSrc] = useState(src)
  const [localAlt, setLocalAlt] = useState(alt)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalSrc(src)
    setLocalAlt(alt)
  }, [src, alt])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', uploadFolder)

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        setLocalSrc(result.path)
        onChange(result.path)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  if (!editorMode) {
    return <img src={src} alt={alt} className={className} />
  }

  return (
    <div className="relative group">
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={cn(
          className,
          "cursor-pointer transition-all duration-150",
          "group-hover:outline group-hover:outline-2 group-hover:outline-blue-400 group-hover:outline-offset-2",
          isModified && "outline outline-2 outline-amber-400 outline-offset-1"
        )}
        onClick={() => setShowEditor(true)}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="text-white font-medium text-sm bg-blue-600 px-3 py-2 rounded-lg">
          Click to replace image
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Edit Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={localSrc}
                  onChange={(e) => setLocalSrc(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alt Text</label>
                <input
                  type="text"
                  value={localAlt}
                  onChange={(e) => setLocalAlt(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
                >
                  Upload New
                </button>
                <button
                  onClick={() => {
                    onChange(localSrc)
                    onAltChange?.(localAlt)
                    setShowEditor(false)
                  }}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Logo type for the logo list editor
interface Logo {
  name: string
  src: string
  alt?: string
  size?: 'small' | 'default' | 'extra-large' | 'super-large'
}

interface LogoListEditorProps {
  logos: Logo[]
  onChange: (logos: Logo[]) => void
  isModified?: boolean
  editorMode?: boolean
}

// Offering type for the offerings list editor
export interface ServiceOffering {
  id: string
  image: string
  title: string
  description: string
}

interface OfferingsListEditorProps {
  offerings: ServiceOffering[]
  onChange: (offerings: ServiceOffering[]) => void
  isModified?: boolean
  editorMode?: boolean
}

export function OfferingsListEditor({
  offerings,
  onChange,
  isModified = false,
  editorMode = true
}: OfferingsListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localOfferings, setLocalOfferings] = useState<ServiceOffering[]>(offerings)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingForIndex, setUploadingForIndex] = useState<number | null>(null)

  useEffect(() => {
    setLocalOfferings(offerings)
  }, [offerings])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'services')

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        const updated = [...localOfferings]
        updated[index] = { ...updated[index], image: result.path }
        setLocalOfferings(updated)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
    setUploadingForIndex(null)
  }

  const handleAddOffering = () => {
    const newId = `offering${localOfferings.length + 1}`
    const newOffering: ServiceOffering = {
      id: newId,
      image: '/services/placeholder.jpg',
      title: 'New Service',
      description: 'Description of the new service offering.'
    }
    setLocalOfferings([...localOfferings, newOffering])
  }

  const handleRemoveOffering = (index: number) => {
    const updated = localOfferings.filter((_, i) => i !== index)
    // Re-index the offerings
    const reindexed = updated.map((o, i) => ({ ...o, id: `offering${i + 1}` }))
    setLocalOfferings(reindexed)
  }

  const handleUpdateOffering = (index: number, field: keyof ServiceOffering, value: string) => {
    const updated = [...localOfferings]
    updated[index] = { ...updated[index], [field]: value }
    setLocalOfferings(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localOfferings]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    // Re-index
    const reindexed = updated.map((o, i) => ({ ...o, id: `offering${i + 1}` }))
    setLocalOfferings(reindexed)
  }

  const handleMoveDown = (index: number) => {
    if (index === localOfferings.length - 1) return
    const updated = [...localOfferings]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    // Re-index
    const reindexed = updated.map((o, i) => ({ ...o, id: `offering${i + 1}` }))
    setLocalOfferings(reindexed)
  }

  const handleSave = () => {
    onChange(localOfferings)
    setShowEditor(false)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          isModified && "ring-2 ring-amber-400 ring-offset-2"
        )}
      >
        Edit Offerings ({offerings.length})
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Service Offerings</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {localOfferings.map((offering, index) => (
                  <div key={offering.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Image preview */}
                      <div className="w-32 h-24 bg-white rounded border flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                        <img
                          src={offering.image}
                          alt={offering.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, index)}
                          className="hidden"
                          id={`offering-upload-${index}`}
                        />
                        <label
                          htmlFor={`offering-upload-${index}`}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          <span className="text-white text-xs font-medium">Change</span>
                        </label>
                      </div>

                      {/* Offering details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          type="text"
                          value={offering.title}
                          onChange={(e) => handleUpdateOffering(index, 'title', e.target.value)}
                          className="w-full text-sm font-medium border rounded px-2 py-1"
                          placeholder="Service title"
                        />
                        <textarea
                          value={offering.description}
                          onChange={(e) => handleUpdateOffering(index, 'description', e.target.value)}
                          className="w-full text-sm border rounded px-2 py-1 resize-y min-h-[60px]"
                          placeholder="Service description"
                        />
                        <input
                          type="text"
                          value={offering.image}
                          onChange={(e) => handleUpdateOffering(index, 'image', e.target.value)}
                          className="w-full text-xs border rounded px-2 py-1 font-mono text-gray-500"
                          placeholder="/services/filename.jpg"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localOfferings.length - 1}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveOffering(index)}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddOffering}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add New Service Offering
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalOfferings(offerings)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple list editor for string arrays (industries, topics, etc.)
interface SimpleListEditorProps {
  items: string[]
  onChange: (items: string[]) => void
  isModified?: boolean
  editorMode?: boolean
  title: string
  buttonText?: string
}

export function SimpleListEditor({
  items,
  onChange,
  isModified = false,
  editorMode = true,
  title,
  buttonText
}: SimpleListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localItems, setLocalItems] = useState<string[]>(items)

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const handleAddItem = () => {
    setLocalItems([...localItems, 'New item'])
  }

  const handleRemoveItem = (index: number) => {
    setLocalItems(localItems.filter((_, i) => i !== index))
  }

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...localItems]
    updated[index] = value
    setLocalItems(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localItems]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setLocalItems(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === localItems.length - 1) return
    const updated = [...localItems]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setLocalItems(updated)
  }

  const handleSave = () => {
    onChange(localItems)
    setShowEditor(false)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "px-3 py-1 rounded text-xs font-medium transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          isModified && "ring-2 ring-amber-400 ring-offset-1"
        )}
      >
        {buttonText || `Edit List (${items.length})`}
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {localItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateItem(index, e.target.value)}
                      className="flex-1 text-sm border rounded px-3 py-2"
                      placeholder="List item"
                    />
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === localItems.length - 1}
                      className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddItem}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
              >
                + Add Item
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalItems(items)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Team member type for the team members list editor
export interface TeamMember {
  id: string
  name: string
  title: string
  image: string
  bio: string
  linkedin?: string
  twitter?: string
  website?: string
}

interface TeamMembersListEditorProps {
  members: TeamMember[]
  onChange: (members: TeamMember[]) => void
  isModified?: boolean
  editorMode?: boolean
}

export function TeamMembersListEditor({
  members,
  onChange,
  isModified = false,
  editorMode = true
}: TeamMembersListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localMembers, setLocalMembers] = useState<TeamMember[]>(members)

  useEffect(() => {
    setLocalMembers(members)
  }, [members])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'team')

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        const updated = [...localMembers]
        updated[index] = { ...updated[index], image: result.path }
        setLocalMembers(updated)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleAddMember = () => {
    const newId = `member${localMembers.length + 1}`
    const newMember: TeamMember = {
      id: newId,
      name: 'New Team Member',
      title: 'Title',
      image: '/team/placeholder.png',
      bio: 'Bio goes here...',
    }
    setLocalMembers([...localMembers, newMember])
  }

  const handleRemoveMember = (index: number) => {
    const updated = localMembers.filter((_, i) => i !== index)
    const reindexed = updated.map((m, i) => ({ ...m, id: `member${i + 1}` }))
    setLocalMembers(reindexed)
  }

  const handleUpdateMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...localMembers]
    updated[index] = { ...updated[index], [field]: value }
    setLocalMembers(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localMembers]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    const reindexed = updated.map((m, i) => ({ ...m, id: `member${i + 1}` }))
    setLocalMembers(reindexed)
  }

  const handleMoveDown = (index: number) => {
    if (index === localMembers.length - 1) return
    const updated = [...localMembers]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    const reindexed = updated.map((m, i) => ({ ...m, id: `member${i + 1}` }))
    setLocalMembers(reindexed)
  }

  const handleSave = () => {
    onChange(localMembers)
    setShowEditor(false)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          isModified && "ring-2 ring-amber-400 ring-offset-2"
        )}
      >
        Edit Team Members ({members.length})
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Team Members</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {localMembers.map((member, index) => (
                  <div key={member.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Image preview */}
                      <div className="w-24 h-24 bg-white rounded-full border flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, index)}
                          className="hidden"
                          id={`member-upload-${index}`}
                        />
                        <label
                          htmlFor={`member-upload-${index}`}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full"
                        >
                          <span className="text-white text-xs font-medium">Change</span>
                        </label>
                      </div>

                      {/* Member details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                            className="text-sm font-medium border rounded px-2 py-1"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            value={member.title}
                            onChange={(e) => handleUpdateMember(index, 'title', e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                            placeholder="Title"
                          />
                        </div>
                        <textarea
                          value={member.bio}
                          onChange={(e) => handleUpdateMember(index, 'bio', e.target.value)}
                          className="w-full text-sm border rounded px-2 py-1 resize-y min-h-[80px]"
                          placeholder="Bio"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={member.linkedin || ''}
                            onChange={(e) => handleUpdateMember(index, 'linkedin', e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            placeholder="LinkedIn URL"
                          />
                          <input
                            type="text"
                            value={member.twitter || ''}
                            onChange={(e) => handleUpdateMember(index, 'twitter', e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            placeholder="Twitter URL"
                          />
                          <input
                            type="text"
                            value={member.website || ''}
                            onChange={(e) => handleUpdateMember(index, 'website', e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            placeholder="Website URL"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localMembers.length - 1}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveMember(index)}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddMember}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add New Team Member
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalMembers(members)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function LogoListEditor({
  logos,
  onChange,
  isModified = false,
  editorMode = true
}: LogoListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [localLogos, setLocalLogos] = useState<Logo[]>(logos)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingForIndex, setUploadingForIndex] = useState<number | null>(null)

  useEffect(() => {
    setLocalLogos(logos)
  }, [logos])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'logos')

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        const updated = [...localLogos]
        updated[index] = { ...updated[index], src: result.path }
        setLocalLogos(updated)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
    setUploadingForIndex(null)
  }

  const handleAddLogo = () => {
    const newLogo: Logo = {
      name: 'New Logo',
      src: '/logos/placeholder.png',
      alt: 'New logo',
      size: 'default'
    }
    setLocalLogos([...localLogos, newLogo])
    setEditingIndex(localLogos.length)
  }

  const handleRemoveLogo = (index: number) => {
    const updated = localLogos.filter((_, i) => i !== index)
    setLocalLogos(updated)
  }

  const handleUpdateLogo = (index: number, field: keyof Logo, value: string) => {
    const updated = [...localLogos]
    updated[index] = { ...updated[index], [field]: value }
    setLocalLogos(updated)
  }

  const handleSave = () => {
    onChange(localLogos)
    setShowEditor(false)
    setEditingIndex(null)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          isModified && "ring-2 ring-amber-400 ring-offset-2"
        )}
      >
        Edit Logos ({logos.length})
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Client Logos</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localLogos.map((logo, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Logo preview */}
                      <div className="w-24 h-16 bg-white rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={logo.src}
                          alt={logo.name}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      </div>

                      {/* Logo details */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={logo.name}
                          onChange={(e) => handleUpdateLogo(index, 'name', e.target.value)}
                          className="w-full text-sm font-medium border rounded px-2 py-1 mb-2"
                          placeholder="Logo name"
                        />
                        <input
                          type="text"
                          value={logo.src}
                          onChange={(e) => handleUpdateLogo(index, 'src', e.target.value)}
                          className="w-full text-xs border rounded px-2 py-1 mb-2 font-mono"
                          placeholder="/logos/filename.png"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={logo.size || 'default'}
                            onChange={(e) => handleUpdateLogo(index, 'size', e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="small">Small</option>
                            <option value="default">Default</option>
                            <option value="extra-large">Extra Large</option>
                            <option value="super-large">Super Large</option>
                          </select>
                          <input
                            type="file"
                            accept="image/*"
                            ref={uploadingForIndex === index ? fileInputRef : undefined}
                            onChange={(e) => handleFileUpload(e, index)}
                            className="hidden"
                            id={`logo-upload-${index}`}
                          />
                          <label
                            htmlFor={`logo-upload-${index}`}
                            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded cursor-pointer"
                          >
                            Upload
                          </label>
                          <button
                            onClick={() => handleRemoveLogo(index)}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddLogo}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add New Logo
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalLogos(logos)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Budget range type for the budget ranges list editor
export interface BudgetRange {
  range: string
  description: string
}

interface BudgetRangesListEditorProps {
  ranges: BudgetRange[]
  onChange: (ranges: BudgetRange[]) => void
  isModified?: boolean
  editorMode?: boolean
}

export function BudgetRangesListEditor({
  ranges,
  onChange,
  isModified = false,
  editorMode = true
}: BudgetRangesListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localRanges, setLocalRanges] = useState<BudgetRange[]>(ranges)

  useEffect(() => {
    setLocalRanges(ranges)
  }, [ranges])

  const handleAddRange = () => {
    setLocalRanges([...localRanges, { range: '$XX,XXX', description: 'Description of this budget tier' }])
  }

  const handleRemoveRange = (index: number) => {
    setLocalRanges(localRanges.filter((_, i) => i !== index))
  }

  const handleUpdateRange = (index: number, field: keyof BudgetRange, value: string) => {
    const updated = [...localRanges]
    updated[index] = { ...updated[index], [field]: value }
    setLocalRanges(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localRanges]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setLocalRanges(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === localRanges.length - 1) return
    const updated = [...localRanges]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setLocalRanges(updated)
  }

  const handleSave = () => {
    onChange(localRanges)
    setShowEditor(false)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "px-3 py-1 rounded text-xs font-medium transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          isModified && "ring-2 ring-amber-400 ring-offset-1"
        )}
      >
        Edit Budget Ranges ({ranges.length})
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Budget Ranges</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {localRanges.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
                          <input
                            type="text"
                            value={item.range}
                            onChange={(e) => handleUpdateRange(index, 'range', e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="e.g., $5k - $20k"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateRange(index, 'description', e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="Description of speakers in this range"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localRanges.length - 1}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveRange(index)}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddRange}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Budget Range
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalRanges(ranges)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Delivery option type for the delivery options list editor
export interface DeliveryOption {
  title: string
  description: string
}

interface DeliveryOptionsListEditorProps {
  options: DeliveryOption[]
  onChange: (options: DeliveryOption[]) => void
  isModified?: boolean
  editorMode?: boolean
}

export function DeliveryOptionsListEditor({
  options,
  onChange,
  isModified = false,
  editorMode = true
}: DeliveryOptionsListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localOptions, setLocalOptions] = useState<DeliveryOption[]>(options)

  useEffect(() => {
    setLocalOptions(options)
  }, [options])

  const handleAddOption = () => {
    setLocalOptions([...localOptions, { title: 'New Option', description: 'Description goes here' }])
  }

  const handleRemoveOption = (index: number) => {
    setLocalOptions(localOptions.filter((_, i) => i !== index))
  }

  const handleUpdateOption = (index: number, field: keyof DeliveryOption, value: string) => {
    const updated = [...localOptions]
    updated[index] = { ...updated[index], [field]: value }
    setLocalOptions(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localOptions]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setLocalOptions(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === localOptions.length - 1) return
    const updated = [...localOptions]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setLocalOptions(updated)
  }

  const handleSave = () => {
    onChange(localOptions)
    setShowEditor(false)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "px-3 py-1 rounded text-xs font-medium transition-all",
          "bg-blue-600 text-white hover:bg-blue-700",
          isModified && "ring-2 ring-amber-400 ring-offset-1"
        )}
      >
        Edit Delivery Options ({options.length})
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Delivery Options</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {localOptions.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateOption(index, 'title', e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="e.g., In-Person Events"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateOption(index, 'description', e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="Description of this delivery option"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localOptions.length - 1}
                          className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddOption}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Delivery Option
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalOptions(options)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Footer link type for footer links editor
export interface FooterLink {
  text: string
  url: string
}

interface FooterLinkListEditorProps {
  links: FooterLink[]
  onChange: (links: FooterLink[]) => void
  isModified?: boolean
  editorMode?: boolean
  title: string
}

export function FooterLinkListEditor({
  links,
  onChange,
  isModified = false,
  editorMode = true,
  title
}: FooterLinkListEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [localLinks, setLocalLinks] = useState<FooterLink[]>(links)

  useEffect(() => {
    setLocalLinks(links)
  }, [links])

  const handleAddLink = () => {
    setLocalLinks([...localLinks, { text: 'New Link', url: '/' }])
  }

  const handleRemoveLink = (index: number) => {
    setLocalLinks(localLinks.filter((_, i) => i !== index))
  }

  const handleUpdateLink = (index: number, field: 'text' | 'url', value: string) => {
    const updated = [...localLinks]
    updated[index] = { ...updated[index], [field]: value }
    setLocalLinks(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...localLinks]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setLocalLinks(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === localLinks.length - 1) return
    const updated = [...localLinks]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setLocalLinks(updated)
  }

  const handleSave = () => {
    onChange(localLinks)
    setShowEditor(false)
  }

  if (!editorMode) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowEditor(true)}
        className={cn(
          "w-full mt-3 border-2 border-dashed rounded-lg p-3 text-sm font-medium transition-all flex items-center justify-center gap-2",
          "border-blue-400 text-blue-300 bg-blue-900/30 hover:border-blue-300 hover:bg-blue-800/50 hover:text-white",
          isModified && "ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900"
        )}
      >
        <span>✏️</span> Edit Links ({links.length})
      </button>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {localLinks.map((link, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 w-16">Text:</span>
                      <input
                        type="text"
                        value={link.text}
                        onChange={(e) => handleUpdateLink(index, 'text', e.target.value)}
                        className="flex-1 text-sm border rounded px-3 py-1.5 text-gray-900"
                        placeholder="Link text"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-16">URL:</span>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                        className="flex-1 text-sm border rounded px-3 py-1.5 font-mono text-gray-700"
                        placeholder="/page-url"
                      />
                    </div>
                    <div className="flex justify-end gap-1 mt-2">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localLinks.length - 1}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleRemoveLink(index)}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddLink}
                className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
              >
                + Add Link
              </button>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setLocalLinks(links)
                  setShowEditor(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
