# Banking Information Setup Guide

## Security Best Practices

Banking information should NEVER be committed to your repository. Follow these steps to securely configure banking details for invoices:

## 1. Local Development

Create a `.env.local` file (this file is gitignored) with your banking information:

```bash
# Banking Information
BANK_NAME="Your Bank Name"
BANK_ACCOUNT_NAME="Speak About AI LLC"
BANK_ACCOUNT_NUMBER="xxxxxxxxxxxx"
BANK_ROUTING_NUMBER="xxxxxxxxx"
BANK_SWIFT_CODE="XXXXXXXX"
BANK_ADDRESS="123 Bank Street, City, State, ZIP"
BANK_WIRE_INSTRUCTIONS="For international wires, use SWIFT code. Reference invoice number."

# Invoice Settings
INVOICE_DEPOSIT_PERCENTAGE="50"
INVOICE_DEPOSIT_TERMS="Net 30"
INVOICE_FINAL_TERMS="Due on event date"
```

## 2. Production (Vercel)

1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each banking variable as a production environment variable
5. Keep the values encrypted and secure

### Required Environment Variables:

- `BANK_NAME` - Your bank's name
- `BANK_ACCOUNT_NAME` - Account holder name (e.g., "Speak About AI LLC")
- `BANK_ACCOUNT_NUMBER` - Your account number
- `BANK_ROUTING_NUMBER` - ACH routing number for US banks
- `BANK_SWIFT_CODE` - For international transfers
- `BANK_ADDRESS` - Bank's physical address
- `BANK_WIRE_INSTRUCTIONS` - Additional wire transfer instructions

### Invoice Configuration:

- `INVOICE_DEPOSIT_PERCENTAGE` - Percentage for deposit invoice (default: 50)
- `INVOICE_DEPOSIT_TERMS` - Payment terms for deposit (default: "Net 30")
- `INVOICE_FINAL_TERMS` - Payment terms for final payment (default: "Due on event date")

## 3. Security Considerations

- **Never commit** banking information to Git
- Use Vercel's encrypted environment variables in production
- Limit access to production environment variables to authorized personnel only
- Consider using a separate business bank account for invoice payments
- Enable 2FA on your Vercel account
- Regularly audit who has access to your Vercel project

## 4. Testing

To test without real banking information, you can use placeholder values:

```bash
BANK_NAME="Test Bank"
BANK_ACCOUNT_NAME="Test Account"
BANK_ACCOUNT_NUMBER="XXXXXXXXXXXX"
BANK_ROUTING_NUMBER="XXXXXXXXX"
```

## 5. Invoice Features

The system now supports:

1. **Dual Invoice Generation**: Automatically creates both deposit (50%) and final payment (50%) invoices
2. **Contract Deliverables**: Invoices include detailed deliverables from the contract
3. **Speaker Information**: Shows speaker name and presentation details
4. **Banking Information**: Securely displays banking details on invoices
5. **Status Tracking**: Track payment status for each invoice independently

## 6. Usage

### Generate Invoice Pair

```javascript
// POST /api/invoices/generate-pair
{
  "projectId": 123
}
```

This creates:
- Deposit invoice (50% of total, Net 30 terms)
- Final payment invoice (50% of total, due on event date)

### Update Invoice Status

```javascript
// PATCH /api/invoices/{id}
{
  "status": "paid",
  "payment_date": "2025-08-12T10:00:00Z"
}
```

## 7. Compliance

Ensure your banking setup complies with:
- PCI DSS standards (if processing cards)
- SOC 2 requirements
- Your local financial regulations
- Anti-money laundering (AML) requirements

## Need Help?

Contact your system administrator or refer to Vercel's documentation on environment variables: https://vercel.com/docs/environment-variables