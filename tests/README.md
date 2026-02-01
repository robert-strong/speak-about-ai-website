# Speak About AI - Form Testing Suite

Comprehensive testing suite for all public-facing forms on the Speak About AI website.

## 📋 Test Coverage

### Forms Tested
1. **Contact Form** (`/contact`)
   - Valid submission
   - Required field validation
   - Email format validation
   - XSS prevention
   - SQL injection prevention

2. **Speaker Application** (`/speakers/apply`)
   - Valid application submission
   - Duplicate email detection
   - URL validation
   - Required fields validation

3. **Newsletter Signup** (Footer)
   - Valid email signup
   - Invalid email rejection
   - Duplicate subscription handling

4. **Speaker Login** (`/portal/speaker`)
   - Invalid credentials
   - SQL injection prevention
   - XSS prevention
   - Rate limiting

5. **Client Login** (`/portal/client`)
   - Invalid credentials
   - Security testing
   - XSS prevention

6. **Search Functionality** (`/speakers`)
   - Search tracking
   - Empty query handling
   - XSS in search queries

7. **Password Reset**
   - Valid reset request
   - Invalid email format
   - Rate limiting

## 🚀 Quick Start

### Installation
```bash
cd tests
npm install
npx playwright install  # For browser testing
```

### Running Tests

#### Run All Tests
```bash
./run-tests.sh
```

#### Run API Tests Only
```bash
npm run test:api
```

#### Run E2E Tests Only
```bash
npm run test:e2e
```

#### Run E2E Tests with Browser UI
```bash
npm run test:e2e:headed
```

#### Debug E2E Tests
```bash
npm run test:e2e:debug
```

## 📊 Test Types

### 1. API Tests (`form-tests.js`)
- Direct HTTP requests to API endpoints
- Tests form validation logic
- Security testing (XSS, SQL injection)
- Rate limiting verification
- Fast execution

### 2. E2E Tests (`playwright-form-tests.spec.js`)
- Real browser interaction
- Tests complete user flows
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness
- Accessibility testing
- Performance metrics

### 3. Security Tests
- Header validation
- CSRF protection
- Input sanitization
- Rate limiting
- Authentication security

## 📈 Test Reports

After running tests, reports are generated in `test-reports/[timestamp]/`:

- `api-tests.log` - API test results
- `e2e-tests.json` - Playwright test results
- `security-tests.log` - Security scan results
- `summary.md` - Overall test summary
- `playwright-report/` - HTML report for E2E tests

### View HTML Report
```bash
npx playwright show-report test-reports/[timestamp]/playwright-report
```

## 🔧 Configuration

### Environment Variables
```bash
TEST_URL=http://localhost:3000  # Target URL for testing
```

### Playwright Configuration
Edit `playwright.config.js` to modify:
- Browser selection
- Timeout values
- Parallel execution
- Retry attempts
- Screenshot/video settings

## 🧪 Test Scenarios

### Valid Data Testing
- Correct form submissions
- Expected success flows
- Proper data handling

### Validation Testing
- Required field checks
- Format validation (email, phone, URL)
- Length restrictions
- Data type validation

### Security Testing
- XSS prevention
- SQL injection prevention
- CSRF protection
- Rate limiting
- Authentication security

### Error Handling
- Network failures
- Server errors
- Timeout handling
- Graceful degradation

### Performance Testing
- Page load times
- Form submission speed
- Search responsiveness
- API response times

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- ARIA labels
- Focus management

## 🔍 Debugging Failed Tests

### API Test Failures
1. Check `test-reports/*/api-tests.log`
2. Verify server is running
3. Check API endpoint availability
4. Review validation rules

### E2E Test Failures
1. View screenshots in `test-results/`
2. Check videos for failed tests
3. Run with `--debug` flag
4. Review HTML report

### Common Issues
- **Server not running**: Start with `npm run dev`
- **Port conflicts**: Check port 3000 availability
- **Database issues**: Verify database connection
- **Rate limiting**: Wait between test runs

## 📝 Adding New Tests

### Add API Test
```javascript
// In form-tests.js
async function testNewForm() {
  const response = await makeRequest('/api/new-endpoint', 'POST', {
    field1: 'value1',
    field2: 'value2'
  });
  
  logTest('New form - Valid submission', response.ok);
}
```

### Add E2E Test
```javascript
// In playwright-form-tests.spec.js
test('should test new form', async ({ page }) => {
  await page.goto('/new-form');
  await page.fill('input[name="field1"]', 'value1');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

## 🚨 CI/CD Integration

### GitHub Actions Example
```yaml
name: Form Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx playwright install
      - run: npm test
```

## 📞 Support

For issues or questions about the test suite:
1. Check test logs in `test-reports/`
2. Review this README
3. Contact the development team

## 🔄 Maintenance

- Update test data regularly
- Review and update selectors after UI changes
- Add tests for new forms/features
- Monitor test execution times
- Clean up old test reports periodically