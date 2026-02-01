import { NextResponse } from "next/server"
import { getProposalById } from "@/lib/proposals-db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { jsPDF } from "jspdf"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = parseInt(params.id)
    const proposal = await getProposalById(proposalId)
    
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    // Create PDF using jsPDF
    const doc = new jsPDF()
    let yPosition = 20

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number = 170) => {
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return y + (lines.length * 7)
    }

    // Title and Header
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    yPosition = addText("SPEAK ABOUT AI", 105, yPosition, 170)
    
    doc.setFontSize(16)
    doc.setFont("helvetica", "normal")
    yPosition = addText(proposal.title || "Speaking Engagement Proposal", 105, yPosition + 10, 170)
    
    // Proposal details
    doc.setFontSize(10)
    doc.setTextColor(100)
    yPosition = addText(`Proposal #${proposal.proposal_number}`, 20, yPosition + 10)
    yPosition = addText(`Date: ${formatDate(proposal.created_at)}`, 20, yPosition)
    if (proposal.valid_until) {
      yPosition = addText(`Valid Until: ${formatDate(proposal.valid_until)}`, 20, yPosition)
    }
    doc.setTextColor(0)

    // Client Information
    yPosition += 10
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    yPosition = addText("Prepared For:", 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    yPosition = addText(proposal.client_name, 20, yPosition)
    if (proposal.client_title) {
      yPosition = addText(proposal.client_title, 20, yPosition)
    }
    if (proposal.client_company) {
      yPosition = addText(proposal.client_company, 20, yPosition)
    }
    yPosition = addText(proposal.client_email, 20, yPosition)

    // Executive Summary
    if (proposal.executive_summary) {
      yPosition += 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      yPosition = addText("Executive Summary", 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      yPosition = addText(proposal.executive_summary, 20, yPosition + 5)
    }

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    // Event Details
    yPosition += 15
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    yPosition = addText("Event Details", 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    
    if (proposal.event_title) {
      yPosition = addText(`Event: ${proposal.event_title}`, 20, yPosition + 5)
    }
    if (proposal.event_date) {
      yPosition = addText(`Date: ${formatDate(proposal.event_date)}`, 20, yPosition)
    }
    if (proposal.event_location) {
      yPosition = addText(`Location: ${proposal.event_location}`, 20, yPosition)
    }
    if (proposal.event_format) {
      yPosition = addText(`Format: ${proposal.event_format.charAt(0).toUpperCase() + proposal.event_format.slice(1)}`, 20, yPosition)
    }
    if (proposal.attendee_count) {
      yPosition = addText(`Expected Attendees: ${proposal.attendee_count}`, 20, yPosition)
    }

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    // Speakers
    if (proposal.speakers && proposal.speakers.length > 0) {
      yPosition += 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      yPosition = addText("Speaker(s)", 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      
      proposal.speakers.forEach((speaker) => {
        yPosition += 5
        doc.setFont("helvetica", "bold")
        yPosition = addText(speaker.name, 20, yPosition)
        doc.setFont("helvetica", "normal")
        if (speaker.title) {
          yPosition = addText(speaker.title, 20, yPosition)
        }
        if (speaker.bio) {
          yPosition = addText(speaker.bio, 20, yPosition)
        }
        yPosition += 5
      })
    }

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    // Services
    if (proposal.services && proposal.services.length > 0) {
      yPosition += 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      yPosition = addText("Services Included", 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      
      proposal.services.filter(s => s.included).forEach((service) => {
        yPosition += 5
        yPosition = addText(`• ${service.name}`, 25, yPosition)
        if (service.description) {
          doc.setFontSize(10)
          yPosition = addText(service.description, 30, yPosition, 160)
          doc.setFontSize(11)
        }
      })
    }

    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage()
      yPosition = 20
    }

    // Investment
    yPosition += 15
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    yPosition = addText("Investment", 20, yPosition)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    
    // Draw investment box
    doc.setDrawColor(200)
    doc.rect(20, yPosition + 5, 170, 20)
    doc.setFont("helvetica", "bold")
    yPosition = addText(`Total Investment: ${formatCurrency(proposal.total_investment)}`, 25, yPosition + 15)
    doc.setFont("helvetica", "normal")
    
    yPosition += 25

    // Payment Terms
    if (proposal.payment_terms) {
      doc.setFontSize(11)
      yPosition = addText("Payment Terms:", 20, yPosition)
      yPosition = addText(proposal.payment_terms, 20, yPosition)
    }

    // Payment Schedule
    if (proposal.payment_schedule && proposal.payment_schedule.length > 0) {
      yPosition += 10
      yPosition = addText("Payment Schedule:", 20, yPosition)
      proposal.payment_schedule.forEach((milestone) => {
        yPosition += 5
        const amount = formatCurrency(milestone.amount)
        yPosition = addText(`• ${milestone.description}: ${amount} - ${milestone.due_date}`, 25, yPosition)
      })
    }

    // Terms & Conditions (if fits)
    if (proposal.terms_conditions && yPosition < 200) {
      yPosition += 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      yPosition = addText("Terms & Conditions", 20, yPosition)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      yPosition = addText(proposal.terms_conditions, 20, yPosition + 5)
    }

    // Footer on last page
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("This proposal is confidential and proprietary.", 105, 280, { align: "center" })
    doc.text(`© ${new Date().getFullYear()} Speak About AI. All rights reserved.`, 105, 285, { align: "center" })

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposal-${proposal.proposal_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating proposal PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}