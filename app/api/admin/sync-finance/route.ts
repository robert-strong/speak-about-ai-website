import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Step 1: Ensure all won deals are linked to projects
    await sql`
      UPDATE deals d
      SET project_id = p.id
      FROM projects p
      WHERE d.client_email = p.client_email
        AND d.status = 'won'
        AND d.project_id IS NULL
        AND p.id = (
          SELECT id FROM projects p2 
          WHERE p2.client_email = d.client_email 
          ORDER BY ABS(p2.event_date - d.event_date) ASC 
          LIMIT 1
        )
    `
    
    // Step 2: Sync financial data from deals to projects
    const result = await sql`
      UPDATE projects p
      SET 
        actual_revenue = COALESCE((
          SELECT SUM(d.deal_value) 
          FROM deals d 
          WHERE d.project_id = p.id 
          AND d.status = 'won'
        ), p.budget),
        commission_percentage = COALESCE((
          SELECT AVG(d.commission_percentage) 
          FROM deals d 
          WHERE d.project_id = p.id 
          AND d.status = 'won'
        ), 20),
        commission_amount = COALESCE((
          SELECT SUM(d.commission_amount) 
          FROM deals d 
          WHERE d.project_id = p.id 
          AND d.status = 'won'
        ), p.budget * 0.2),
        payment_status = CASE 
          WHEN EXISTS (
            SELECT 1 FROM deals d 
            WHERE d.project_id = p.id 
            AND d.payment_status = 'paid'
          ) THEN 'paid'
          WHEN EXISTS (
            SELECT 1 FROM deals d 
            WHERE d.project_id = p.id 
            AND d.payment_status = 'partial'
          ) THEN 'partial'
          ELSE 'pending'
        END,
        payment_date = (
          SELECT MAX(d.payment_date) 
          FROM deals d 
          WHERE d.project_id = p.id 
          AND d.payment_status = 'paid'
        ),
        updated_at = NOW()
      WHERE EXISTS (
        SELECT 1 FROM deals d 
        WHERE d.project_id = p.id
      )
      RETURNING id
    `
    
    // Step 3: Get sync summary
    const summary = await sql`
      SELECT 
        COUNT(DISTINCT d.id) as total_deals,
        COUNT(DISTINCT d.project_id) as linked_projects,
        SUM(d.deal_value) as total_value,
        SUM(d.commission_amount) as total_commission
      FROM deals d
      WHERE d.status = 'won'
    `
    
    return NextResponse.json({
      success: true,
      projectsUpdated: result.length,
      summary: summary[0]
    })
    
  } catch (error) {
    console.error('Error syncing finance data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync finance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current sync status
export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Get sync status
    const status = await sql`
      SELECT 
        d.id as deal_id,
        d.client_name,
        d.deal_value,
        d.payment_status as deal_payment_status,
        d.project_id,
        p.project_name,
        p.budget,
        p.commission_amount,
        p.payment_status as project_payment_status,
        CASE 
          WHEN d.project_id IS NULL THEN 'Unlinked'
          WHEN d.payment_status = p.payment_status THEN 'Synced'
          ELSE 'Out of Sync'
        END as sync_status
      FROM deals d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.status = 'won'
      ORDER BY d.client_name, d.event_date
    `
    
    const summary = {
      totalDeals: status.length,
      linked: status.filter(s => s.project_id !== null).length,
      synced: status.filter(s => s.sync_status === 'Synced').length,
      outOfSync: status.filter(s => s.sync_status === 'Out of Sync').length,
      unlinked: status.filter(s => s.sync_status === 'Unlinked').length
    }
    
    return NextResponse.json({
      status,
      summary
    })
    
  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}