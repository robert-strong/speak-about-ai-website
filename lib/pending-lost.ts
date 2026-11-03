/**
 * Pending-lost holding stage for projects.
 *
 * A project flagged as probably lost moves to status 'pending_lost' and remembers
 * the stage it came from. An admin then either confirms (-> 'lost') or cancels
 * (-> previous stage) from the "Needs Lost Confirmation" box on the projects page.
 */

import { neon } from "@neondatabase/serverless"

const getSql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set")
  return neon(process.env.DATABASE_URL)
}

let schemaEnsured = false

/** Idempotent: adds the columns and extends the status constraint. Mirrors migrations/026. */
export async function ensurePendingLostSchema(): Promise<void> {
  if (schemaEnsured) return
  const sql = getSql()
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50)`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS pending_lost_reason TEXT`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS pending_lost_at TIMESTAMP WITH TIME ZONE`

  const existing = await sql`
    SELECT pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'projects'::regclass AND conname = 'projects_status_check'
  `
  const def: string = existing[0]?.def || ""
  if (!def.includes("pending_lost")) {
    await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check`
    await sql`
      ALTER TABLE projects ADD CONSTRAINT projects_status_check
      CHECK (status IN (
        '2plus_months', '1to2_months', 'less_than_month', 'final_week',
        'qualified', 'proposal',
        'contracts_signed', 'invoicing', 'logistics_planning', 'pre_event',
        'event_week', 'follow_up', 'completed', 'cancelled', 'lost',
        'invoicing_track', 'pending_lost'
      ))
    `
  }
  schemaEnsured = true
}

export interface PendingLostProject {
  id: number
  project_name: string
  status: string
  previous_status: string | null
  pending_lost_reason: string | null
  pending_lost_at: string | null
}

/** Move a project into pending_lost, remembering where it came from. */
export async function flagProjectPendingLost(projectId: number, reason: string | null): Promise<PendingLostProject> {
  await ensurePendingLostSchema()
  const sql = getSql()
  const rows = await sql`
    UPDATE projects
    SET previous_status = CASE WHEN status = 'pending_lost' THEN previous_status ELSE status END,
        status = 'pending_lost',
        pending_lost_reason = ${reason},
        pending_lost_at = NOW(),
        updated_at = NOW()
    WHERE id = ${projectId}
    RETURNING id, project_name, status, previous_status, pending_lost_reason, pending_lost_at
  `
  if (rows.length === 0) throw new Error(`Project ${projectId} not found`)
  return rows[0] as PendingLostProject
}

/** Confirm: pending_lost -> lost. Cancel: pending_lost -> previous stage. */
export async function resolvePendingLost(projectId: number, decision: "confirm" | "cancel"): Promise<PendingLostProject> {
  await ensurePendingLostSchema()
  const sql = getSql()

  const current = await sql`
    SELECT id, project_name, status, previous_status FROM projects WHERE id = ${projectId}
  `
  if (current.length === 0) throw new Error(`Project ${projectId} not found`)
  if (current[0].status !== "pending_lost") {
    throw new Error(`Project ${projectId} is not pending lost (status: ${current[0].status})`)
  }

  // Fall back to 'qualified' if the previous stage was never recorded
  const restoreTo = current[0].previous_status || "qualified"
  const nextStatus = decision === "confirm" ? "lost" : restoreTo

  const rows = await sql`
    UPDATE projects
    SET status = ${nextStatus},
        pending_lost_at = NULL,
        pending_lost_reason = CASE WHEN ${decision} = 'confirm' THEN pending_lost_reason ELSE NULL END,
        updated_at = NOW()
    WHERE id = ${projectId}
    RETURNING id, project_name, status, previous_status, pending_lost_reason, pending_lost_at
  `
  return rows[0] as PendingLostProject
}
