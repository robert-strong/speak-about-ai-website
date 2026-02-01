// Email module for backward compatibility
// This module redirects to the unified email service

import { sendEmail as sendUnifiedEmail } from './email-service-unified'

// Export sendEmail function for backward compatibility
export const sendEmail = sendUnifiedEmail

// Re-export everything from the unified service
export * from './email-service-unified'