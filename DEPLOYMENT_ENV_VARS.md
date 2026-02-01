# Production Environment Variables Setup

**Status: Environment variables have been configured in production**

## Required Banking Information Variables

To display banking information on invoices in production, you need to set the following environment variables in your deployment platform (e.g., Vercel):

### Banking Environment Variables

```bash
# Entity/Company Information
ENTITY_NAME="Your Business Name LLC"
ENTITY_ADDRESS="123 Business Street, City, State ZIP, Country"

# Banking Information
BANK_NAME="Your Bank Name"
BANK_ADDRESS="123 Bank Street, City, State ZIP"
ACCOUNT_NUMBER="123456789"  # Will be automatically masked as ****6789 on invoices
ROUTING_NUMBER="987654321"  # Will be automatically masked as ****4321 on invoices
SWIFT_CODE="YOURSWIFT"
CURRENCY_TYPE="USD"  # or EUR, GBP, etc.

# Optional Payment Instructions
BANK_WIRE_INSTRUCTIONS="For international wires, please use SWIFT code. Reference invoice number."
BANK_ACH_INSTRUCTIONS="For ACH transfers, use routing and account numbers above."

# Invoice Payment Terms (optional)
INVOICE_DEPOSIT_TERMS="Net 30 days from issue date"
INVOICE_FINAL_TERMS="Due on event date"
```

## Setting Up in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each variable listed above with your actual values
5. Make sure to select "Production" (and optionally "Preview" and "Development")
6. Save the changes
7. Redeploy your application for the changes to take effect

## Security Notes

- Account and routing numbers are automatically masked on invoices (showing only last 4 digits)
- Never commit actual banking information to your repository
- Use the `.env.local` file for local development only
- Keep production environment variables secure in your deployment platform

## Testing

After setting up the environment variables and redeploying:
1. Go to Admin → Invoicing
2. Create or view an invoice
3. The Payment Information section should now display with your banking details

## Fallback to Database

If environment variables are not set, the system will attempt to fetch banking configuration from the database using the Banking Settings admin interface.