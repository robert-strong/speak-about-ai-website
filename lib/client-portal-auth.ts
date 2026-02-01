import { createToken, verifyToken } from './jwt'
import { neon } from "@neondatabase/serverless"
import crypto from 'crypto'

// Initialize Neon client
let sql: any = null
if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL)
}

// Generate a secure random token
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

// Generate client portal access token for a project
export async function generateClientPortalToken(
  projectId: number, 
  clientEmail: string,
  expiresInDays: number = 30
): Promise<string> {
  const token = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)
  
  try {
    // Update project with client portal token
    await sql`
      UPDATE projects 
      SET 
        client_portal_token = ${token},
        client_portal_expires_at = ${expiresAt.toISOString()},
        client_portal_invited_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `
    
    return token
  } catch (error) {
    console.error('Error generating client portal token:', error)
    throw error
  }
}

// Create and send client invitation
export async function createClientInvitation(
  projectId: number,
  clientEmail: string,
  invitedBy: string,
  expiresInDays: number = 7
): Promise<{ token: string; invitationId: number }> {
  const invitationToken = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)
  
  try {
    // Create invitation record
    const [invitation] = await sql`
      INSERT INTO client_portal_invitations (
        project_id,
        client_email,
        invitation_token,
        invited_by,
        expires_at,
        status
      ) VALUES (
        ${projectId},
        ${clientEmail.toLowerCase()},
        ${invitationToken},
        ${invitedBy},
        ${expiresAt.toISOString()},
        'pending'
      )
      RETURNING id, invitation_token
    `
    
    // Also generate and store the project access token
    await generateClientPortalToken(projectId, clientEmail, 30)
    
    // Log the invitation
    await logClientPortalAction(projectId, clientEmail, 'invitation_sent', null, null, null, null, null)
    
    return {
      token: invitationToken,
      invitationId: invitation.id
    }
  } catch (error) {
    console.error('Error creating client invitation:', error)
    throw error
  }
}

// Validate client invitation token
export async function validateInvitationToken(token: string): Promise<{
  valid: boolean;
  projectId?: number;
  clientEmail?: string;
  project?: any;
}> {
  try {
    const [invitation] = await sql`
      SELECT 
        i.*,
        p.id as project_id,
        p.project_name,
        p.client_name,
        p.company,
        p.event_name,
        p.event_date
      FROM client_portal_invitations i
      JOIN projects p ON i.project_id = p.id
      WHERE i.invitation_token = ${token}
        AND i.status = 'pending'
        AND i.expires_at > CURRENT_TIMESTAMP
    `
    
    if (!invitation) {
      return { valid: false }
    }
    
    return {
      valid: true,
      projectId: invitation.project_id,
      clientEmail: invitation.client_email,
      project: {
        id: invitation.project_id,
        project_name: invitation.project_name,
        client_name: invitation.client_name,
        company: invitation.company,
        event_name: invitation.event_name,
        event_date: invitation.event_date
      }
    }
  } catch (error) {
    console.error('Error validating invitation token:', error)
    return { valid: false }
  }
}

