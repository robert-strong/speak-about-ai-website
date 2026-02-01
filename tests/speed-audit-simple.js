/**
 * Simple Performance Audit for Speak About AI
 * Uses fetch and basic timing to analyze page performance
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Pages to audit
const PAGES = [
  '/',
  '/speakers',
  '/contact',
  '/our-services',
  '/blog',
  '/speakers/adam-cheyer',
  '/top-ai-speakers-2025'
];

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function fetchWithTiming(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    let firstByteTime = null;
    let responseSize = 0;
    let chunks = [];
    
    const req = protocol.get(url, (res) => {
      firstByteTime = Date.now() - startTime;
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
        responseSize += chunk.length;
      });
      
      res.on('end', () => {
        const totalTime = Date.now() - startTime;
        const body = Buffer.concat(chunks).toString();
        
        resolve({
          url,
          statusCode: res.statusCode,
          headers: res.headers,
          size: responseSize,
          timing: {
            firstByte: firstByteTime,
            total: totalTime,
            download: totalTime - firstByteTime
          },
          body
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function analyzePageResources(html, baseUrl) {
  const resources = {
    scripts: [],
    stylesheets: [],
    images: [],
    fonts: []
  };
  
  // Extract scripts
  const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    resources.scripts.push(match[1]);
  }
  
  // Extract stylesheets
  const styleRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g;
  while ((match = styleRegex.exec(html)) !== null) {
    resources.stylesheets.push(match[1]);
  }
  
  // Extract images
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/g;
  while ((match = imgRegex.exec(html)) !== null) {
    resources.images.push(match[1]);
  }
  
  return resources;
}

function analyzeHTML(html) {
  const analysis = {
    title: '',
    metaDescription: false,
    viewport: false,
    inlineStyles: 0,
    inlineScripts: 0,
    externalScripts: 0,
    externalStyles: 0,
    images: 0,
    imagesWithoutAlt: 0,
    forms: 0,
    headings: {
      h1: 0,
      h2: 0,
      h3: 0
    }
  };
  
  // Title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) analysis.title = titleMatch[1];
  
  // Meta tags
  analysis.metaDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
  analysis.viewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
  
  // Inline styles and scripts
  analysis.inlineStyles = (html.match(/<[^>]+style=["'][^"']+["'][^>]*>/g) || []).length;
  analysis.inlineScripts = (html.match(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/g) || []).length;
  
  // External resources
  analysis.externalScripts = (html.match(/<script[^>]*src=["'][^"']+["'][^>]*>/g) || []).length;
  analysis.externalStyles = (html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/g) || []).length;
  
  // Images
  const imgTags = html.match(/<img[^>]*>/g) || [];
  analysis.images = imgTags.length;
  analysis.imagesWithoutAlt = imgTags.filter(tag => !tag.includes('alt=')).length;
  
  // Forms
  analysis.forms = (html.match(/<form[^>]*>/g) || []).length;
  
  // Headings
  analysis.headings.h1 = (html.match(/<h1[^>]*>/g) || []).length;
  analysis.headings.h2 = (html.match(/<h2[^>]*>/g) || []).length;
  analysis.headings.h3 = (html.match(/<h3[^>]*>/g) || []).length;
  
  return analysis;
}

function generatePerformanceScore(metrics) {
  let score = 100;
  const penalties = [];
  
  // Time penalties
  if (metrics.timing.firstByte > 600) {
    const penalty = Math.min(20, (metrics.timing.firstByte - 600) / 100);
    score -= penalty;
    penalties.push(`Slow server response: -${penalty.toFixed(1)}`);
  }
  
  if (metrics.timing.total > 3000) {
    const penalty = Math.min(25, (metrics.timing.total - 3000) / 200);
    score -= penalty;
    penalties.push(`Slow page load: -${penalty.toFixed(1)}`);
  }
  
  // Size penalties
  if (metrics.size > 1000000) { // 1MB
    const penalty = Math.min(15, (metrics.size - 1000000) / 100000);
    score -= penalty;
    penalties.push(`Large page size: -${penalty.toFixed(1)}`);
  }
  
  // Resource penalties
  if (metrics.analysis.externalScripts > 10) {
    const penalty = Math.min(10, metrics.analysis.externalScripts - 10);
    score -= penalty;
    penalties.push(`Too many scripts: -${penalty}`);
  }
  
  if (metrics.analysis.inlineStyles > 50) {
    const penalty = 5;
    score -= penalty;
    penalties.push(`Excessive inline styles: -${penalty}`);
  }
  
  // SEO/Accessibility penalties
  if (!metrics.analysis.metaDescription) {
    score -= 5;
    penalties.push('Missing meta description: -5');
  }
  
  if (metrics.analysis.imagesWithoutAlt > 0) {
    const penalty = Math.min(10, metrics.analysis.imagesWithoutAlt);
    score -= penalty;
    penalties.push(`Images without alt text: -${penalty}`);
  }
  
  return {
    score: Math.max(0, Math.round(score)),
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    penalties
  };
}

async function auditPage(path) {
  const url = `${BASE_URL}${path}`;
  console.log(`\n${colors.cyan}Auditing: ${url}${colors.reset}`);
  
  try {
    const response = await fetchWithTiming(url);
    
    if (response.statusCode !== 200) {
      console.log(`${colors.red}  ✗ HTTP ${response.statusCode}${colors.reset}`);
      return null;
    }
    
    const analysis = analyzeHTML(response.body);
    const resources = await analyzePageResources(response.body, BASE_URL);
    
    const metrics = {
      url,
      path,
      statusCode: response.statusCode,
      size: response.size,
      timing: response.timing,
      analysis,
      resources,
      contentType: response.headers['content-type'],
      cacheControl: response.headers['cache-control'],
      compression: response.headers['content-encoding']
    };
    
    const performance = generatePerformanceScore(metrics);
    metrics.performance = performance;
    
    // Print results
    const gradeColor = performance.score >= 80 ? colors.green : performance.score >= 60 ? colors.yellow : colors.red;
    console.log(`  ${gradeColor}Performance Score: ${performance.score}/100 (${performance.grade})${colors.reset}`);
    console.log(`  Time to First Byte: ${formatTime(metrics.timing.firstByte)}`);
    console.log(`  Total Load Time: ${formatTime(metrics.timing.total)}`);
    console.log(`  Page Size: ${formatBytes(metrics.size)}`);
    console.log(`  Resources: ${metrics.analysis.externalScripts} scripts, ${metrics.analysis.externalStyles} stylesheets, ${metrics.analysis.images} images`);
    
    if (metrics.analysis.imagesWithoutAlt > 0) {
      console.log(`  ${colors.yellow}⚠ ${metrics.analysis.imagesWithoutAlt} images without alt text${colors.reset}`);
    }
    
    if (!metrics.compression) {
      console.log(`  ${colors.yellow}⚠ No compression detected${colors.reset}`);
    }
    
    return metrics;
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return null;
  }
}

async function checkStaticAssets() {
  console.log(`\n${colors.cyan}Checking Static Assets...${colors.reset}`);
  
  const checks = {
    images: [],
    scripts: [],
    styles: []
  };
  
  // Check common static paths
  const staticPaths = [
    '/_next/static/css',
    '/_next/static/chunks',
    '/images',
    '/logos'
  ];
  
  // Test a sample resource to check caching
  try {
    const testUrl = `${BASE_URL}/favicon.png`;
    const response = await fetchWithTiming(testUrl);
    
    if (response.headers['cache-control']) {
      console.log(`  Cache-Control: ${response.headers['cache-control']}`);
    } else {
      console.log(`  ${colors.yellow}⚠ No Cache-Control headers on static assets${colors.reset}`);
    }
    
    if (response.headers['etag']) {
      console.log(`  ✓ ETags enabled`);
    }
  } catch (error) {
    console.log(`  Could not check static assets`);
  }
}

async function generateReport(results) {
  const validResults = results.filter(r => r !== null);
  
  if (validResults.length === 0) {
    console.log(`${colors.red}No pages could be audited${colors.reset}`);
    return;
  }
  
  // Calculate averages
  const avgScore = validResults.reduce((sum, r) => sum + r.performance.score, 0) / validResults.length;
  const avgLoadTime = validResults.reduce((sum, r) => sum + r.timing.total, 0) / validResults.length;
  const avgSize = validResults.reduce((sum, r) => sum + r.size, 0) / validResults.length;
  const avgFirstByte = validResults.reduce((sum, r) => sum + r.timing.firstByte, 0) / validResults.length;
  
  // Find issues
  const issues = [];
  const slowPages = validResults.filter(r => r.timing.total > 3000);
  const largePages = validResults.filter(r => r.size > 2000000);
  const lowScorePages = validResults.filter(r => r.performance.score < 70);
  
  if (slowPages.length > 0) {
    issues.push(`${slowPages.length} slow pages (>3s load time)`);
  }
  if (largePages.length > 0) {
    issues.push(`${largePages.length} large pages (>2MB)`);
  }
  if (lowScorePages.length > 0) {
    issues.push(`${lowScorePages.length} pages with low performance scores (<70)`);
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      pagesAudited: validResults.length,
      averageScore: Math.round(avgScore),
      averageLoadTime: avgLoadTime,
      averageSize: avgSize,
      averageFirstByte: avgFirstByte
    },
    issues,
    pages: validResults.map(r => ({
      path: r.path,
      score: r.performance.score,
      grade: r.performance.grade,
      loadTime: r.timing.total,
      size: r.size,
      issues: r.performance.penalties
    })),
    recommendations: []
  };
  
  // Add recommendations
  if (avgFirstByte > 600) {
    report.recommendations.push('Improve server response time (consider caching, CDN, or server optimization)');
  }
  if (avgSize > 1500000) {
    report.recommendations.push('Reduce average page size (optimize images, minify code, remove unused dependencies)');
  }
  if (avgScore < 80) {
    report.recommendations.push('Overall performance needs improvement');
  }
  
  // Save report
  const reportDir = './test-reports';
  const reportPath = path.join(reportDir, `performance-${Date.now()}.json`);
  
  try {
    await fs.mkdir(reportDir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.green}Report saved to: ${reportPath}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}Could not save report: ${error.message}${colors.reset}`);
  }
  
  return report;
}

async function runAudit() {
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   PAGE SPEED AUDIT - SPEAK ABOUT AI       ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  
  const results = [];
  
  // Audit each page
  for (const path of PAGES) {
    const metrics = await auditPage(path);
    results.push(metrics);
  }
  
  // Check static assets
  await checkStaticAssets();
  
  // Generate report
  const report = await generateReport(results);
  
  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}                 AUDIT SUMMARY                 ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════${colors.reset}`);
  
  if (report) {
    const gradeColor = report.summary.averageScore >= 80 ? colors.green : 
                       report.summary.averageScore >= 60 ? colors.yellow : colors.red;
    
    console.log(`\nOverall Performance: ${gradeColor}${report.summary.averageScore}/100${colors.reset}`);
    console.log(`Average Load Time: ${formatTime(report.summary.averageLoadTime)}`);
    console.log(`Average Page Size: ${formatBytes(report.summary.averageSize)}`);
    console.log(`Average TTFB: ${formatTime(report.summary.averageFirstByte)}`);
    
    if (report.issues.length > 0) {
      console.log(`\n${colors.yellow}Issues Found:${colors.reset}`);
      report.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    if (report.recommendations.length > 0) {
      console.log(`\n${colors.cyan}Recommendations:${colors.reset}`);
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    // Show worst performing pages
    const worstPages = report.pages
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
    
    if (worstPages.length > 0) {
      console.log(`\n${colors.yellow}Pages Needing Attention:${colors.reset}`);
      worstPages.forEach(page => {
        const color = page.score >= 70 ? colors.yellow : colors.red;
        console.log(`  ${color}${page.path} - Score: ${page.score}/100, Load: ${formatTime(page.loadTime)}${colors.reset}`);
      });
    }
  }
  
  console.log(`\n${colors.green}✓ Audit complete${colors.reset}`);
}

// Run the audit
runAudit().catch(error => {
  console.error(`${colors.red}Audit failed: ${error.message}${colors.reset}`);
  process.exit(1);
});