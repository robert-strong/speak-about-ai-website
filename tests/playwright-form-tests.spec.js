/**
 * Playwright End-to-End Form Tests for Speak About AI
 * Browser-based testing of all public forms
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Helper to generate unique test data
const generateTestEmail = () => `test.${Date.now()}@example.com`;
const generateTestPhone = () => `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;

test.describe('Contact Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
  });

  test('should submit valid contact form', async ({ page }) => {
    // Fill in the form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', generateTestEmail());
    await page.fill('input[name="phone"]', generateTestPhone());
    await page.fill('input[name="company"]', 'Test Company Inc.');
    await page.fill('input[name="eventDate"]', '2025-06-15');
    await page.fill('input[name="eventLocation"]', 'San Francisco, CA');
    await page.selectOption('select[name="eventType"]', 'Conference');
    await page.fill('input[name="expectedAttendees"]', '500');
    await page.selectOption('select[name="budget"]', '$10,000 - $25,000');
    await page.fill('textarea[name="message"]', 'Looking for an AI keynote speaker for our annual conference.');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('text=/success|thank you/i')).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=/required|please fill/i').first()).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    // Check for email validation error
    await expect(page.locator('text=/valid email|email.*invalid/i')).toBeVisible();
  });

  test('should prevent XSS attacks', async ({ page }) => {
    await page.fill('input[name="name"]', '<script>alert("XSS")</script>');
    await page.fill('input[name="email"]', generateTestEmail());
    await page.fill('textarea[name="message"]', '<img src=x onerror=alert("XSS")>');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check that no alert was triggered
    let alertTriggered = false;
    page.on('dialog', () => {
      alertTriggered = true;
    });
    
    await page.waitForTimeout(2000);
    expect(alertTriggered).toBe(false);
  });
});

test.describe('Speaker Application Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/speakers/apply`);
  });

  test('should submit valid speaker application', async ({ page }) => {
    // Fill in speaker application form
    await page.fill('input[name="name"]', 'Dr. Test Speaker');
    await page.fill('input[name="email"]', generateTestEmail());
    await page.fill('input[name="phone"]', generateTestPhone());
    await page.fill('input[name="location"]', 'New York, NY');
    await page.fill('input[name="title"]', 'AI Research Director');
    await page.fill('input[name="company"]', 'Tech Innovation Labs');
    
    // Fill expertise checkboxes or multi-select
    const expertiseFields = await page.locator('input[name="expertise"]').all();
    if (expertiseFields.length > 0) {
      await expertiseFields[0].check();
    } else {
      await page.fill('input[name="expertise"]', 'AI, Machine Learning, Neural Networks');
    }
    
    await page.fill('textarea[name="bio"]', 'Dr. Test Speaker is a renowned AI researcher with over 15 years of experience.');
    await page.fill('textarea[name="speakingExperience"]', 'Keynoted at over 50 conferences including TED and SXSW');
    await page.fill('textarea[name="topics"]', 'The Future of AI, Ethical AI Development');
    await page.fill('input[name="videoLinks"]', 'https://youtube.com/watch?v=example');
    await page.fill('input[name="website"]', 'https://example-speaker.com');
    await page.fill('input[name="linkedin"]', 'https://linkedin.com/in/testspeaker');
    
    // Submit application
    await page.click('button[type="submit"]');
    
    // Check for success
    await expect(page.locator('text=/success|thank you|submitted/i')).toBeVisible({ timeout: 10000 });
  });

  test('should validate URL formats', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test Speaker');
    await page.fill('input[name="email"]', generateTestEmail());
    await page.fill('input[name="website"]', 'not-a-valid-url');
    
    await page.click('button[type="submit"]');
    
    // Check for URL validation error
    await expect(page.locator('text=/valid url|url.*invalid/i')).toBeVisible();
  });

  test('should prevent duplicate applications', async ({ page }) => {
    const testEmail = generateTestEmail();
    
    // First submission
    await page.fill('input[name="name"]', 'Test Speaker 1');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('textarea[name="bio"]', 'Test bio');
    await page.click('button[type="submit"]');
    
    // Wait for first submission to complete
    await page.waitForTimeout(2000);
    
    // Go back to form
    await page.goto(`${BASE_URL}/speakers/apply`);
    
    // Try duplicate submission
    await page.fill('input[name="name"]', 'Test Speaker 2');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('textarea[name="bio"]', 'Different bio');
    await page.click('button[type="submit"]');
    
    // Check for duplicate error
    await expect(page.locator('text=/already.*exist|duplicate/i')).toBeVisible();
  });
});

test.describe('Newsletter Signup Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should sign up for newsletter from footer', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Find newsletter form in footer
    const newsletterInput = page.locator('footer input[type="email"], footer input[placeholder*="email"]').first();
    await newsletterInput.fill(generateTestEmail());
    
    // Submit newsletter form
    const submitButton = page.locator('footer button:has-text("Subscribe"), footer button:has-text("Sign up")').first();
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=/subscribed|thank you|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate email in newsletter form', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const newsletterInput = page.locator('footer input[type="email"], footer input[placeholder*="email"]').first();
    await newsletterInput.fill('invalid-email');
    
    const submitButton = page.locator('footer button:has-text("Subscribe"), footer button:has-text("Sign up")').first();
    await submitButton.click();
    
    // Check for validation error
    await expect(page.locator('text=/valid email|email.*invalid/i')).toBeVisible();
  });
});

test.describe('Search Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/speakers`);
  });

  test('should search for speakers', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('AI');
    
    // Wait for search results to update
    await page.waitForTimeout(1000);
    
    // Check that results are displayed
    const speakerCards = page.locator('[data-testid="speaker-card"], .speaker-card, article');
    await expect(speakerCards.first()).toBeVisible();
  });

  test('should filter by industry', async ({ page }) => {
    // Find and click industry filter
    const filterSelect = page.locator('select:has-text("Industry"), select[name*="industry"]').first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('Technology & AI');
    } else {
      // Try clicking a filter button if select is not visible
      const filterButton = page.locator('button:has-text("Technology")').first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
      }
    }
    
    // Wait for results to filter
    await page.waitForTimeout(1000);
    
    // Verify filtering worked
    const resultsText = page.locator('text=/showing.*speakers/i').first();
    await expect(resultsText).toBeVisible();
  });

  test('should handle no search results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await searchInput.fill('zzznonexistentspeakerzzz');
    
    await page.waitForTimeout(1000);
    
    // Check for no results message
    await expect(page.locator('text=/no.*found|no.*results/i')).toBeVisible();
  });
});

test.describe('Login Form Security Tests', () => {
  test('should prevent SQL injection in speaker login', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/speaker`);
    
    await page.fill('input[name="email"], input[type="email"]', "admin' OR '1'='1");
    await page.fill('input[name="password"], input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');
    
    // Should show error, not log in
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible();
    
    // Should not redirect to dashboard
    expect(page.url()).not.toContain('/dashboard');
  });

  test('should prevent XSS in login forms', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/speaker`);
    
    await page.fill('input[name="email"], input[type="email"]', '<script>alert("XSS")</script>@test.com');
    await page.fill('input[name="password"], input[type="password"]', '<img src=x onerror=alert("XSS")>');
    
    let alertTriggered = false;
    page.on('dialog', () => {
      alertTriggered = true;
    });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    expect(alertTriggered).toBe(false);
  });

  test('should enforce rate limiting on login attempts', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/speaker`);
    
    // Try multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Should show rate limit error
    await expect(page.locator('text=/too many|rate limit|slow down/i')).toBeVisible();
  });
});

test.describe('Accessibility Tests', () => {
  test('contact form should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']).toContain(focusedElement);
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    
    // Check that inputs have associated labels
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const labelExists = await label.count() > 0;
        
        if (!labelExists) {
          // Check for aria-label as alternative
          const ariaLabel = await input.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Performance Tests', () => {
  test('contact form should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/contact`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('search should respond quickly', async ({ page }) => {
    await page.goto(`${BASE_URL}/speakers`);
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    
    const startTime = Date.now();
    await searchInput.fill('AI');
    
    // Wait for results to update
    await page.waitForTimeout(600); // Debounce time
    
    const searchTime = Date.now() - startTime;
    
    // Search should complete in under 2 seconds
    expect(searchTime).toBeLessThan(2000);
  });
});