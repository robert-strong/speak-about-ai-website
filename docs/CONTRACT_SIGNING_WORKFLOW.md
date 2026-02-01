# Contract Signing Workflow Implementation Plan

## Overview
This document outlines the implementation plan for contract signing functionality across speaker and client portals.

## Workflow Design

### 1. Contract Creation (Admin)
- Admin creates contract from won deal
- Specifies speaker and client signer information
- Previews and confirms contract

### 2. Contract Sending
When admin clicks "Create & Send Contract":

#### For Speakers:
- Contract record created with `speaker_signing_token`
- Email sent to speaker with:
  - Contract summary
  - Link to speaker portal: `/speaker/contracts/{contract_id}?token={speaker_signing_token}`
  - "Review and Sign Contract" CTA button
- Contract appears in speaker portal dashboard

#### For Clients:
- Contract record created with `client_signing_token`
- Email sent to specified signer with:
  - Contract summary
  - Direct signing link: `/sign/contract/{contract_id}?token={client_signing_token}`
  - No login required, just email verification
- If signer ≠ POC, CC email sent to POC

### 3. Signing Process

#### Speaker Portal Signing:
1. Speaker logs into portal
2. Views contract in their dashboard
3. Clicks "Sign Contract"
4. Reviews full contract
5. Types name for digital signature
6. Confirms and submits
7. Receives confirmation email with PDF

#### Client Direct Link Signing:
1. Client clicks email link
2. Verifies email address
3. Reviews full contract
4. Types name and title for digital signature
5. Confirms and submits
6. Receives confirmation email with PDF
7. POC receives notification if different person

### 4. Contract Status Updates
- Draft → Sent (when emails sent)
- Sent → Speaker Signed (when speaker signs)
- Speaker Signed → Fully Executed (when client signs)
- OR: Sent → Client Signed → Fully Executed

### 5. Post-Signature
- Both parties receive fully executed PDF
- Contract locked from further changes
- Copy stored in both portals
- Admin notified of completion

## Database Schema Updates

### contracts table additions:
```sql
ALTER TABLE contracts ADD COLUMN client_signer_email VARCHAR(255);
ALTER TABLE contracts ADD COLUMN client_signer_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN speaker_signing_token VARCHAR(255) UNIQUE;
ALTER TABLE contracts ADD COLUMN client_signing_token VARCHAR(255) UNIQUE;
```

### contract_signatures table (already exists):
- Records each signature with timestamp, IP, etc.
- Links to contract via contract_id

## Security Considerations

### Token Security:
- Unique, cryptographically secure tokens
- Expire after 30 days
- One-time use for signing
- Different tokens for speaker vs client

### Email Verification:
- Client must verify email matches signer email
- Rate limiting on verification attempts
- Audit trail of all actions

## Implementation Steps

1. **Update Contract Creation API**
   - Add signer email/name fields
   - Generate signing tokens
   - Create signature records

2. **Create Email Templates**
   - Speaker contract notification
   - Client signing request
   - POC CC notification
   - Signature confirmation

3. **Build Signing Pages**
   - `/speaker/contracts/[id]` - Speaker portal view
   - `/sign/contract/[id]` - Public signing page
   - Signature pad component
   - PDF generation after signing

4. **Update Portal Dashboards**
   - Speaker: Show pending contracts
   - Client: Show contracts (view-only)
   - Status badges and notifications

5. **Add API Endpoints**
   - GET `/api/contracts/[id]/signing` - Get contract for signing
   - POST `/api/contracts/[id]/sign` - Submit signature
   - GET `/api/contracts/[id]/pdf` - Download PDF

## Benefits of This Approach

1. **Flexibility**: Clients can have anyone sign without portal access
2. **Security**: Unique tokens prevent unauthorized access
3. **Tracking**: Full audit trail of who signed when
4. **Convenience**: No login required for client signers
5. **Visibility**: POCs stay informed even if not signing

## Next Steps

1. Implement database schema updates
2. Create signing token generation utilities
3. Build email service for notifications
4. Create signing UI components
5. Test end-to-end workflow