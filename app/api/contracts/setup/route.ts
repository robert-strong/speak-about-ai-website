import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Drop existing tables to start fresh
    await sql`DROP TABLE IF EXISTS contract_signatures CASCADE`
    await sql`DROP TABLE IF EXISTS contract_templates CASCADE`
    await sql`DROP TABLE IF EXISTS contracts CASCADE`
    
    // Create contracts table
    await sql`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        
        -- Parties involved
        client_name VARCHAR(255),
        client_company VARCHAR(255),
        client_email VARCHAR(255),
        speaker_name VARCHAR(255),
        speaker_email VARCHAR(255),
        
        -- Event details
        event_title VARCHAR(255),
        event_date DATE,
        event_location VARCHAR(255),
        event_type VARCHAR(50),
        
        -- Financial
        fee_amount DECIMAL(10, 2),
        payment_terms VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'USD',
        
        -- Content
        description TEXT,
        terms TEXT,
        special_requirements TEXT,
        template_settings JSONB,
        
        -- Metadata
        deal_id INTEGER,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP,
        signed_at TIMESTAMP,
        expires_at TIMESTAMP
      )
    `
    
    // Create contract templates table
    await sql`
      CREATE TABLE IF NOT EXISTS contract_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        template_content TEXT NOT NULL,
        variables JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Create contract signatures table
    await sql`
      CREATE TABLE IF NOT EXISTS contract_signatures (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
        signer_name VARCHAR(255) NOT NULL,
        signer_email VARCHAR(255) NOT NULL,
        signer_role VARCHAR(50) NOT NULL,
        signature_data TEXT,
        signed_at TIMESTAMP,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Insert default templates
    await sql`
      INSERT INTO contract_templates (name, type, description, template_content, variables)
      VALUES 
        ('Speaker Agreement', 'speaker', 'Standard speaker agreement template', 
         'This Speaker Agreement is entered into between {client_company} and {speaker_name} for the event {event_title} on {event_date}.',
         '{"client_company": "string", "speaker_name": "string", "event_title": "string", "event_date": "date"}'::jsonb),
        ('Workshop Contract', 'workshop', 'Workshop delivery contract template',
         'This Workshop Agreement outlines the terms for {speaker_name} to deliver a workshop on {event_title}.',
         '{"speaker_name": "string", "event_title": "string"}'::jsonb),
        ('Consulting Agreement', 'consulting', 'Consulting services contract',
         'This Consulting Agreement is for professional services provided by {speaker_name} to {client_company}.',
         '{"speaker_name": "string", "client_company": "string"}'::jsonb)
      ON CONFLICT DO NOTHING
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contract tables created successfully' 
    })
    
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}