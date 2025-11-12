#!/bin/bash

# Security Validation Script
# 
# This script performs comprehensive security checks for the AIOHub application.
# Run this before deploying to production or when making security-related changes.
#
# Usage:
#   ./scripts/security-check.sh [--fix] [--verbose]
#
# Options:
#   --fix      Attempt to fix issues automatically
#   --verbose  Show detailed output

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
FIX_ISSUES=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --fix)
      FIX_ISSUES=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--fix] [--verbose]"
      echo "  --fix      Attempt to fix issues automatically"
      echo "  --verbose  Show detailed output"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1"
}

log_verbose() {
  if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${BLUE}[VERBOSE]${NC} $1"
  fi
}

# Check if we're in the project root
check_project_root() {
  if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
  fi
}

# Check Node.js and npm versions
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  # Check Node.js version
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//')
    log_verbose "Node.js version: $NODE_VERSION"
    
    # Extract major version number
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [[ $NODE_MAJOR -lt 18 ]]; then
      log_error "Node.js version 18 or higher is required (found: $NODE_VERSION)"
      exit 1
    fi
  else
    log_error "Node.js is not installed"
    exit 1
  fi
  
  # Check npm
  if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    log_verbose "npm version: $NPM_VERSION"
  else
    log_error "npm is not installed"
    exit 1
  fi
  
  log_success "Prerequisites check completed"
}

# Install dependencies if needed
install_dependencies() {
  if [[ ! -d "node_modules" ]]; then
    log_info "Installing dependencies..."
    npm ci
  else
    log_verbose "Dependencies already installed"
  fi
}

# Check for sensitive data in code
check_sensitive_data() {
  log_info "Checking for sensitive data in code..."
  
  local issues_found=0
  
  # Check for hardcoded secrets
  log_verbose "Scanning for hardcoded secrets..."
  if grep -r -E "(password|secret|key|token)\s*[:=]\s*['\"][^'\"]{8,}" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "process\.env\|example\|placeholder\|your_" | head -3; then
    log_error "Hardcoded credentials found in source code"
    issues_found=1
  fi
  
  # Check for API keys
  log_verbose "Scanning for API keys..."
  if grep -r -i "api[_-]key\|secret[_-]key" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "process\.env\|\.env\|example\|placeholder\|your_" | head -5; then
    log_warning "Potential API keys found in source code"
    issues_found=1
  fi
  
  # Check for TODO/FIXME comments with security implications
  log_verbose "Scanning for security-related TODOs..."
  if grep -r -i "TODO.*security\|FIXME.*security\|XXX.*security" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null; then
    log_warning "Security-related TODOs found"
  fi
  
  if [[ $issues_found -eq 0 ]]; then
    log_success "No sensitive data found in source code"
  fi
  
  return $issues_found
}

# Validate environment configuration
check_environment_config() {
  log_info "Validating environment configuration..."
  
  local issues_found=0
  
  # Check if .env.example exists
  if [[ ! -f ".env.example" ]]; then
    log_error ".env.example file not found"
    return 1
  fi
  
  # Required security environment variables
  local required_vars=(
    "CSRF_SECRET"
    "API_SIGNATURE_SECRET"
    "ADMIN_API_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "RESEND_WEBHOOK_SECRET"
  )
  
  log_verbose "Checking required security environment variables..."
  for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.example; then
      log_error "Missing required environment variable in .env.example: $var"
      issues_found=1
    else
      log_verbose "Found: $var"
    fi
  done
  
  # Check for weak default values
  if grep -q "your_.*_here\|change_me\|password123" .env.example; then
    log_warning "Weak default values found in .env.example"
  fi
  
  if [[ $issues_found -eq 0 ]]; then
    log_success "Environment configuration is valid"
  fi
  
  return $issues_found
}

# Run security-focused linting
run_security_linting() {
  log_info "Running security-focused ESLint..."
  
  # Create temporary security-focused ESLint config
  cat > .eslintrc.security.temp.json << EOF
{
  "extends": [".eslintrc.json"],
  "plugins": ["security"],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "error", 
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error"
  }
}
EOF
  
  # Install security plugin if not available
  if ! npm list eslint-plugin-security &> /dev/null; then
    log_verbose "Installing eslint-plugin-security..."
    npm install --no-save eslint-plugin-security
  fi
  
  # Run security linting
  if npx eslint --config .eslintrc.security.temp.json src/ --ext .ts,.tsx,.js,.jsx --max-warnings 0 2>/dev/null; then
    log_success "Security linting passed"
  else
    log_error "Security linting failed"
    return 1
  fi
  
  # Cleanup temporary config
  rm -f .eslintrc.security.temp.json
}

