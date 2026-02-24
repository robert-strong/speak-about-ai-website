-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(500),
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  must_change_password BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create smtp_config table (single row)
CREATE TABLE IF NOT EXISTS smtp_config (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) DEFAULT 'gmail',
  host VARCHAR(255) DEFAULT 'smtp.gmail.com',
  port INTEGER DEFAULT 587,
  username VARCHAR(255),
  password VARCHAR(500),
  from_name VARCHAR(255),
  from_email VARCHAR(255),
  use_tls BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_key VARCHAR(100) NOT NULL UNIQUE,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default welcome email template
INSERT INTO email_templates (template_key, subject, body_html) VALUES (
  'welcome_team_member',
  'Welcome to the {{company_name}} Team!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 0; background: #f0f2f5; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 30px; }
    .body h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #4a5568; margin: 0 0 16px; }
    .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credentials .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .credentials .row:last-child { border-bottom: none; }
    .credentials .label { font-weight: 600; color: #2d3748; font-size: 14px; }
    .credentials .value { color: #2563eb; font-family: monospace; font-size: 14px; }
    .role-badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .warning { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .footer { background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 13px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{company_name}}</h1>
      <p>Your team account has been created</p>
    </div>
    <div class="body">
      <h2>Hi {{name}},</h2>
      <p>You have been added to the {{company_name}} admin dashboard. Below are your login credentials.</p>

      <div class="credentials">
        <div class="row">
          <span class="label">Login URL</span>
          <span class="value">{{login_url}}</span>
        </div>
        <div class="row">
          <span class="label">Email</span>
          <span class="value">{{email}}</span>
        </div>
        <div class="row">
          <span class="label">Temporary Password</span>
          <span class="value">{{temporary_password}}</span>
        </div>
        <div class="row">
          <span class="label">Your Role</span>
          <span><span class="role-badge">{{role}}</span></span>
        </div>
      </div>

      <div class="warning">
        <strong>Important:</strong> Please change your password after your first login for security purposes.
      </div>

      <div style="text-align: center;">
        <a href="{{login_url}}" class="btn">Log In Now</a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from {{company_name}}. If you did not expect this, please contact your administrator.</p>
    </div>
  </div>
</body>
</html>'
) ON CONFLICT (template_key) DO NOTHING;
