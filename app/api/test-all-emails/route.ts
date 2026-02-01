import { NextResponse } from 'next/server'
import * as emailService from '@/lib/email-service-unified'

// Set test mode to prevent actual sending
process.env.EMAIL_TEST_MODE = 'true'

export async function GET() {
  const testResults: any[] = []
  
  // Test 1: Deal/Inquiry Email
  try {
    const dealResult = await emailService.sendNewInquiryEmail(
      {
        id: 1,
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        phone: '555-0000',
        company: 'Test Corp',
        organizationName: 'Test Organization',
        eventTitle: 'AI Summit 2025',
        eventDate: '2025-12-01',
        eventLocation: 'San Francisco, CA',
        dealValue: 50000,
        eventBudget: '25k-50k',
        status: 'lead',
        priority: 'high',
        specificSpeaker: 'Sam Altman',
        additionalInfo: 'Test inquiry',
        wishlistSpeakers: [],
        source: 'website_form',
        notes: null,
        createdAt: new Date().toISOString()
      },
      {
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        phone: '555-0000',
        organizationName: 'Test Organization',
        specificSpeaker: 'Sam Altman',
        eventDate: '2025-12-01',
        eventLocation: 'San Francisco, CA',
        eventBudget: '25k-50k',
        additionalInfo: 'Test inquiry',
        wishlistSpeakers: []
      }
    )
    testResults.push({ 
      test: 'Deal/Inquiry Email', 
      status: dealResult ? 'PASS' : 'FAIL',
      details: 'Admin notification and client confirmation'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Deal/Inquiry Email', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 2: Proposal Email
  try {
    const proposalResult = await emailService.sendProposalEmail({
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
      eventTitle: 'Tech Conference 2025',
      eventDate: '2025-10-15',
      eventLocation: 'New York, NY',
      speakerName: 'Geoffrey Hinton',
      token: 'test-proposal-token'
    })
    testResults.push({ 
      test: 'Proposal Email', 
      status: proposalResult ? 'PASS' : 'FAIL',
      details: 'Proposal sent to client'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Proposal Email', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Proposal Accepted Email
  try {
    const acceptedResult = await emailService.sendProposalAcceptedEmail({
      clientName: 'Jane Smith',
      clientEmail: 'jane@example.com',
      eventTitle: 'AI Workshop',
      eventDate: '2025-11-20',
      speakerName: 'Yann LeCun',
      speakerFee: 75000
    })
    testResults.push({ 
      test: 'Proposal Accepted Email', 
      status: acceptedResult ? 'PASS' : 'FAIL',
      details: 'Admin and client notifications'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Proposal Accepted Email', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 4: Proposal Rejected Email
  try {
    const rejectedResult = await emailService.sendProposalRejectedEmail({
      clientName: 'Bob Johnson',
      clientEmail: 'bob@example.com',
      eventTitle: 'Data Science Summit',
      speakerName: 'Andrew Ng'
    }, 'Budget constraints')
    testResults.push({ 
      test: 'Proposal Rejected Email', 
      status: rejectedResult ? 'PASS' : 'FAIL',
      details: 'Admin notification'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Proposal Rejected Email', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 5: Contract Email (Client)
  try {
    const contractClientResult = await emailService.sendContractEmail({
      clientName: 'Alice Cooper',
      clientEmail: 'alice@example.com',
      speakerName: 'Demis Hassabis',
      speakerEmail: 'speaker@example.com',
      eventTitle: 'AI Ethics Forum',
      eventDate: '2025-09-15',
      eventLocation: 'London, UK',
      speakerFee: 100000,
      token: 'test-contract-token'
    }, 'client')
    testResults.push({ 
      test: 'Contract Email (Client)', 
      status: contractClientResult ? 'PASS' : 'FAIL',
      details: 'Contract signing request to client'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Contract Email (Client)', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 6: Contract Email (Speaker)
  try {
    const contractSpeakerResult = await emailService.sendContractEmail({
      clientName: 'Corporate Client',
      clientEmail: 'client@corp.com',
      speakerName: 'AI Expert',
      speakerEmail: 'speaker@ai.com',
      eventTitle: 'Executive Briefing',
      eventDate: '2025-08-20',
      eventLocation: 'Virtual',
      speakerFee: 50000,
      token: 'test-speaker-token'
    }, 'speaker')
    testResults.push({ 
      test: 'Contract Email (Speaker)', 
      status: contractSpeakerResult ? 'PASS' : 'FAIL',
      details: 'Contract signing request to speaker'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Contract Email (Speaker)', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 7: Contract Completed Email
  try {
    const contractCompletedResult = await emailService.sendContractCompletedEmail({
      id: 1,
      contract_number: 'SPKAI-2025-001',
      client_name: 'Tech Corp',
      client_email: 'legal@techcorp.com',
      client_company: 'Tech Corp Inc',
      client_signer_name: 'John Legal',
      client_signer_email: 'john@techcorp.com',
      client_signer_title: 'Legal Director',
      client_signed_at: new Date(),
      client_signature: 'signature_data',
      speaker_id: 1,
      speaker_name: 'AI Speaker',
      speaker_email: 'speaker@example.com',
      speaker_signed_at: new Date(),
      speaker_signature: 'signature_data',
      event_title: 'Annual Tech Summit',
      event_date: new Date('2025-10-01'),
      event_location: 'Silicon Valley',
      event_description: 'Keynote on AI',
      speaker_fee: 75000,
      travel_stipend: 5000,
      total_amount: 80000,
      payment_terms: 'Net 30',
      terms: 'Standard terms',
      status: 'completed',
      project_id: 1,
      created_by: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
      completed_at: new Date(),
      client_signing_token: 'token1',
      speaker_signing_token: 'token2',
      tokens_expire_at: new Date()
    })
    testResults.push({ 
      test: 'Contract Completed Email', 
      status: contractCompletedResult ? 'PASS' : 'FAIL',
      details: 'Completion notifications to all parties'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Contract Completed Email', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 8: Client Portal Invitation
  try {
    const portalResult = await emailService.sendClientPortalInvite({
      token: 'test-portal-token',
      clientName: 'Portal User',
      email: 'portal@example.com'
    })
    testResults.push({ 
      test: 'Client Portal Invitation', 
      status: portalResult ? 'PASS' : 'FAIL',
      details: 'Portal access invitation'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Client Portal Invitation', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 9: Password Reset Email
  try {
    const passwordResetResult = await emailService.sendPasswordResetEmail(
      'user@example.com',
      'test-reset-token-123'
    )
    testResults.push({ 
      test: 'Password Reset Email', 
      status: passwordResetResult ? 'PASS' : 'FAIL',
      details: 'Password reset link'
    })
  } catch (error) {
    testResults.push({ 
      test: 'Password Reset Email', 
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Calculate summary
  const summary = {
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'PASS').length,
    failed: testResults.filter(r => r.status === 'FAIL').length,
    errors: testResults.filter(r => r.status === 'ERROR').length
  }

  // Reset test mode
  delete process.env.EMAIL_TEST_MODE

  return NextResponse.json({
    success: true,
    message: 'Email endpoint tests completed (TEST MODE - no emails sent)',
    summary,
    results: testResults,
    note: 'All tests run in test mode. No actual emails were sent. Install and configure Resend to enable actual email sending.'
  })
}