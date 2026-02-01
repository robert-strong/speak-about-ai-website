/**
 * Performance Audit for Speak About AI
 * Comprehensive page speed and optimization analysis
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Pages to audit
const PAGES_TO_AUDIT = [
  { path: '/', name: 'Homepage' },
  { path: '/speakers', name: 'Speakers Directory' },
  { path: '/contact', name: 'Contact Page' },
  { path: '/our-services', name: 'Services Page' },
  { path: '/blog', name: 'Blog' },
  { path: '/speakers/adam-cheyer', name: 'Speaker Profile (Sample)' },
  { path: '/top-ai-speakers-2025', name: 'Landing Page' }
];

// Performance thresholds
const THRESHOLDS = {
  FCP: 1800,        // First Contentful Paint (ms)
  LCP: 2500,        // Largest Contentful Paint (ms)
  FID: 100,         // First Input Delay (ms)
  CLS: 0.1,         // Cumulative Layout Shift
  TTI: 3800,        // Time to Interactive (ms)
  TBT: 200,         // Total Blocking Time (ms)
  speedIndex: 3400, // Speed Index (ms)
  pageSize: 3000000,// Page size in bytes (3MB)
  requests: 100,    // Number of requests
  domSize: 1500,    // DOM elements count
};

// Helper to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper to format time
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Helper to get performance grade
function getGrade(value, threshold, isLower = true) {
  const ratio = isLower ? value / threshold : threshold / value;
  if (ratio <= 0.5) return { grade: 'A', color: colors.green };
  if (ratio <= 0.8) return { grade: 'B', color: colors.green };
  if (ratio <= 1.0) return { grade: 'C', color: colors.yellow };
  if (ratio <= 1.5) return { grade: 'D', color: colors.red };
  return { grade: 'F', color: colors.red };
}

// Audit a single page
async function auditPage(browser, pageInfo) {
  const page = await browser.newPage();
  const metrics = {
    url: `${BASE_URL}${pageInfo.path}`,
    name: pageInfo.name,
    performance: {},
    resources: {},
    issues: [],
    suggestions: []
  };

  try {
    // Enable performance monitoring
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Track network requests
    const requests = [];
    const resourceTypes = {};
    let totalSize = 0;

    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        type: request.resourceType()
      });
    });

    page.on('response', response => {
      const request = response.request();
      const type = request.resourceType();
      const size = parseInt(response.headers()['content-length'] || 0);
      
      if (!resourceTypes[type]) {
        resourceTypes[type] = { count: 0, size: 0 };
      }
      resourceTypes[type].count++;
      resourceTypes[type].size += size;
      totalSize += size;
    });

    // Start performance measurement
    const startTime = Date.now();
    
    // Navigate to page
    await page.goto(metrics.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;

    // Get performance metrics
    const perfMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        // Navigation timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        
        // Paint timing
        FCP: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        FP: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        
        // Resource timing
        resources: performance.getEntriesByType('resource').length,
        
        // Memory (if available)
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    });

    // Get Core Web Vitals
    const coreWebVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        let LCP = 0;
        let FID = 0;
        let CLS = 0;
        
        // Observe LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          LCP = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Observe CLS
        let clsValue = 0;
        let clsEntries = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          }
          CLS = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Wait and resolve
        setTimeout(() => {
          resolve({ LCP, CLS, FID });
        }, 3000);
      });
    });

    // Get DOM metrics
    const domMetrics = await page.evaluate(() => {
      return {
        domElements: document.getElementsByTagName('*').length,
        images: document.images.length,
        scripts: document.scripts.length,
        stylesheets: document.styleSheets.length,
        iframes: document.getElementsByTagName('iframe').length,
        forms: document.forms.length
      };
    });

    // Check for common issues
    const checks = await page.evaluate(() => {
      const issues = [];
      const suggestions = [];
      
      // Check for missing alt text
      const imagesWithoutAlt = Array.from(document.images).filter(img => !img.alt);
      if (imagesWithoutAlt.length > 0) {
        issues.push(`${imagesWithoutAlt.length} images without alt text`);
      }
      
      // Check for large images
      const largeImages = Array.from(document.images).filter(img => {
        return img.naturalWidth > 2000 || img.naturalHeight > 2000;
      });
      if (largeImages.length > 0) {
        issues.push(`${largeImages.length} oversized images detected`);
        suggestions.push('Consider resizing images to appropriate dimensions');
      }
      
      // Check for inline styles
      const elementsWithInlineStyles = document.querySelectorAll('[style]');
      if (elementsWithInlineStyles.length > 50) {
        issues.push(`${elementsWithInlineStyles.length} elements with inline styles`);
        suggestions.push('Move inline styles to CSS files for better caching');
      }
      
      // Check for missing meta tags
      if (!document.querySelector('meta[name="description"]')) {
        issues.push('Missing meta description');
      }
      if (!document.querySelector('meta[name="viewport"]')) {
        issues.push('Missing viewport meta tag');
      }
      
      // Check for render-blocking resources
      const renderBlockingScripts = Array.from(document.scripts).filter(script => {
        return !script.async && !script.defer && script.src;
      });
      if (renderBlockingScripts.length > 0) {
        issues.push(`${renderBlockingScripts.length} render-blocking scripts`);
        suggestions.push('Add async or defer attributes to non-critical scripts');
      }
      
      return { issues, suggestions };
    });

    // Compile metrics
    metrics.performance = {
      loadTime,
      FCP: perfMetrics.FCP,
      LCP: coreWebVitals.LCP,
      CLS: coreWebVitals.CLS,
      domContentLoaded: perfMetrics.domContentLoaded,
      requests: requests.length,
      totalSize
    };

    metrics.resources = resourceTypes;
    metrics.dom = domMetrics;
    metrics.issues = checks.issues;
    metrics.suggestions = checks.suggestions;

    // Add performance suggestions based on metrics
    if (metrics.performance.FCP > THRESHOLDS.FCP) {
      metrics.suggestions.push(`Improve First Contentful Paint (currently ${formatTime(metrics.performance.FCP)})`);
    }
    if (metrics.performance.LCP > THRESHOLDS.LCP) {
      metrics.suggestions.push(`Optimize Largest Contentful Paint (currently ${formatTime(metrics.performance.LCP)})`);
    }
    if (metrics.performance.totalSize > THRESHOLDS.pageSize) {
      metrics.suggestions.push(`Reduce page size (currently ${formatBytes(metrics.performance.totalSize)})`);
    }
    if (metrics.dom.domElements > THRESHOLDS.domSize) {
      metrics.suggestions.push(`Reduce DOM size (currently ${metrics.dom.domElements} elements)`);
    }

  } catch (error) {
    metrics.error = error.message;
  } finally {
    await page.close();
  }

  return metrics;
}

// Generate HTML report
async function generateHTMLReport(results) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Audit Report - Speak About AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; margin-bottom: 30px; font-size: 2.5em; }
    h2 { color: #34495e; margin: 20px 0 15px; font-size: 1.8em; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h3 { color: #34495e; margin: 15px 0 10px; font-size: 1.3em; }
    .summary { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .metric-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .metric-label { font-size: 0.9em; color: #7f8c8d; margin-bottom: 5px; }
    .metric-value { font-size: 1.5em; font-weight: bold; color: #2c3e50; }
    .grade { display: inline-block; width: 40px; height: 40px; border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; color: white; margin-left: 10px; }
    .grade-A { background: #27ae60; }
    .grade-B { background: #2ecc71; }
    .grade-C { background: #f39c12; }
    .grade-D { background: #e67e22; }
    .grade-F { background: #e74c3c; }
    .page-report { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .issues { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107; }
    .suggestions { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #17a2b8; }
    .resource-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .resource-table th, .resource-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    .resource-table th { background: #f8f9fa; font-weight: 600; }
    .status-good { color: #27ae60; }
    .status-warning { color: #f39c12; }
    .status-bad { color: #e74c3c; }
    .timestamp { color: #7f8c8d; font-size: 0.9em; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Performance Audit Report</h1>
    <div class="summary">
      <h2>Executive Summary</h2>
      <p>Audited ${results.length} pages on ${new Date().toLocaleString()}</p>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Average Load Time</div>
          <div class="metric-value">${formatTime(results.reduce((acc, r) => acc + r.performance.loadTime, 0) / results.length)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average FCP</div>
          <div class="metric-value">${formatTime(results.reduce((acc, r) => acc + r.performance.FCP, 0) / results.length)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average Page Size</div>
          <div class="metric-value">${formatBytes(results.reduce((acc, r) => acc + r.performance.totalSize, 0) / results.length)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Issues Found</div>
          <div class="metric-value">${results.reduce((acc, r) => acc + r.issues.length, 0)}</div>
        </div>
      </div>
    </div>

    ${results.map(page => `
      <div class="page-report">
        <h2>${page.name}</h2>
        <p style="color: #7f8c8d; margin-bottom: 15px;">${page.url}</p>
        
        <h3>Performance Metrics</h3>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Load Time</div>
            <div class="metric-value ${page.performance.loadTime < 3000 ? 'status-good' : page.performance.loadTime < 5000 ? 'status-warning' : 'status-bad'}">
              ${formatTime(page.performance.loadTime)}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">First Contentful Paint</div>
            <div class="metric-value ${page.performance.FCP < THRESHOLDS.FCP ? 'status-good' : page.performance.FCP < THRESHOLDS.FCP * 1.5 ? 'status-warning' : 'status-bad'}">
              ${formatTime(page.performance.FCP)}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Largest Contentful Paint</div>
            <div class="metric-value ${page.performance.LCP < THRESHOLDS.LCP ? 'status-good' : page.performance.LCP < THRESHOLDS.LCP * 1.5 ? 'status-warning' : 'status-bad'}">
              ${formatTime(page.performance.LCP)}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Layout Shift (CLS)</div>
            <div class="metric-value ${page.performance.CLS < THRESHOLDS.CLS ? 'status-good' : page.performance.CLS < THRESHOLDS.CLS * 1.5 ? 'status-warning' : 'status-bad'}">
              ${page.performance.CLS.toFixed(3)}
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Requests</div>
            <div class="metric-value">${page.performance.requests}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Page Size</div>
            <div class="metric-value">${formatBytes(page.performance.totalSize)}</div>
          </div>
        </div>

        <h3>Resource Breakdown</h3>
        <table class="resource-table">
          <thead>
            <tr>
              <th>Resource Type</th>
              <th>Count</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(page.resources).map(([type, data]) => `
              <tr>
                <td>${type}</td>
                <td>${data.count}</td>
                <td>${formatBytes(data.size)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>DOM Statistics</h3>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">DOM Elements</div>
            <div class="metric-value ${page.dom.domElements < THRESHOLDS.domSize ? 'status-good' : 'status-warning'}">${page.dom.domElements}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Images</div>
            <div class="metric-value">${page.dom.images}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Scripts</div>
            <div class="metric-value">${page.dom.scripts}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Stylesheets</div>
            <div class="metric-value">${page.dom.stylesheets}</div>
          </div>
        </div>

        ${page.issues.length > 0 ? `
          <div class="issues">
            <h3>⚠️ Issues Found</h3>
            <ul>
              ${page.issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${page.suggestions.length > 0 ? `
          <div class="suggestions">
            <h3>💡 Suggestions</h3>
            <ul>
              ${page.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('')}

    <div class="timestamp">
      Report generated on ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

// Main audit function
async function runPerformanceAudit() {
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   PERFORMANCE AUDIT - SPEAK ABOUT AI      ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.cyan}Target: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.cyan}Time: ${new Date().toLocaleString()}${colors.reset}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const pageInfo of PAGES_TO_AUDIT) {
    console.log(`${colors.yellow}Auditing: ${pageInfo.name}...${colors.reset}`);
    const metrics = await auditPage(browser, pageInfo);
    results.push(metrics);
    
    // Print summary
    if (metrics.error) {
      console.log(`  ${colors.red}✗ Error: ${metrics.error}${colors.reset}`);
    } else {
      const fcpGrade = getGrade(metrics.performance.FCP, THRESHOLDS.FCP);
      const lcpGrade = getGrade(metrics.performance.LCP, THRESHOLDS.LCP);
      const sizeGrade = getGrade(metrics.performance.totalSize, THRESHOLDS.pageSize);
      
      console.log(`  ${colors.green}✓${colors.reset} Load Time: ${formatTime(metrics.performance.loadTime)}`);
      console.log(`  ${colors.green}✓${colors.reset} FCP: ${formatTime(metrics.performance.FCP)} ${fcpGrade.color}[${fcpGrade.grade}]${colors.reset}`);
      console.log(`  ${colors.green}✓${colors.reset} LCP: ${formatTime(metrics.performance.LCP)} ${lcpGrade.color}[${lcpGrade.grade}]${colors.reset}`);
      console.log(`  ${colors.green}✓${colors.reset} Size: ${formatBytes(metrics.performance.totalSize)} ${sizeGrade.color}[${sizeGrade.grade}]${colors.reset}`);
      
      if (metrics.issues.length > 0) {
        console.log(`  ${colors.yellow}⚠ ${metrics.issues.length} issues found${colors.reset}`);
      }
    }
    console.log('');
  }

  await browser.close();

  // Generate reports
  const timestamp = Date.now();
  const reportDir = `./test-reports/performance-${timestamp}`;
  
  try {
    await fs.mkdir(reportDir, { recursive: true });
    
    // Save JSON report
    await fs.writeFile(
      path.join(reportDir, 'metrics.json'),
      JSON.stringify(results, null, 2)
    );
    
    // Save HTML report
    const htmlReport = await generateHTMLReport(results);
    await fs.writeFile(
      path.join(reportDir, 'report.html'),
      htmlReport
    );
    
    console.log(`${colors.green}✓ Reports saved to: ${reportDir}${colors.reset}`);
    console.log(`${colors.green}✓ Open ${reportDir}/report.html to view the detailed report${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to save reports: ${error.message}${colors.reset}`);
  }

  // Print summary
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║            AUDIT SUMMARY                  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  
  const avgLoadTime = results.reduce((acc, r) => acc + r.performance.loadTime, 0) / results.length;
  const avgFCP = results.reduce((acc, r) => acc + r.performance.FCP, 0) / results.length;
  const avgSize = results.reduce((acc, r) => acc + r.performance.totalSize, 0) / results.length;
  const totalIssues = results.reduce((acc, r) => acc + r.issues.length, 0);
  
  console.log(`Pages Audited: ${results.length}`);
  console.log(`Average Load Time: ${formatTime(avgLoadTime)}`);
  console.log(`Average FCP: ${formatTime(avgFCP)}`);
  console.log(`Average Page Size: ${formatBytes(avgSize)}`);
  console.log(`Total Issues: ${totalIssues}`);
  
  // Top recommendations
  console.log(`\n${colors.cyan}Top Recommendations:${colors.reset}`);
  const allSuggestions = results.flatMap(r => r.suggestions);
  const suggestionCounts = {};
  allSuggestions.forEach(s => {
    suggestionCounts[s] = (suggestionCounts[s] || 0) + 1;
  });
  
  Object.entries(suggestionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([suggestion, count]) => {
      console.log(`  • ${suggestion} (${count} pages)`);
    });
}

// Check if puppeteer is installed
const checkDependencies = async () => {
  try {
    require.resolve('puppeteer');
    return true;
  } catch {
    console.log(`${colors.yellow}Installing puppeteer for performance audit...${colors.reset}`);
    const { execSync } = require('child_process');
    execSync('npm install puppeteer', { stdio: 'inherit' });
    return true;
  }
};

// Run the audit
(async () => {
  await checkDependencies();
  await runPerformanceAudit();
})();