import { neon } from "@neondatabase/serverless"

// Types
export interface VendorMetrics {
  totalVendors: number
  activeVendors: number
  pendingVendors: number
  averageApprovalTime: number
  conversionRate: number
  topCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
  monthlyGrowth: number
  satisfactionScore: number
}

export interface VendorActivity {
  id: number
  vendor_id: number
  activity_type: string
  description: string
  metadata?: any
  created_at: string
  created_by?: string
}

export interface VendorDocument {
  id: number
  vendor_id: number
  document_type: string
  document_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  status: "pending" | "approved" | "rejected"
  uploaded_at: string
  reviewed_at?: string
  reviewed_by?: string
  notes?: string
}

export interface VendorCompliance {
  vendor_id: number
  insurance_verified: boolean
  insurance_expiry?: string
  license_verified: boolean
  license_number?: string
  license_expiry?: string
  certifications?: string[]
  background_check: boolean
  background_check_date?: string
  tax_id_verified: boolean
  contract_signed: boolean
  contract_date?: string
  compliance_score: number
  last_review_date?: string
  next_review_date?: string
}

export interface VendorPerformance {
  vendor_id: number
  total_events: number
  successful_events: number
  cancelled_events: number
  average_rating: number
  total_reviews: number
  response_time_hours: number
  on_time_delivery_rate: number
  client_satisfaction_score: number
  revenue_generated?: number
  last_event_date?: string
  performance_tier: "bronze" | "silver" | "gold" | "platinum"
}

export interface VendorOnboarding {
  vendor_id: number
  step: number
  total_steps: number
  current_status: string
  completion_percentage: number
  started_at: string
  completed_at?: string
  steps_completed: string[]
  pending_actions: string[]
  assigned_to?: string
  notes?: string
}

