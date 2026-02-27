import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = params.id
    const body = await request.json()
    const sql = neon(process.env.DATABASE_URL!)
    
    const {
      deal_value,
      commission_percentage,
      commission_amount,
      payment_status,
      payment_date,
      invoice_number,
      notes,
      contract_link,
      invoice_link_1,
      invoice_link_2,
      contract_signed_date,
      invoice_1_sent_date,
      invoice_2_sent_date
    } = body
    
    // Calculate commission amount if percentage is provided
    const calculatedCommission = commission_amount || (deal_value * commission_percentage / 100)
    
    // Update the deal with financial information
    const result = await sql`
      UPDATE deals 
      SET 
        deal_value = ${deal_value},
        commission_percentage = ${commission_percentage},
        commission_amount = ${calculatedCommission},
        payment_status = ${payment_status},
        payment_date = ${payment_date},
        invoice_number = ${invoice_number},
        financial_notes = ${notes},
        contract_link = ${contract_link},
        invoice_link_1 = ${invoice_link_1},
        invoice_link_2 = ${invoice_link_2},
        contract_signed_date = ${contract_signed_date},
        invoice_1_sent_date = ${invoice_1_sent_date},
        invoice_2_sent_date = ${invoice_2_sent_date},
        updated_at = NOW()
      WHERE id = ${dealId}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Deal not found' 
      }, { status: 404 })
    }
    
    const updatedDeal = result[0]
    
    // Propagate syncable field changes to all linked entities
    try {
      const { propagateChanges } = await import("@/lib/entity-sync")
      const changedFields: Record<string, any> = { deal_value }
      await propagateChanges({ sourceEntity: 'deal', sourceId: Number(dealId), changedFields })

      return NextResponse.json({
        deal: updatedDeal,
        success: true
      })
    } catch (syncError) {
      console.error('Warning: Entity sync failed:', syncError)
      return NextResponse.json({
        deal: updatedDeal,
        success: true,
        warning: 'Deal updated but entity sync failed'
      })
    }
    
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json({ 
      error: 'Failed to update deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dealId = params.id
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      SELECT 
        d.*,
        p.id as project_id,
        p.project_name,
        p.budget as project_budget,
        p.speaker_fee,
        p.status as project_status
      FROM deals d
      LEFT JOIN projects p ON p.client_email = d.client_email 
        AND p.event_date = d.event_date
      WHERE d.id = ${dealId}
    `
    
    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Deal not found' 
      }, { status: 404 })
    }
    
    const deal = result[0]
    
    return NextResponse.json({ 
      deal: {
        ...deal,
        project: deal.project_id ? {
          id: deal.project_id,
          project_name: deal.project_name,
          budget: deal.project_budget,
          speaker_fee: deal.speaker_fee,
          status: deal.project_status
        } : null
      },
      success: true 
    })
    
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch deal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}