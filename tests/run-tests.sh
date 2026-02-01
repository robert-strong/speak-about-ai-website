#!/bin/bash

# Speak About AI - Comprehensive Form Testing Script
# This script runs all form tests and generates a report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${TEST_URL:-"http://localhost:3000"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="test-reports/${TIMESTAMP}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     SPEAK ABOUT AI - FORM TESTING SUITE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "Target URL: ${BASE_URL}"
echo -e "Timestamp: ${TIMESTAMP}"
echo ""

# Create report directory
mkdir -p ${REPORT_DIR}

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}Checking if server is running...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" ${BASE_URL} | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running${NC}"
        echo -e "${YELLOW}Starting development server...${NC}"
        cd ..
        npm run dev &
        SERVER_PID=$!
        cd tests
        sleep 5
        return 0
    fi
}

# Function to run API tests
run_api_tests() {
    echo ""
    echo -e "${BLUE}Running API Form Tests...${NC}"
    echo -e "${BLUE}────────────────────────${NC}"
    
    if [ -f "form-tests.js" ]; then
        node form-tests.js > ${REPORT_DIR}/api-tests.log 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ API tests completed successfully${NC}"
        else
            echo -e "${RED}✗ API tests failed${NC}"
            echo -e "${YELLOW}Check ${REPORT_DIR}/api-tests.log for details${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ API test file not found${NC}"
    fi
}

# Function to run Playwright E2E tests
run_e2e_tests() {
    echo ""
    echo -e "${BLUE}Running E2E Browser Tests...${NC}"
    echo -e "${BLUE}────────────────────────────${NC}"
    
    # Check if Playwright is installed
    if [ ! -d "node_modules/@playwright" ]; then
        echo -e "${YELLOW}Installing Playwright...${NC}"
        npm install
        npx playwright install
    fi
    
    # Run Playwright tests
    TEST_URL=${BASE_URL} npx playwright test --reporter=json > ${REPORT_DIR}/e2e-tests.json 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ E2E tests completed successfully${NC}"
    else
        echo -e "${RED}✗ E2E tests failed${NC}"
        echo -e "${YELLOW}Check ${REPORT_DIR}/e2e-tests.json for details${NC}"
    fi
    
    # Copy Playwright HTML report if it exists
    if [ -d "playwright-report" ]; then
        cp -r playwright-report ${REPORT_DIR}/
        echo -e "${GREEN}✓ Playwright HTML report saved${NC}"
    fi
}

# Function to run security tests
run_security_tests() {
    echo ""
    echo -e "${BLUE}Running Security Tests...${NC}"
    echo -e "${BLUE}────────────────────────${NC}"
    
    # Test for common security headers
    echo "Testing security headers..." > ${REPORT_DIR}/security-tests.log
    
    # Check for security headers
    HEADERS=$(curl -s -I ${BASE_URL})
    
    # Check for X-Frame-Options
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        echo "✓ X-Frame-Options header present" >> ${REPORT_DIR}/security-tests.log
    else
        echo "✗ X-Frame-Options header missing" >> ${REPORT_DIR}/security-tests.log
    fi
    
    # Check for X-Content-Type-Options
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
        echo "✓ X-Content-Type-Options header present" >> ${REPORT_DIR}/security-tests.log
    else
        echo "✗ X-Content-Type-Options header missing" >> ${REPORT_DIR}/security-tests.log
    fi
    
    # Check for CSP
    if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
        echo "✓ Content-Security-Policy header present" >> ${REPORT_DIR}/security-tests.log
    else
        echo "✗ Content-Security-Policy header missing" >> ${REPORT_DIR}/security-tests.log
    fi
    
    echo -e "${GREEN}✓ Security tests completed${NC}"
}

# Function to generate summary report
generate_summary() {
    echo ""
    echo -e "${BLUE}Generating Test Summary...${NC}"
    echo -e "${BLUE}─────────────────────────${NC}"
    
    cat > ${REPORT_DIR}/summary.md << EOF
# Speak About AI - Form Testing Report
## Date: $(date)
## Target: ${BASE_URL}

### Test Results Summary

#### API Tests
$(if [ -f "${REPORT_DIR}/api-tests.log" ]; then tail -20 ${REPORT_DIR}/api-tests.log | grep -E "Total Tests:|Passed:|Failed:|Success Rate:" || echo "No results available"; fi)

#### E2E Tests
$(if [ -f "${REPORT_DIR}/e2e-tests.json" ]; then echo "Results saved in e2e-tests.json"; fi)

#### Security Tests
$(if [ -f "${REPORT_DIR}/security-tests.log" ]; then cat ${REPORT_DIR}/security-tests.log; fi)

### Files Generated
- API Test Log: api-tests.log
- E2E Test Results: e2e-tests.json
- Security Test Log: security-tests.log
- Playwright Report: playwright-report/index.html

### Recommendations
1. Review any failed tests in the logs
2. Address security header warnings if present
3. Check Playwright HTML report for detailed E2E results
4. Re-run failed tests after fixes

EOF
    
    echo -e "${GREEN}✓ Summary report generated at ${REPORT_DIR}/summary.md${NC}"
}

# Main execution
main() {
    # Check dependencies
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is required but not installed${NC}"
        exit 1
    fi
    
    # Check server
    check_server
    
    # Run all test suites
    run_api_tests
    run_e2e_tests
    run_security_tests
    
    # Generate summary
    generate_summary
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}     ALL TESTS COMPLETED${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "Reports saved in: ${REPORT_DIR}"
    echo ""
    echo -e "To view Playwright HTML report, run:"
    echo -e "  ${YELLOW}npx playwright show-report ${REPORT_DIR}/playwright-report${NC}"
    echo ""
    
    # Kill dev server if we started it
    if [ ! -z "$SERVER_PID" ]; then
        echo -e "${YELLOW}Stopping development server...${NC}"
        kill $SERVER_PID 2>/dev/null || true
    fi
}

# Run main function
main