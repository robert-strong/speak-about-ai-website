import { neon } from "@neondatabase/serverless"

// ─── Types ───────────────────────────────────────────────────────────────────

type EntityType = "deal" | "project" | "proposal" | "contract" | "invoice"

interface PropagateContext {
  sourceEntity: EntityType
  sourceId: number
  changedFields: Record<string, any>
}

// ─── Infinite-loop guard ─────────────────────────────────────────────────────

const activeSyncs = new Set<string>()

// ─── Field mapping registry ──────────────────────────────────────────────────
// Maps logical field → column name on each entity.
// `null` means the entity doesn't carry that field.

const FIELD_MAP: Record<string, Record<EntityType, string | null>> = {
  client_name:    { deal: "client_name",       project: "client_name",            proposal: "client_name",    contract: "client_name",    invoice: "client_name"  },
  client_email:   { deal: "client_email",      project: "client_email",           proposal: "client_email",   contract: "client_email",   invoice: "client_email" },
  client_phone:   { deal: "client_phone",      project: "client_phone",           proposal: null,             contract: null,             invoice: null           },
  company:        { deal: "company",           project: "company",                proposal: "client_company", contract: "client_company", invoice: "company"      },
  event_title:    { deal: "event_title",       project: "event_name",             proposal: "event_title",    contract: "event_title",    invoice: null           },
  event_date:     { deal: "event_date",        project: "event_date",             proposal: "event_date",     contract: "event_date",     invoice: null           },
  event_location: { deal: "event_location",    project: "event_location",         proposal: "event_location", contract: "event_location", invoice: null           },
  event_type:     { deal: "event_type",        project: "event_type",             proposal: "event_type",     contract: "event_type",     invoice: null           },
  attendee_count: { deal: "attendee_count",    project: "audience_size",          proposal: "attendee_count", contract: null,             invoice: null           },
  fee_amount:     { deal: "deal_value",        project: "speaker_fee",            proposal: "total_investment", contract: "fee_amount",   invoice: null           },
  speaker_name:   { deal: "speaker_requested", project: "requested_speaker_name", proposal: null,             contract: "speaker_name",   invoice: null           },
}

