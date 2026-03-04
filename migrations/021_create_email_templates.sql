-- Add approved and rejected speaker application email templates

-- Insert default approved application template
INSERT INTO email_templates (template_key, subject, body_html) VALUES
(
  'application_approved',
  'Congratulations! Your Application to Speak About AI Has Been Approved',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear {{first_name}} {{last_name}},</h2>
    <p style="color: #4b5563; font-size: 16px;">
      Congratulations! Your application to join Speak About AI has been approved.
    </p>
    <p style="color: #4b5563; font-size: 16px;">
      We are excited to welcome you to our exclusive network of AI and technology thought leaders. Your expertise and experience stood out among our applicants.
    </p>
    <p style="color: #4b5563; font-size: 16px;">
      Please click the button below to create your speaker account and set up your profile:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invite_url}}" style="display: inline-block; background: #1E68C6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Create Your Account
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #3b82f6; font-size: 14px; word-break: break-all; text-align: center;">
      {{invite_url}}
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong>Important:</strong> This invitation link will expire in 7 days.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">
      If you have any questions, please don''t hesitate to reach out to us at
      <a href="mailto:hello@speakabout.ai" style="color: #1E68C6;">hello@speakabout.ai</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
      Best regards,<br>
      <strong>The Speak About AI Team</strong>
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">&copy; 2026 Speak About AI. All rights reserved.</p>
  </div>
</body>
</html>'
) ON CONFLICT (template_key) DO NOTHING;

-- Insert default rejected application template
INSERT INTO email_templates (template_key, subject, body_html) VALUES
(
  'application_rejected',
  'Update on Your Speak About AI Application',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear {{first_name}} {{last_name}},</h2>
    <p style="color: #4b5563; font-size: 16px;">
      Thank you for your interest in joining Speak About AI and for taking the time to submit your application.
    </p>
    <p style="color: #4b5563; font-size: 16px;">
      After careful review, we regret to inform you that we are unable to accept your application at this time.
    </p>
    {{rejection_reason_block}}
    <p style="color: #4b5563; font-size: 16px;">
      We encourage you to continue developing your speaking career and welcome you to reapply in the future as your experience grows.
    </p>
    <p style="color: #4b5563; font-size: 16px;">
      We wish you the very best in your professional endeavors.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">
      If you have any questions, please feel free to reach out to us at
      <a href="mailto:hello@speakabout.ai" style="color: #1E68C6;">hello@speakabout.ai</a>
    </p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
      Best regards,<br>
      <strong>The Speak About AI Team</strong>
    </p>
  </div>
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">&copy; 2026 Speak About AI. All rights reserved.</p>
  </div>
</body>
</html>'
) ON CONFLICT (template_key) DO NOTHING;
