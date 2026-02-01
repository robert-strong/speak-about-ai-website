// Analytics tracking utility
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void
    }
  }
}

export const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
  // Only track if umami is available and user is not admin
  if (typeof window !== 'undefined' && window.umami && localStorage.getItem('adminLoggedIn') !== 'true') {
    try {
      window.umami.track(eventName, eventData)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }
}

// Vendor Directory specific tracking events
export const trackVendorSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('vendor_search', {
    search_term: searchTerm,
    results_count: resultsCount,
    timestamp: new Date().toISOString()
  })
}

export const trackVendorFilter = (filterType: string, filterValue: string) => {
  trackEvent('vendor_filter', {
    filter_type: filterType,
    filter_value: filterValue,
    timestamp: new Date().toISOString()
  })
}

export const trackVendorView = (vendorId: number, vendorName: string, vendorSlug: string) => {
  trackEvent('vendor_view', {
    vendor_id: vendorId,
    vendor_name: vendorName,
    vendor_slug: vendorSlug,
    timestamp: new Date().toISOString()
  })
}

export const trackVendorContact = (vendorId: number, vendorName: string, contactMethod: string) => {
  trackEvent('vendor_contact', {
    vendor_id: vendorId,
    vendor_name: vendorName,
    contact_method: contactMethod,
    timestamp: new Date().toISOString()
  })
}

export const trackVendorWebsiteClick = (vendorId: number, vendorName: string, websiteUrl: string) => {
  trackEvent('vendor_website_click', {
    vendor_id: vendorId,
    vendor_name: vendorName,
    website_url: websiteUrl,
    timestamp: new Date().toISOString()
  })
}

export const trackDirectorySignup = (email: string, accessType: string) => {
  trackEvent('directory_signup', {
    email_domain: email.split('@')[1],
    access_type: accessType,
    timestamp: new Date().toISOString()
  })
}

export const trackDirectoryLogin = (email: string) => {
  trackEvent('directory_login', {
    email_domain: email.split('@')[1],
    timestamp: new Date().toISOString()
  })
}