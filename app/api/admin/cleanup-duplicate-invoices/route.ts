import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const invoices = await sql`
      SELECT i.*, p.project_name, p.status as project_status, p.speaker_fee, p.budget,
        p.client_name as p_client_name, p.client_email as p_client_email, p.company as p_company,
        p.event_date as p_event_date,
        d.client_email as deal_client_email
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN deals d ON p.deal_id = d.id
      ORDER BY i.project_id, i.created_at ASC
    `

    // Group by project_id
    const byProject: Record<number, any[]> = {}
    for (const inv of invoices) {
      if (inv.project_id) {
        if (!byProject[inv.project_id]) byProject[inv.project_id] = []
        byProject[inv.project_id].push(inv)
      }
    }

    const deleted: any[] = []
    const created: any[] = []
    const kept: any[] = []
    let deleteErrors = 0
    let createErrors = 0

    for (const [projectId, invs] of Object.entries(byProject)) {
      const pid = Number(projectId)
      const deposits = invs.filter((i: any) => i.invoice_type === 'deposit')
      const finals = invs.filter((i: any) => i.invoice_type === 'final')
      const standards = invs.filter((i: any) => !i.invoice_type || (i.invoice_type !== 'deposit' && i.invoice_type !== 'final'))

      const hasDepositFinalPair = deposits.length >= 1 && finals.length >= 1

      // --- Case 1: Has deposit/final pair AND standard invoices ---
      // Delete draft standards, keep paid ones
      if (hasDepositFinalPair && standards.length > 0) {
        for (const std of standards) {
          if (std.status === 'paid') {
            kept.push({ id: std.id, number: std.invoice_number, reason: 'paid - not deleting', projectId: pid })
            continue
          }
          try {
            await sql`UPDATE invoices SET parent_invoice_id = NULL WHERE parent_invoice_id = ${std.id}`
            await sql`DELETE FROM invoices WHERE id = ${std.id}`
            deleted.push({ id: std.id, number: std.invoice_number, amount: Number(std.amount), projectId: pid, projectName: std.project_name, reason: 'standard duplicate alongside deposit/final pair' })
          } catch (e) {
            deleteErrors++
          }
        }

        // Also remove extra deposit/final duplicates if any (keep oldest pair)
        if (deposits.length > 1) {
          for (const dup of deposits.slice(1)) {
            if (dup.status === 'paid') { kept.push({ id: dup.id, number: dup.invoice_number, reason: 'paid deposit', projectId: pid }); continue }
            try {
              await sql`UPDATE invoices SET parent_invoice_id = NULL WHERE parent_invoice_id = ${dup.id}`
              await sql`DELETE FROM invoices WHERE id = ${dup.id}`
              deleted.push({ id: dup.id, number: dup.invoice_number, amount: Number(dup.amount), projectId: pid, projectName: dup.project_name, reason: 'extra deposit duplicate' })
            } catch (e) { deleteErrors++ }
          }
        }
        if (finals.length > 1) {
          for (const dup of finals.slice(1)) {
            if (dup.status === 'paid') { kept.push({ id: dup.id, number: dup.invoice_number, reason: 'paid final', projectId: pid }); continue }
            try {
              await sql`UPDATE invoices SET parent_invoice_id = NULL WHERE parent_invoice_id = ${dup.id}`
              await sql`DELETE FROM invoices WHERE id = ${dup.id}`
              deleted.push({ id: dup.id, number: dup.invoice_number, amount: Number(dup.amount), projectId: pid, projectName: dup.project_name, reason: 'extra final duplicate' })
            } catch (e) { deleteErrors++ }
          }
        }
      }

      // --- Case 2: Only standard invoices, no deposit/final pair ---
      // Delete draft standards, create proper deposit/final pair
      if (!hasDepositFinalPair && standards.length > 0) {
        // Keep any paid standard invoices
        const paidStandards = standards.filter((s: any) => s.status === 'paid')
        const draftStandards = standards.filter((s: any) => s.status !== 'paid')

        for (const ps of paidStandards) {
          kept.push({ id: ps.id, number: ps.invoice_number, reason: 'paid standard - keeping', projectId: pid })
        }

        // Delete draft standards
        for (const ds of draftStandards) {
          try {
            await sql`UPDATE invoices SET parent_invoice_id = NULL WHERE parent_invoice_id = ${ds.id}`
            await sql`DELETE FROM invoices WHERE id = ${ds.id}`
            deleted.push({ id: ds.id, number: ds.invoice_number, amount: Number(ds.amount), projectId: pid, projectName: ds.project_name, reason: 'old standard invoice replaced with deposit/final pair' })
          } catch (e) { deleteErrors++ }
        }

        // Create deposit/final pair (only if no paid standards cover it)
        if (paidStandards.length === 0) {
          try {
            const project = invs[0] // has joined project data
            const totalAmount = parseFloat(project.speaker_fee || project.budget || '0')
            if (totalAmount > 0) {
              const clientEmail = project.p_client_email || project.deal_client_email || `${(project.p_client_name || 'unknown').toLowerCase().replace(/\s+/g, '.')}@pending.info`
              const depositAmount = totalAmount * 0.5
              const finalAmount = totalAmount - depositAmount
              const depYear = new Date().getFullYear()
              const depMonth = String(new Date().getMonth() + 1).padStart(2, '0')

              const [depInv] = await sql`
                INSERT INTO invoices (project_id, invoice_number, invoice_type, amount, status, issue_date, due_date, description, client_name, client_email, client_company)
                VALUES (${pid}, ${`INV-DEP-${depYear}${depMonth}-${pid}`}, 'deposit', ${depositAmount}, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'Initial deposit (50% of total fee) for keynote presentation', ${project.p_client_name}, ${clientEmail}, ${project.p_company})
                RETURNING *
              `
              const eventDate = project.p_event_date || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
              await sql`
                INSERT INTO invoices (project_id, invoice_number, invoice_type, amount, status, issue_date, due_date, description, client_name, client_email, client_company, parent_invoice_id)
                VALUES (${pid}, ${`INV-FIN-${depYear}${depMonth}-${pid}`}, 'final', ${finalAmount}, 'draft', CURRENT_TIMESTAMP, ${eventDate}, 'Final payment (50% of total fee) due on event date', ${project.p_client_name}, ${clientEmail}, ${project.p_company}, ${depInv.id})
              `
              created.push({ projectId: pid, projectName: project.project_name, totalAmount, deposit: depositAmount, final: finalAmount })
            }
          } catch (e) {
            console.error(`Error creating replacement invoices for project ${pid}:`, e)
            createErrors++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} duplicate invoices, created ${created.length} replacement deposit/final pairs.`,
      summary: {
        invoicesDeleted: deleted.length,
        pairsCreated: created.length,
        paidKept: kept.length,
        deleteErrors,
        createErrors
      },
      deleted,
      created,
      kept
    })
  } catch (error) {
    console.error('Cleanup duplicate invoices error:', error)
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
  }
}
