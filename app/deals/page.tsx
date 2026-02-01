import { DealsKanban } from "@/components/deals-kanban"

export default function DealsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Deals Pipeline</h1>
        <p className="text-muted-foreground">
          Drag and drop deals between stages to update their status
        </p>
      </div>
      <DealsKanban />
    </div>
  )
}