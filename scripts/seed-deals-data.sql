-- Insert sample deals data for testing
INSERT INTO deals (
    client_name, client_email, client_phone, company,
    event_title, event_date, event_location, event_type,
    speaker_requested, attendee_count, budget_range, deal_value,
    status, priority, source, notes, last_contact, next_follow_up
) VALUES 
(
    'Sarah Johnson', 'sarah.johnson@techcorp.com', '+1-555-0123', 'TechCorp Industries',
    'Annual Technology Summit 2024', '2024-06-15', 'San Francisco, CA', 'Corporate Conference',
    'Peter Norvig', 500, '$50,000-$75,000', 65000.00,
    'proposal', 'high', 'Website Contact Form',
    'Interested in AI keynote speaker for their annual summit. Budget confirmed.',
    '2024-01-15', '2024-01-22'
),
(
    'Michael Chen', 'mchen@healthplus.org', '+1-555-0456', 'HealthPlus Medical',
    'Healthcare Innovation Conference', '2024-05-20', 'Boston, MA', 'Medical Conference',
    'Dr. Shafi Ahmed', 300, '$25,000-$50,000', 35000.00,
    'negotiation', 'urgent', 'Referral',
    'Looking for healthcare AI expert. Price negotiation in progress.',
    '2024-01-18', '2024-01-25'
),
(
    'Emily Rodriguez', 'emily.r@financeworld.com', '+1-555-0789', 'Finance World LLC',
    'Future of Finance Conference', '2024-07-10', 'New York, NY', 'Panel Discussion',
    'Cassie Kozyrkov', 300, '$30,000-$75,000', 50000.00,
    'qualified', 'high', 'Referral',
    'Panel discussion on AI in financial services. Multiple speakers needed.',
    '2024-01-12', '2024-01-20'
),
(
    'David Kim', 'dkim@autotech.com', '+1-555-0321', 'AutoTech Solutions',
    'Automotive AI Symposium', '2024-08-05', 'Detroit, MI', 'Keynote',
    'Adam Cheyer', 400, '$40,000-$80,000', 60000.00,
    'lead', 'medium', 'Cold Email',
    'Initial inquiry about AI in automotive industry keynote speaker.',
    '2024-01-08', '2024-01-16'
),
(
    'Lisa Thompson', 'lisa@retailinnovate.com', '+1-555-0654', 'Retail Innovate',
    'Retail Technology Expo', '2024-09-12', 'Las Vegas, NV', 'Fireside Chat',
    'Allie K. Miller', 250, '$25,000-$50,000', 40000.00,
    'won', 'low', 'Trade Show',
    'Confirmed booking for retail AI fireside chat. Contract signed.',
    '2024-01-05', NULL
),
(
    'Robert Wilson', 'rwilson@edutech.edu', '+1-555-0987', 'EduTech University',
    'Education AI Summit', '2024-04-18', 'Chicago, IL', 'Workshop',
    'Sharon Zhou', 200, '$15,000-$30,000', 25000.00,
    'lost', 'low', 'University Network',
    'Budget constraints led to cancellation. Keep for future opportunities.',
    '2024-01-03', NULL
),
(
    'Amanda Foster', 'afoster@globalcorp.com', '+1-555-0147', 'Global Corp International',
    'Leadership in AI Era', '2024-10-22', 'London, UK', 'Keynote',
    'Charlene Li', 600, '$75,000-$150,000', 100000.00,
    'proposal', 'urgent', 'Executive Referral',
    'High-profile international event. CEO specifically requested Charlene Li.',
    '2024-01-14', '2024-01-21'
),
(
    'James Martinez', 'jmartinez@startupaccel.com', '+1-555-0258', 'Startup Accelerator',
    'AI for Startups Bootcamp', '2024-03-30', 'Austin, TX', 'Workshop',
    'Maya Ackerman', 100, '$10,000-$25,000', 18000.00,
    'qualified', 'medium', 'Startup Network',
    'Bootcamp for early-stage AI startups. Looking for practical AI guidance.',
    '2024-01-11', '2024-01-19'
),
(
    'David Park', 'dpark@manufacturing.co', '+1-555-0321',
    'Advanced Manufacturing Co', 'Industry 4.0 Summit',
    '2024-08-05', 'Detroit, MI', 'Industry Conference',
    'Tatyana Mamut', 200, '$25,000-$50,000', 40000.00,
    'lead', 'medium', 'Cold Email',
    'Initial inquiry about AI in manufacturing. Need to qualify budget.',
    '2024-01-22', '2024-01-29'
),
(
    'Lisa Thompson', 'lisa@retailsummit.org', '+1-555-0654',
    'National Retail Summit', 'Retail Innovation 2024',
    '2024-09-12', 'Chicago, IL', 'Retail Conference',
    'Allie K. Miller', 400, '$50,000-$75,000', 55000.00,
    'won', 'high', 'Past Client',
    'Contract signed! Payment terms: 50% upfront, 50% on event day.',
    '2024-01-10', NULL
),
(
    'Robert Kim', 'rkim@financeforum.com', '+1-555-0987',
    'Global Finance Forum', 'FinTech Future Conference',
    '2024-04-18', 'New York, NY', 'Financial Conference',
    'Cassie Kozyrkov', 600, '$75,000+', 90000.00,
    'lost', 'medium', 'Industry Contact',
    'Lost to competitor. Budget was approved but they chose different speaker.',
    '2024-01-05', NULL
),
(
    'Amanda White', 'awhite@edutech.edu', '+1-555-0147',
    'EduTech University', 'Future of Learning Symposium',
    '2024-10-22', 'Seattle, WA', 'Educational Event',
    'Sharon Zhou', 250, '$25,000-$50,000', 30000.00,
    'proposal', 'medium', 'University Network',
    'Academic event focused on AI in education. Proposal submitted.',
    '2024-01-25', '2024-02-01'
),
(
    'James Wilson', 'jwilson@autoshow.com', '+1-555-0258',
    'International Auto Show', 'Automotive AI Expo 2024',
    '2024-11-08', 'Los Angeles, CA', 'Trade Show',
    'Christopher Ategeka', 1000, '$75,000+', 100000.00,
    'qualified', 'urgent', 'Trade Publication',
    'Large automotive event. Multiple speaking opportunities available.',
    '2024-01-28', '2024-02-05'
),
(
    'Sarah Johnson', 'sarah@techcorp.com', '+1-555-0123', 'TechCorp Inc',
    'AI Innovation Summit 2024', '2024-09-15', 'San Francisco, CA', 'Corporate Conference',
    'Adam Cheyer (Siri Co-Founder)', 500, '$50,000 - $75,000', 65000.00,
    'proposal', 'high', 'Website Contact Form', 
    'Large corporate event, very interested in AI keynote speakers. Budget confirmed.',
    '2024-01-18', '2024-01-22'
),
(
    'Michael Chen', 'm.chen@startup.io', '+1-555-0456', 'InnovateTech Startup',
    'Startup Tech Conference', '2024-08-20', 'Austin, TX', 'Tech Conference',
    'Machine Learning Expert', 200, '$15,000 - $25,000', 20000.00,
    'negotiation', 'medium', 'LinkedIn Outreach',
    'Startup looking for affordable ML speaker. Flexible on dates.',
    '2024-01-19', '2024-01-25'
),
(
    'Jennifer Williams', 'jwilliams@university.edu', '+1-555-0789', 'Stanford University',
    'AI Ethics Symposium', '2024-10-05', 'Palo Alto, CA', 'Academic Conference',
    'AI Ethics Expert', 150, '$10,000 - $20,000', 15000.00,
    'qualified', 'medium', 'Referral',
    'Academic event focused on AI ethics and responsible AI development.',
    '2024-01-16', '2024-01-23'
),
(
    'David Rodriguez', 'david.r@healthtech.com', '+1-555-0321', 'HealthTech Solutions',
    'Healthcare AI Summit', '2024-11-12', 'Boston, MA', 'Healthcare Conference',
    'Healthcare AI Specialist', 300, '$30,000 - $45,000', 38000.00,
    'lead', 'high', 'Website Contact Form',
    'Healthcare company interested in AI applications in medicine.',
    '2024-01-20', '2024-01-24'
),
(
    'Lisa Park', 'lisa.park@retailcorp.com', '+1-555-0654', 'RetailCorp',
    'Retail Innovation Day', '2024-07-30', 'Chicago, IL', 'Corporate Workshop',
    'Retail AI Expert', 100, '$20,000 - $30,000', 25000.00,
    'won', 'medium', 'Cold Email',
    'Successfully closed deal for retail AI workshop. Payment confirmed.',
    '2024-01-15', NULL
),
(
    'Robert Kim', 'robert@financeplus.com', '+1-555-0987', 'FinancePlus',
    'Financial AI Conference', '2024-12-08', 'New York, NY', 'Financial Conference',
    'FinTech AI Speaker', 400, '$40,000 - $60,000', 52000.00,
    'proposal', 'urgent', 'Industry Referral',
    'Large financial services company. Decision needed by end of month.',
    '2024-01-21', '2024-01-26'
),
(
    'Amanda Foster', 'amanda@edutech.org', '+1-555-0147', 'EduTech Foundation',
    'Education Technology Summit', '2024-06-18', 'Seattle, WA', 'Education Conference',
    'EdTech AI Specialist', 250, '$18,000 - $28,000', 22000.00,
    'qualified', 'low', 'Conference Networking',
    'Non-profit education organization. Budget approval in progress.',
    '2024-01-17', '2024-01-28'
),
(
    'James Wilson', 'james.wilson@autotech.com', '+1-555-0258', 'AutoTech Industries',
    'Automotive AI Expo', '2024-09-25', 'Detroit, MI', 'Industry Expo',
    'Automotive AI Expert', 600, '$60,000 - $80,000', 70000.00,
    'lost', 'high', 'Trade Show',
    'Lost to competitor. Price was too high for their budget.',
    '2024-01-14', NULL
);
