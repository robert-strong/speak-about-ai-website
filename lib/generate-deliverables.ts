// Generate smart deliverables based on project details
export function generateDeliverablesFromProject(project: any): string[] {
  const deliverables: string[] = []
  
  // 1. Pre-event consultation (always included)
  deliverables.push("Pre-event consultation call (30 minutes)")
  
  // 2. Main presentation based on program type and length
  if (project.program_type && project.program_length) {
    deliverables.push(`${project.program_length}-minute ${project.program_type.toLowerCase()}`)
  } else if (project.event_type === "Workshop") {
    deliverables.push("Workshop facilitation (duration as specified)")
  } else if (project.event_type === "Panel") {
    deliverables.push("Panel participation")
  } else {
    deliverables.push("Keynote presentation (60 minutes)")
  }
  
  // 3. Q&A if specified
  if (project.qa_length && project.qa_length > 0) {
    deliverables.push(`${project.qa_length}-minute Q&A session`)
  }
  
  // 4. Check for additional deliverables in notes/description
  if (project.notes || project.description) {
    const text = (project.notes + ' ' + project.description).toLowerCase()
    
    // Social media
    if (text.includes('social media') || text.includes('linkedin') || text.includes('twitter')) {
      deliverables.push("Social media post about the event")
    }
    
    // Blog post
    if (text.includes('blog') || text.includes('article')) {
      deliverables.push("Blog post or article contribution")
    }
    
    // Video testimonial
    if (text.includes('testimonial') || text.includes('endorsement')) {
      deliverables.push("Video testimonial")
    }
    
    // Book signing
    if (text.includes('book signing') || text.includes('autograph')) {
      deliverables.push("Book signing session")
    }
    
    // Meet and greet
    if (text.includes('meet and greet') || text.includes('vip reception')) {
      deliverables.push("VIP meet and greet")
    }
    
    // Breakout sessions
    if (text.includes('breakout') || text.includes('roundtable')) {
      deliverables.push("Breakout session participation")
    }
    
    // Press/Media
    if (text.includes('press') || text.includes('media interview')) {
      deliverables.push("Media interview")
    }
  }
  
  // 5. Technical rehearsal if specified
  if (project.tech_rehearsal_date || project.tech_rehearsal_time) {
    deliverables.push("Technical rehearsal")
  }
  
  // 6. Recording permission if explicitly allowed
  if (project.recording_allowed) {
    deliverables.push("Recording permission")
  }
  
  // 7. Presentation materials
  deliverables.push("Presentation slides (PDF)")
  
  return deliverables
}

// Generate deliverables description for display
export function formatDeliverablesForDisplay(deliverables: string[]): string {
  return deliverables.map((item, index) => `${index + 1}. ${item}`).join('\n')
}

// Generate deliverables for storage (newline-separated)
export function formatDeliverablesForStorage(deliverables: string[]): string {
  return deliverables.join('\n')
}