// Reverse index: given an entity type + column name, return the logical field.
const REVERSE_MAP: Record<EntityType, Record<string, string>> = {
  deal: {},
  project: {},
  proposal: {},
  contract: {},
  invoice: {},
}
for (const [logical, mapping] of Object.entries(FIELD_MAP)) {
  for (const [entity, col] of Object.entries(mapping)) {
    if (col) {
      REVERSE_MAP[entity as EntityType][col] = logical
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSQL() {
  return neon(process.env.DATABASE_URL!)
}

/**
 * Resolve the deal_id for any entity.
 */
async function resolveDealId(
  sql: ReturnType<typeof neon>,
  entity: EntityType,
  id: number,
): Promise<number | null> {
  if (entity === "deal") return id

  let rows: any[]
  if (entity === "project") {
    rows = await sql`SELECT deal_id FROM projects WHERE id = ${id}`
  } else if (entity === "proposal") {
    rows = await sql`SELECT deal_id FROM proposals WHERE id = ${id}`
  } else if (entity === "contract") {
    rows = await sql`SELECT deal_id FROM contracts WHERE id = ${id}`
  } else if (entity === "invoice") {
    rows = await sql`SELECT deal_id, project_id FROM invoices WHERE id = ${id}`
  } else {
    return null
  }

  const row = rows[0]
  if (!row) return null
  if (row.deal_id) return Number(row.deal_id)

  // Invoices: fall back via project_id → projects.deal_id
  if (entity === "invoice" && row.project_id) {
    const pRows = await sql`SELECT deal_id FROM projects WHERE id = ${row.project_id}`
    return pRows[0]?.deal_id ? Number(pRows[0].deal_id) : null
  }

  return null
}

/**
 * Find all entities linked to a given deal_id.
 * Returns a map of EntityType → id[].
 */
async function findLinkedEntities(
  sql: ReturnType<typeof neon>,
  dealId: number,
  excludeEntity: EntityType,
  excludeId: number,
): Promise<Record<EntityType, number[]>> {
  const result: Record<EntityType, number[]> = {
    deal: [],
    project: [],
    proposal: [],
    contract: [],
    invoice: [],
  }

  // Include the deal itself (unless it's the source)
  if (excludeEntity !== "deal") {
    result.deal = [dealId]
  }

  // Projects
  const projects = await sql`SELECT id FROM projects WHERE deal_id = ${dealId}`
  for (const r of projects) {
    if (!(excludeEntity === "project" && r.id === excludeId)) {
      result.project.push(r.id)
    }
  }

  // Proposals
  const proposals = await sql`SELECT id FROM proposals WHERE deal_id = ${dealId}`
  for (const r of proposals) {
    if (!(excludeEntity === "proposal" && r.id === excludeId)) {
      result.proposal.push(r.id)
    }
  }

  // Contracts
  const contracts = await sql`SELECT id FROM contracts WHERE deal_id = ${dealId}`
  for (const r of contracts) {
    if (!(excludeEntity === "contract" && r.id === excludeId)) {
      result.contract.push(r.id)
    }
  }

  // Invoices — linked via deal_id OR via project_id
  const projectIds = projects.map((p: any) => p.id)
  const invoiceIds = new Set<number>()

  const invoicesByDeal = await sql`SELECT id FROM invoices WHERE deal_id = ${dealId}`
  for (const r of invoicesByDeal) invoiceIds.add(r.id)

  for (const pid of projectIds) {
    const invoicesByProject = await sql`SELECT id FROM invoices WHERE project_id = ${pid}`
    for (const r of invoicesByProject) invoiceIds.add(r.id)
  }

  for (const iid of invoiceIds) {
    if (!(excludeEntity === "invoice" && iid === excludeId)) {
      result.invoice.push(iid)
    }
  }

  return result
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compare a request body against the original entity and return only the
 * syncable fields that actually changed. Keys in the returned object are
 * the *source entity column names* (not logical names).
 */
export function extractSyncableFields(
  entityType: EntityType,
  body: Record<string, any>,
  originalEntity?: Record<string, any> | null,
): Record<string, any> {
  const reverseMap = REVERSE_MAP[entityType] || {}
  const changed: Record<string, any> = {}

  for (const [col] of Object.entries(reverseMap)) {
    if (body[col] !== undefined) {
      // If we have the original, only include if actually changed
      if (originalEntity) {
        const oldVal = originalEntity[col]
        const newVal = body[col]
        // Normalise dates for comparison
        const oldNorm = typeof oldVal === "string" && oldVal.includes("T") ? oldVal.split("T")[0] : oldVal
        const newNorm = typeof newVal === "string" && newVal.includes("T") ? newVal.split("T")[0] : newVal
        if (String(oldNorm ?? "") === String(newNorm ?? "")) continue
      }
      changed[col] = body[col]
    }
  }

  return changed
}

/**
 * Propagate changed fields from one entity to all linked entities.
 * Uses direct SQL (not update functions) to prevent loops.
 */
export async function propagateChanges(ctx: PropagateContext): Promise<void> {
  const syncKey = `${ctx.sourceEntity}:${ctx.sourceId}`
  if (activeSyncs.has(syncKey)) {
    console.log(`[entity-sync] Skipping — already syncing ${syncKey}`)
    return
  }
  activeSyncs.add(syncKey)

  try {
    const sql = getSQL()
    const reverseMap = REVERSE_MAP[ctx.sourceEntity] || {}

    // Translate source column names → logical field names
    const logicalChanges: Record<string, any> = {}
    for (const [col, value] of Object.entries(ctx.changedFields)) {
      const logical = reverseMap[col]
      if (logical) logicalChanges[logical] = value
    }

    if (Object.keys(logicalChanges).length === 0) {
      console.log(`[entity-sync] No syncable logical fields for ${syncKey}`)
      return
    }

    console.log(`[entity-sync] Propagating from ${syncKey}:`, Object.keys(logicalChanges))

    // Resolve deal_id
    const dealId = await resolveDealId(sql, ctx.sourceEntity, ctx.sourceId)
    if (!dealId) {
      console.log(`[entity-sync] No deal_id found for ${syncKey} — skipping`)
      return
    }

    // Find linked entities (excluding the source)
    const linked = await findLinkedEntities(sql, dealId, ctx.sourceEntity, ctx.sourceId)

    // For each target entity type, build and execute UPDATE(s)
    const entityTypes: EntityType[] = ["deal", "project", "proposal", "contract", "invoice"]
    const tableNames: Record<EntityType, string> = {
      deal: "deals",
      project: "projects",
      proposal: "proposals",
      contract: "contracts",
      invoice: "invoices",
    }

    for (const targetEntity of entityTypes) {
      const ids = linked[targetEntity]
      if (!ids || ids.length === 0) continue

      // Build SET clause for this entity type
      const setClauses: string[] = []
      const baseValues: any[] = []
      let paramIdx = 1

      for (const [logical, value] of Object.entries(logicalChanges)) {
        const targetCol = FIELD_MAP[logical]?.[targetEntity]
        if (!targetCol) continue

        let normalizedValue = value
        // Date normalisation: strip time component
        if (logical === "event_date" && typeof normalizedValue === "string" && normalizedValue.includes("T")) {
          normalizedValue = normalizedValue.split("T")[0]
        }

        setClauses.push(`"${targetCol}" = $${paramIdx}`)
        baseValues.push(normalizedValue)
        paramIdx++
      }

      if (setClauses.length === 0) continue

      // Add updated_at
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`)

      const table = tableNames[targetEntity]
      const setStr = setClauses.join(", ")

      // Execute one UPDATE per target id
      for (const targetId of ids) {
        try {
          const query = `UPDATE ${table} SET ${setStr} WHERE id = $${paramIdx}`
          const queryValues = [...baseValues, targetId]
          const rawResult = await sql.query(query, queryValues)
          const _rows = (rawResult as any).rows || rawResult
          console.log(`[entity-sync] Updated ${targetEntity} #${targetId}`)
        } catch (updateErr) {
          console.error(`[entity-sync] Failed to update ${targetEntity} #${targetId}:`, updateErr)
        }
      }
    }
  } catch (err) {
    console.error(`[entity-sync] Error propagating from ${ctx.sourceEntity} #${ctx.sourceId}:`, err)
  } finally {
    activeSyncs.delete(syncKey)
  }
}