// Accept client invitation
export async function acceptInvitation(token: string): Promise<{
  success: boolean;
  projectToken?: string;
  projectId?: number;
}> {
  try {
    const validation = await validateInvitationToken(token)
    if (!validation.valid || !validation.projectId) {
      return { success: false }
    }
    
    // Mark invitation as accepted
    await sql`
      UPDATE client_portal_invitations
      SET 
        status = 'accepted',
        accepted_at = CURRENT_TIMESTAMP
      WHERE invitation_token = ${token}
    `
    
    // Get the project's client portal token
    const [project] = await sql`
      SELECT client_portal_token
      FROM projects
      WHERE id = ${validation.projectId}
    `
    
    // Log the acceptance
    await logClientPortalAction(
      validation.projectId, 
      validation.clientEmail || '', 
      'invitation_accepted',
      null, null, null, null, null
    )
    
    return {
      success: true,
      projectToken: project.client_portal_token,
      projectId: validation.projectId
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { success: false }
  }
}

// Validate client portal access to a project
export async function validateClientPortalAccess(
  token: string,
  projectId: number
): Promise<{ valid: boolean; project?: any }> {
  try {
    const [project] = await sql`
      SELECT *
      FROM projects
      WHERE id = ${projectId}
        AND client_portal_token = ${token}
        AND client_portal_enabled = true
        AND (client_portal_expires_at IS NULL OR client_portal_expires_at > CURRENT_TIMESTAMP)
    `
    
    if (!project) {
      return { valid: false }
    }
    
    // Update last accessed timestamp
    await sql`
      UPDATE projects
      SET client_portal_last_accessed = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `
    
    return {
      valid: true,
      project
    }
  } catch (error) {
    console.error('Error validating client portal access:', error)
    return { valid: false }
  }
}

// Log client portal actions for audit
export async function logClientPortalAction(
  projectId: number,
  clientEmail: string,
  action: string,
  fieldChanged?: string | null,
  oldValue?: string | null,
  newValue?: string | null,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  try {
    await sql`
      INSERT INTO client_portal_audit_log (
        project_id,
        client_email,
        action,
        field_changed,
        old_value,
        new_value,
        ip_address,
        user_agent
      ) VALUES (
        ${projectId},
        ${clientEmail.toLowerCase()},
        ${action},
        ${fieldChanged},
        ${oldValue},
        ${newValue},
        ${ipAddress},
        ${userAgent}
      )
    `
  } catch (error) {
    console.error('Error logging client portal action:', error)
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// Filter project data based on client permissions
export function filterProjectForClient(
  project: any,
  includeEditableFields: boolean = true
): any {
  const viewOnlyFields = project.client_view_only_fields || [
    'project_name', 'event_name', 'event_date', 'requested_speaker_name', 
    'program_topic', 'program_type', 'audience_size', 'speaker_attire', 
    'event_timeline', 'event_timezone', 'travel_required', 'fly_in_date', 
    'fly_out_date', 'accommodation_required', 'speaker_fee', 
    'travel_expenses_amount', 'payment_terms', 'event_location', 
    'event_type', 'budget'
  ]
  
  const editableFields = project.client_editable_fields || [
    'venue_name', 'venue_address', 'venue_contact_name', 'venue_contact_email', 
    'venue_contact_phone', 'event_start_time', 'event_end_time', 'program_start_time', 
    'program_length', 'qa_length', 'audience_demographics', 'av_requirements', 
    'recording_purpose', 'tech_rehearsal_date', 'tech_rehearsal_time',
    'airport_transport_details', 'venue_transport_details', 'hotel_dates_needed', 
    'guest_list_details', 'meet_greet_opportunities', 'media_interview_requests', 
    'special_requests', 'prep_call_requested', 'prep_call_date', 'prep_call_time', 
    'additional_notes', 'billing_contact_name', 'billing_contact_email',
    'billing_contact_phone', 'billing_address', 'logistics_contact_name', 
    'logistics_contact_email', 'logistics_contact_phone'
  ]
  
  const allowedFields = includeEditableFields 
    ? [...viewOnlyFields, ...editableFields]
    : viewOnlyFields
  
  const filteredProject: any = {
    id: project.id,
    client_editable_fields: editableFields,
    client_view_only_fields: viewOnlyFields
  }
  
  // Include only allowed fields
  for (const field of allowedFields) {
    if (project[field] !== undefined) {
      filteredProject[field] = project[field]
    }
  }
  
  return filteredProject
}

// Validate and filter client updates
export function validateClientUpdate(
  updates: any,
  editableFields: string[]
): any {
  const validatedUpdates: any = {}
  
  for (const [key, value] of Object.entries(updates)) {
    if (editableFields.includes(key)) {
      validatedUpdates[key] = value
    }
  }
  
  return validatedUpdates
}