# Check security functions implementation
check_security_implementation() {
  log_info "Validating security implementation..."
  
  local issues_found=0
  
  # Check middleware security headers
  if [[ -f "src/middleware.ts" ]]; then
    log_verbose "Checking middleware security headers..."
    
    local required_headers=(
      "Content-Security-Policy"
      "X-Frame-Options"
      "X-Content-Type-Options"
      "Referrer-Policy"
    )
    
    for header in "${required_headers[@]}"; do
      if ! grep -q "$header" src/middleware.ts; then
        log_warning "Missing security header in middleware: $header"
        issues_found=1
      fi
    done
  else
    log_error "Middleware file not found: src/middleware.ts"
    issues_found=1
  fi
  
  # Check security protection modules
  local security_modules=(
    "src/lib/security/admin-protection.ts"
    "src/lib/security/rate-limit.ts"
    "src/lib/security/nonce.ts"
    "src/lib/security/sanitize.ts"
  )
  
  log_verbose "Checking security modules..."
  for module in "${security_modules[@]}"; do
    if [[ -f "$module" ]]; then
      log_verbose "Found: $module"
    else
      log_warning "Missing security module: $module"
      issues_found=1
    fi
  done
  
  # Check database security migration
  if [[ -f "supabase/migrations/20251112_security_hardening.sql" ]]; then
    log_verbose "Checking database security migration..."
    if grep -q "ENABLE ROW LEVEL SECURITY" supabase/migrations/20251112_security_hardening.sql; then
      log_verbose "Row Level Security enabled"
    else
      log_error "Row Level Security not found in migration"
      issues_found=1
    fi
  else
    log_error "Database security migration not found"
    issues_found=1
  fi
  
  if [[ $issues_found -eq 0 ]]; then
    log_success "Security implementation validation passed"
  fi
  
  return $issues_found
}

# Run dependency security audit
run_dependency_audit() {
  log_info "Running dependency security audit..."
  
  # Run npm audit
  log_verbose "Running npm audit..."
  if npm audit --audit-level=high --production 2>/dev/null; then
    log_success "npm audit passed"
  else
    log_warning "npm audit found issues"
    if [[ "$VERBOSE" == "true" ]]; then
      npm audit --audit-level=high --production
    fi
  fi
  
  # Check for audit-ci if available
  if command -v npx &> /dev/null && [[ -f "audit-ci.json" ]]; then
    log_verbose "Running audit-ci..."
    if npx audit-ci --config audit-ci.json 2>/dev/null; then
      log_success "audit-ci passed"
    else
      log_warning "audit-ci found issues"
    fi
  fi
}

# Test build with security validation
test_build() {
  log_info "Testing build with security validation..."
  
  # Create test environment
  cat > .env.test.temp << EOF
# Test environment for security validation
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_anon_key_32_chars_minimum_length
SUPABASE_SERVICE_ROLE_KEY=test_service_role_key_64_chars_minimum_length_for_security
CSRF_SECRET=test_csrf_secret_32_chars_minimum
API_SIGNATURE_SECRET=test_api_signature_secret_32_chars
ADMIN_API_SECRET_KEY=test_admin_api_secret_key_64_chars_minimum_for_security_validation
STRIPE_WEBHOOK_SECRET=test_stripe_webhook_secret_32_chars
RESEND_WEBHOOK_SECRET=test_resend_webhook_secret_32_chars
FORCE_HTTPS=true
NODE_ENV=production
EOF
  
  # Set environment
  export $(cat .env.test.temp | xargs)
  
  # Run build
  if npm run build >/dev/null 2>&1; then
    log_success "Build completed successfully"
  else
    log_error "Build failed"
    rm -f .env.test.temp
    return 1
  fi
  
  # Check build artifacts for secrets
  log_verbose "Checking build artifacts for secrets..."
  if find .next -name "*.js" -exec grep -l "test_.*_secret\|test_.*_key" {} \; 2>/dev/null | head -1; then
    log_warning "Test secrets found in build artifacts"
  fi
  
  # Cleanup
  rm -f .env.test.temp
  unset NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
  unset CSRF_SECRET API_SIGNATURE_SECRET ADMIN_API_SECRET_KEY
  unset STRIPE_WEBHOOK_SECRET RESEND_WEBHOOK_SECRET FORCE_HTTPS NODE_ENV
}

# Generate security report
generate_report() {
  local total_checks=$1
  local failed_checks=$2
  
  log_info "Generating security report..."
  
  cat > security-report.txt << EOF
=================================================
AIOHub Security Validation Report
=================================================

Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Total Checks: $total_checks
Failed Checks: $failed_checks
Status: $([ $failed_checks -eq 0 ] && echo "PASS" || echo "FAIL")

=================================================
Checks Performed:
=================================================

1. Prerequisites Check
2. Sensitive Data Scan  
3. Environment Configuration
4. Security Linting
5. Security Implementation
6. Dependency Audit
7. Build Validation

=================================================
Recommendations:
=================================================

- 🔒 Ensure all environment variables are properly configured
- 🛡️ Review admin API protection settings
- 📊 Monitor security audit logs regularly  
- 🔄 Update dependencies regularly
- 🧪 Run security tests before deployment
- 📝 Review code for security best practices

EOF

  if [[ "$VERBOSE" == "true" ]]; then
    cat security-report.txt
  fi
  
  log_success "Security report generated: security-report.txt"
}

# Main execution
main() {
  echo "======================================"
  echo "🔒 AIOHub Security Validation"
  echo "======================================"
  echo ""
  
  local total_checks=7
  local failed_checks=0
  
  # Run all security checks
  check_project_root
  
  check_prerequisites || ((failed_checks++))
  
  install_dependencies
  
  check_sensitive_data || ((failed_checks++))
  
  check_environment_config || ((failed_checks++))
  
  run_security_linting || ((failed_checks++))
  
  check_security_implementation || ((failed_checks++))
  
  run_dependency_audit || ((failed_checks++))
  
  test_build || ((failed_checks++))
  
  # Generate report
  generate_report $total_checks $failed_checks
  
  echo ""
  echo "======================================"
  if [[ $failed_checks -eq 0 ]]; then
    log_success "All security checks passed! 🎉"
    echo "======================================"
    exit 0
  else
    log_error "$failed_checks/$total_checks security checks failed"
    echo "======================================"
    exit 1
  fi
}

# Run main function
main "$@"