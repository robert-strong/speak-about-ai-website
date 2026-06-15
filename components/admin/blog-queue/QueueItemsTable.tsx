'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react'
import { formatDateTimePST } from '@/lib/date-utils'
import { BlogQueueItem, QueueStatus } from '@/lib/blog-queue-db'

interface QueueItemsTableProps {
  items: BlogQueueItem[]
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  onEdit: (item: BlogQueueItem) => void
  onDelete: (id: number) => void
  onRequeue: (id: number) => void
  loading?: boolean
}

const statusColors: Record<QueueStatus, string> = {
  queued: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  drafted: 'bg-purple-100 text-purple-800',
  created: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-600'
}

export function QueueItemsTable({
  items,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onRequeue,
  loading
}: QueueItemsTableProps) {
  const allSelected = items.length > 0 && selectedIds.length === items.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(items.map(item => item.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id))
    }
  }

  const truncate = (text: string | undefined, maxLength: number = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No items in the queue</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                className={someSelected ? 'data-[state=checked]:bg-gray-400' : ''}
              />
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[40%]">Brief</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectOne(item.id, !!checked)}
                  aria-label={`Select item ${item.id}`}
                />
              </TableCell>
              <TableCell>
                <Badge className={statusColors[item.status]}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm" title={item.brief}>
                  {truncate(item.brief)}
                </p>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{item.title || '—'}</p>
                  {item.slug && (
                    <p className="text-xs text-gray-500">{item.slug}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {item.category ? (
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.published_date ? (
                  <span className="text-sm">
                    {formatDateTimePST(item.published_date)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {item.contentful_entry_url && (
                      <DropdownMenuItem
                        onClick={() => window.open(item.contentful_entry_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View in Contentful
                      </DropdownMenuItem>
                    )}
                    {item.slug && (
                      <DropdownMenuItem
                        onClick={() => window.open(`/blog/${item.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                    )}
                    {(item.status === 'error' || item.status === 'archived') && (
                      <DropdownMenuItem onClick={() => onRequeue(item.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Re-queue
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
