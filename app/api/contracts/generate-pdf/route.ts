import { NextRequest, NextResponse } from 'next/server'
import { generateContractHTML } from '@/lib/contract-generator'

export async function POST(request: NextRequest) {
  try {
    const contractData = await request.json()
    
    // Generate the HTML with enhanced print styling
    const html = generateContractHTML(contractData)
    
    // Add additional print-optimized wrapper
    const printOptimizedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract - ${contractData.eventReference || 'Document'}</title>
  <style>
    /* Enhanced print styles */
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    /* Instructions overlay for HTML download */
    .pdf-instructions {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0066cc;
      color: white;
      padding: 15px;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .pdf-instructions button {
      background: white;
      color: #0066cc;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      margin-left: 15px;
    }
    
    .pdf-instructions button:hover {
      background: #f0f0f0;
    }
    
    @media print {
      .pdf-instructions {
        display: none;
      }
    }
  </style>
  <script>
    // Auto-trigger print dialog when page loads
    window.addEventListener('load', function() {
      // Give user time to see the instructions
      setTimeout(function() {
        window.print();
      }, 1000);
    });
    
    function printContract() {
      window.print();
    }
    
    function hideInstructions() {
      document.querySelector('.pdf-instructions').style.display = 'none';
    }
  </script>
</head>
<body>
  <div class="pdf-instructions">
    📄 To save as PDF: Click "Print" below, then choose "Save as PDF" in the print dialog
    <button onclick="printContract()">Print / Save as PDF</button>
    <button onclick="hideInstructions()">Hide Instructions</button>
  </div>
  ${html.replace('</head>', '').replace('<head>', '').replace('</body>', '').replace('<body>', '').replace('<!DOCTYPE html>', '').replace('<html lang="en">', '').replace('</html>', '')}
</body>
</html>
    `.trim()
    
    // Return HTML with proper headers
    return new NextResponse(printOptimizedHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${contractData.eventReference || 'contract'}.html"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('Error generating contract PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate contract PDF' },
      { status: 500 }
    )
  }
}