class VendorService {
  private sql: any

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set")
    }
    this.sql = neon(process.env.DATABASE_URL)
  }

  // Advanced vendor search with filters
  async searchVendors(params: {
    query?: string
    category?: string
    location?: string
    priceRange?: string
    rating?: number
    verified?: boolean
    featured?: boolean
    status?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    limit?: number
    offset?: number
  }) {
    const {
      query = "",
      limit = 20,
      offset = 0,
      sortBy = "created_at",
      sortOrder = "desc"
    } = params

    let conditions = ["1=1"]
    let queryParams = []

    if (query) {
      conditions.push(`(
        company_name ILIKE '%' || $${queryParams.length + 1} || '%' OR
        description ILIKE '%' || $${queryParams.length + 1} || '%' OR
        contact_email ILIKE '%' || $${queryParams.length + 1} || '%'
      )`)
      queryParams.push(query)
    }

    if (params.category) {
      conditions.push(`category_id = $${queryParams.length + 1}`)
      queryParams.push(params.category)
    }

    if (params.status) {
      conditions.push(`status = $${queryParams.length + 1}`)
      queryParams.push(params.status)
    }

    if (params.verified !== undefined) {
      conditions.push(`verified = $${queryParams.length + 1}`)
      queryParams.push(params.verified)
    }

    const whereClause = conditions.join(" AND ")
    const orderClause = `ORDER BY ${sortBy} ${sortOrder}`

    const vendors = await this.sql`
      SELECT 
        v.*,
        vc.name as category_name,
        COALESCE(vp.average_rating, 0) as rating,
        COALESCE(vp.total_reviews, 0) as review_count,
        COALESCE(vp.total_events, 0) as event_count
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN (
        SELECT 
          vendor_id,
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews,
          COUNT(DISTINCT vi.event_id) as total_events
        FROM vendor_reviews vr
        LEFT JOIN vendor_inquiries vi ON vi.vendor_id = vr.vendor_id
        WHERE vr.status = 'approved'
        GROUP BY vr.vendor_id
      ) vp ON v.id = vp.vendor_id
      WHERE ${whereClause}
      ${orderClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const total = await this.sql`
      SELECT COUNT(*) as count
      FROM vendors v
      WHERE ${whereClause}
    `

    return {
      vendors,
      total: total[0].count,
      hasMore: offset + limit < total[0].count
    }
  }

  // Get vendor metrics and analytics
  async getVendorMetrics(timeframe: "week" | "month" | "quarter" | "year" = "month"): Promise<VendorMetrics> {
    const timeframes = {
      week: "7 days",
      month: "30 days",
      quarter: "90 days",
      year: "365 days"
    }

    const interval = timeframes[timeframe]

    const metrics = await this.sql`
      WITH vendor_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE status = 'approved') as active_count,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          COUNT(*) as total_count,
          AVG(
            CASE 
              WHEN status = 'approved' AND approved_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600
              ELSE NULL
            END
          ) as avg_approval_hours,
          COUNT(*) FILTER (WHERE status = 'approved') * 100.0 / NULLIF(COUNT(*), 0) as conversion_rate
        FROM vendors
      ),
      category_stats AS (
        SELECT 
          vc.name as category,
          COUNT(v.id) as count
        FROM vendor_categories vc
        LEFT JOIN vendors v ON v.category_id = vc.id
        WHERE v.status = 'approved'
        GROUP BY vc.name
        ORDER BY count DESC
        LIMIT 5
      ),
      growth_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}') as recent_count,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}' * 2 
                           AND created_at < CURRENT_DATE - INTERVAL '${interval}') as previous_count
        FROM vendors
      ),
      satisfaction_stats AS (
        SELECT AVG(rating) as avg_satisfaction
        FROM vendor_reviews
        WHERE status = 'approved'
        AND created_at >= CURRENT_DATE - INTERVAL '${interval}'
      )
      SELECT 
        vs.*,
        gs.recent_count,
        gs.previous_count,
        ss.avg_satisfaction,
        (
          SELECT json_agg(
            json_build_object(
              'category', category,
              'count', count,
              'percentage', count * 100.0 / vs.active_count
            )
          )
          FROM category_stats
        ) as top_categories
      FROM vendor_stats vs, growth_stats gs, satisfaction_stats ss
    `

    const result = metrics[0]
    const monthlyGrowth = result.previous_count > 0 
      ? ((result.recent_count - result.previous_count) / result.previous_count) * 100
      : 0

    return {
      totalVendors: result.total_count,
      activeVendors: result.active_count,
      pendingVendors: result.pending_count,
      averageApprovalTime: result.avg_approval_hours || 0,
      conversionRate: result.conversion_rate || 0,
      topCategories: result.top_categories || [],
      monthlyGrowth,
      satisfactionScore: result.avg_satisfaction || 0
    }
  }

  // Track vendor activity
  async logActivity(activity: Partial<VendorActivity>) {
    const result = await this.sql`
      INSERT INTO vendor_activity (
        vendor_id, activity_type, description, metadata, created_by
      ) VALUES (
        ${activity.vendor_id},
        ${activity.activity_type},
        ${activity.description},
        ${activity.metadata || {}},
        ${activity.created_by}
      )
      RETURNING *
    `
    return result[0]
  }

  // Get vendor activity history
  async getVendorActivity(vendorId: number, limit = 50) {
    return await this.sql`
      SELECT * FROM vendor_activity
      WHERE vendor_id = ${vendorId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
  }

  // Vendor compliance management
  async updateCompliance(vendorId: number, compliance: Partial<VendorCompliance>) {
    const complianceScore = this.calculateComplianceScore(compliance)
    
    const result = await this.sql`
      INSERT INTO vendor_compliance (
        vendor_id, insurance_verified, insurance_expiry, 
        license_verified, license_number, license_expiry,
        certifications, background_check, background_check_date,
        tax_id_verified, contract_signed, contract_date,
        compliance_score, last_review_date, next_review_date
      ) VALUES (
        ${vendorId},
        ${compliance.insurance_verified || false},
        ${compliance.insurance_expiry},
        ${compliance.license_verified || false},
        ${compliance.license_number},
        ${compliance.license_expiry},
        ${compliance.certifications || []},
        ${compliance.background_check || false},
        ${compliance.background_check_date},
        ${compliance.tax_id_verified || false},
        ${compliance.contract_signed || false},
        ${compliance.contract_date},
        ${complianceScore},
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '90 days'
      )
      ON CONFLICT (vendor_id) DO UPDATE SET
        insurance_verified = EXCLUDED.insurance_verified,
        insurance_expiry = EXCLUDED.insurance_expiry,
        license_verified = EXCLUDED.license_verified,
        license_number = EXCLUDED.license_number,
        license_expiry = EXCLUDED.license_expiry,
        certifications = EXCLUDED.certifications,
        background_check = EXCLUDED.background_check,
        background_check_date = EXCLUDED.background_check_date,
        tax_id_verified = EXCLUDED.tax_id_verified,
        contract_signed = EXCLUDED.contract_signed,
        contract_date = EXCLUDED.contract_date,
        compliance_score = EXCLUDED.compliance_score,
        last_review_date = EXCLUDED.last_review_date,
        next_review_date = EXCLUDED.next_review_date
      RETURNING *
    `
    
    await this.logActivity({
      vendor_id: vendorId,
      activity_type: "compliance_update",
      description: `Compliance score updated to ${complianceScore}%`,
      metadata: { compliance_score: complianceScore }
    })
    
    return result[0]
  }

  // Calculate compliance score
  private calculateComplianceScore(compliance: Partial<VendorCompliance>): number {
    let score = 0
    let totalWeight = 0

    const checks = [
      { field: "insurance_verified", weight: 25 },
      { field: "license_verified", weight: 25 },
      { field: "background_check", weight: 20 },
      { field: "tax_id_verified", weight: 15 },
      { field: "contract_signed", weight: 15 }
    ]

    checks.forEach(check => {
      totalWeight += check.weight
      if (compliance[check.field as keyof VendorCompliance]) {
        score += check.weight
      }
    })

    return Math.round((score / totalWeight) * 100)
  }

  // Vendor performance tracking
  async updatePerformance(vendorId: number) {
    const result = await this.sql`
      WITH performance_data AS (
        SELECT 
          ${vendorId} as vendor_id,
          COUNT(DISTINCT vi.id) as total_events,
          COUNT(DISTINCT vi.id) FILTER (WHERE vi.status = 'completed') as successful_events,
          COUNT(DISTINCT vi.id) FILTER (WHERE vi.status = 'cancelled') as cancelled_events,
          AVG(vr.rating) as average_rating,
          COUNT(DISTINCT vr.id) as total_reviews,
          AVG(vi.response_time_hours) as response_time_hours,
          COUNT(DISTINCT vi.id) FILTER (WHERE vi.on_time_delivery = true) * 100.0 / 
            NULLIF(COUNT(DISTINCT vi.id), 0) as on_time_delivery_rate,
          AVG(vr.rating) * 20 as client_satisfaction_score,
          SUM(vi.revenue) as revenue_generated,
          MAX(vi.event_date) as last_event_date
        FROM vendor_inquiries vi
        LEFT JOIN vendor_reviews vr ON vr.vendor_id = vi.vendor_id
        WHERE vi.vendor_id = ${vendorId}
      )
      INSERT INTO vendor_performance (
        vendor_id, total_events, successful_events, cancelled_events,
        average_rating, total_reviews, response_time_hours,
        on_time_delivery_rate, client_satisfaction_score,
        revenue_generated, last_event_date, performance_tier
      )
      SELECT 
        vendor_id, total_events, successful_events, cancelled_events,
        COALESCE(average_rating, 0), total_reviews, 
        COALESCE(response_time_hours, 0),
        COALESCE(on_time_delivery_rate, 0),
        COALESCE(client_satisfaction_score, 0),
        revenue_generated, last_event_date,
        CASE 
          WHEN COALESCE(average_rating, 0) >= 4.5 AND total_events >= 50 THEN 'platinum'
          WHEN COALESCE(average_rating, 0) >= 4.0 AND total_events >= 25 THEN 'gold'
          WHEN COALESCE(average_rating, 0) >= 3.5 AND total_events >= 10 THEN 'silver'
          ELSE 'bronze'
        END as performance_tier
      FROM performance_data
      ON CONFLICT (vendor_id) DO UPDATE SET
        total_events = EXCLUDED.total_events,
        successful_events = EXCLUDED.successful_events,
        cancelled_events = EXCLUDED.cancelled_events,
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        response_time_hours = EXCLUDED.response_time_hours,
        on_time_delivery_rate = EXCLUDED.on_time_delivery_rate,
        client_satisfaction_score = EXCLUDED.client_satisfaction_score,
        revenue_generated = EXCLUDED.revenue_generated,
        last_event_date = EXCLUDED.last_event_date,
        performance_tier = EXCLUDED.performance_tier
      RETURNING *
    `
    
    return result[0]
  }

  // Automated onboarding workflow
  async initializeOnboarding(vendorId: number) {
    const onboardingSteps = [
      "profile_completion",
      "document_upload",
      "compliance_verification",
      "contract_signing",
      "payment_setup",
      "training_completion",
      "first_listing_creation",
      "final_approval"
    ]

    const result = await this.sql`
      INSERT INTO vendor_onboarding (
        vendor_id, step, total_steps, current_status,
        completion_percentage, started_at, steps_completed,
        pending_actions
      ) VALUES (
        ${vendorId},
        1,
        ${onboardingSteps.length},
        'profile_completion',
        0,
        CURRENT_TIMESTAMP,
        '[]'::jsonb,
        ${JSON.stringify(onboardingSteps)}
      )
      ON CONFLICT (vendor_id) DO NOTHING
      RETURNING *
    `

    await this.logActivity({
      vendor_id: vendorId,
      activity_type: "onboarding_started",
      description: "Vendor onboarding process initiated"
    })

    return result[0]
  }

  // Update onboarding progress
  async updateOnboardingProgress(vendorId: number, completedStep: string) {
    const current = await this.sql`
      SELECT * FROM vendor_onboarding
      WHERE vendor_id = ${vendorId}
    `

    if (!current[0]) {
      await this.initializeOnboarding(vendorId)
      return this.updateOnboardingProgress(vendorId, completedStep)
    }

    const stepsCompleted = [...(current[0].steps_completed || []), completedStep]
    const pendingActions = (current[0].pending_actions || []).filter(
      (action: string) => action !== completedStep
    )
    const completionPercentage = (stepsCompleted.length / current[0].total_steps) * 100
    const isComplete = completionPercentage === 100

    const result = await this.sql`
      UPDATE vendor_onboarding SET
        step = step + 1,
        current_status = ${pendingActions[0] || 'completed'},
        completion_percentage = ${completionPercentage},
        steps_completed = ${JSON.stringify(stepsCompleted)},
        pending_actions = ${JSON.stringify(pendingActions)},
        completed_at = ${isComplete ? new Date() : null}
      WHERE vendor_id = ${vendorId}
      RETURNING *
    `

    await this.logActivity({
      vendor_id: vendorId,
      activity_type: "onboarding_progress",
      description: `Completed step: ${completedStep}`,
      metadata: { 
        step: completedStep, 
        completion: completionPercentage,
        is_complete: isComplete
      }
    })

    if (isComplete) {
      await this.sql`
        UPDATE vendors 
        SET status = 'approved', approved_at = CURRENT_TIMESTAMP
        WHERE id = ${vendorId}
      `
    }

    return result[0]
  }

  // Document management
  async uploadDocument(document: Partial<VendorDocument>) {
    const result = await this.sql`
      INSERT INTO vendor_documents (
        vendor_id, document_type, document_name,
        file_url, file_size, mime_type, status
      ) VALUES (
        ${document.vendor_id},
        ${document.document_type},
        ${document.document_name},
        ${document.file_url},
        ${document.file_size},
        ${document.mime_type},
        'pending'
      )
      RETURNING *
    `

    await this.logActivity({
      vendor_id: document.vendor_id!,
      activity_type: "document_uploaded",
      description: `Uploaded document: ${document.document_name}`,
      metadata: { document_type: document.document_type }
    })

    return result[0]
  }

  // Review document
  async reviewDocument(documentId: number, status: "approved" | "rejected", reviewerEmail: string, notes?: string) {
    const result = await this.sql`
      UPDATE vendor_documents SET
        status = ${status},
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ${reviewerEmail},
        notes = ${notes}
      WHERE id = ${documentId}
      RETURNING *
    `

    const doc = result[0]
    await this.logActivity({
      vendor_id: doc.vendor_id,
      activity_type: "document_reviewed",
      description: `Document ${status}: ${doc.document_name}`,
      metadata: { 
        document_id: documentId,
        status,
        reviewer: reviewerEmail
      }
    })

    return doc
  }

  // Get vendor documents
  async getVendorDocuments(vendorId: number) {
    return await this.sql`
      SELECT * FROM vendor_documents
      WHERE vendor_id = ${vendorId}
      ORDER BY uploaded_at DESC
    `
  }

  // Bulk vendor operations
  async bulkUpdateStatus(vendorIds: number[], status: string, reviewerEmail: string) {
    const results = await this.sql`
      UPDATE vendors SET
        status = ${status},
        updated_at = CURRENT_TIMESTAMP,
        approved_at = ${status === 'approved' ? this.sql`CURRENT_TIMESTAMP` : this.sql`approved_at`},
        approved_by = ${status === 'approved' ? reviewerEmail : this.sql`approved_by`}
      WHERE id = ANY(${vendorIds})
      RETURNING id, company_name, status
    `

    // Log activity for each vendor
    for (const vendor of results) {
      await this.logActivity({
        vendor_id: vendor.id,
        activity_type: "status_change",
        description: `Status changed to ${status}`,
        created_by: reviewerEmail,
        metadata: { 
          previous_status: "pending",
          new_status: status,
          bulk_operation: true
        }
      })
    }

    return results
  }

  // Send vendor notification
  async sendNotification(vendorId: number, type: string, data: any) {
    const vendor = await this.sql`
      SELECT * FROM vendors WHERE id = ${vendorId}
    `

    if (!vendor[0]) throw new Error("Vendor not found")

    const notification = await this.sql`
      INSERT INTO email_notifications (
        recipient_email,
        recipient_name,
        subject,
        template_id,
        template_data,
        status
      ) VALUES (
        ${vendor[0].contact_email},
        ${vendor[0].contact_name},
        ${data.subject},
        ${type},
        ${JSON.stringify(data)},
        'pending'
      )
      RETURNING id
    `

    await this.logActivity({
      vendor_id: vendorId,
      activity_type: "notification_sent",
      description: `Notification sent: ${type}`,
      metadata: { notification_id: notification[0].id }
    })

    return notification[0]
  }

  // Get vendors requiring action
  async getVendorsRequiringAction() {
    const results = await this.sql`
      SELECT 
        v.id,
        v.company_name,
        v.contact_email,
        v.status,
        v.created_at,
        ARRAY_AGG(DISTINCT 
          CASE 
            WHEN v.status = 'pending' AND v.created_at < CURRENT_DATE - INTERVAL '7 days' 
              THEN 'overdue_review'
            WHEN vc.compliance_score < 50 THEN 'low_compliance'
            WHEN vc.insurance_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'insurance_expiring'
            WHEN vc.license_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'license_expiring'
            WHEN vo.completion_percentage < 100 AND vo.started_at < CURRENT_DATE - INTERVAL '14 days' 
              THEN 'incomplete_onboarding'
            WHEN vd.status = 'pending' THEN 'pending_documents'
          END
        ) FILTER (WHERE 
          CASE 
            WHEN v.status = 'pending' AND v.created_at < CURRENT_DATE - INTERVAL '7 days' THEN true
            WHEN vc.compliance_score < 50 THEN true
            WHEN vc.insurance_expiry < CURRENT_DATE + INTERVAL '30 days' THEN true
            WHEN vc.license_expiry < CURRENT_DATE + INTERVAL '30 days' THEN true
            WHEN vo.completion_percentage < 100 AND vo.started_at < CURRENT_DATE - INTERVAL '14 days' THEN true
            WHEN vd.status = 'pending' THEN true
            ELSE false
          END
        ) as required_actions
      FROM vendors v
      LEFT JOIN vendor_compliance vc ON vc.vendor_id = v.id
      LEFT JOIN vendor_onboarding vo ON vo.vendor_id = v.id
      LEFT JOIN vendor_documents vd ON vd.vendor_id = v.id
      GROUP BY v.id, v.company_name, v.contact_email, v.status, v.created_at
      HAVING COUNT(DISTINCT 
        CASE 
          WHEN v.status = 'pending' AND v.created_at < CURRENT_DATE - INTERVAL '7 days' 
            THEN 'overdue_review'
          WHEN vc.compliance_score < 50 THEN 'low_compliance'
          WHEN vc.insurance_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'insurance_expiring'
          WHEN vc.license_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'license_expiring'
          WHEN vo.completion_percentage < 100 AND vo.started_at < CURRENT_DATE - INTERVAL '14 days' 
            THEN 'incomplete_onboarding'
          WHEN vd.status = 'pending' THEN 'pending_documents'
        END
      ) > 0
      ORDER BY v.created_at ASC
    `

    return results
  }
}

// Export singleton instance
export const vendorService = new VendorService()