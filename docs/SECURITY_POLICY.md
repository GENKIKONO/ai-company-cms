# AIOHub Security Policy

**Version:** 1.0.0
**Last Updated:** 2025-01-18
**Classification:** Internal Use

---

## 1. Overview

This document outlines the comprehensive security policies and measures implemented in the AIOHub platform. It covers authentication, authorization, data protection, and incident response procedures.

## 2. Authentication Security

### 2.1 Password Requirements
- Minimum length: 8 characters (12+ recommended)
- Must contain: uppercase, lowercase, numbers, special characters
- Password history: Last 5 passwords cannot be reused
- Maximum age: 90 days (configurable)

### 2.2 Multi-Factor Authentication (MFA)
- **Implementation**: TOTP (Time-based One-Time Password)
- **Compatible Apps**: Google Authenticator, Authy, 1Password
- **Backup Codes**: 10 single-use recovery codes
- **Admin Requirement**: MFA mandatory for site administrators

### 2.3 Session Management
- **Idle Timeout**: 30 minutes of inactivity
- **Absolute Timeout**: 24 hours
- **Concurrent Sessions**: Maximum 5 per user
- **Session Fingerprinting**: Device/browser verification
- **Session Invalidation**: All sessions invalidated on password change

### 2.4 Login Protection
- **Rate Limiting**: 5 attempts per IP per 15 minutes
- **Account Lockout**: Temporary lock after 3 failed attempts per user
- **Anomaly Detection**: Alerts for suspicious login patterns
- **Geographic Monitoring**: Alerts for logins from new locations

## 3. Authorization & Access Control

### 3.1 Role-Based Access Control (RBAC)
```
Site Admin    → Full system access
Org Owner     → Full organization access
Org Admin     → Organization management (no billing)
Org Member    → Standard feature access
Viewer        → Read-only access
```

### 3.2 Row-Level Security (RLS)
- All database tables protected by Supabase RLS policies
- Organization data isolated by `organization_id`
- User data isolated by `user_id`
- Cross-tenant access strictly prohibited

### 3.3 API Authorization
- JWT-based authentication for all API routes
- Bearer token validation on every request
- Scope-based permissions for API keys
- IP allowlist support for admin APIs

## 4. Data Protection

### 4.1 Encryption
- **In Transit**: TLS 1.3 (HTTPS enforced)
- **At Rest**: AES-256 encryption (Supabase managed)
- **Sensitive Data**: Additional application-level encryption for:
  - API keys
  - Webhook secrets
  - OAuth tokens

### 4.2 Data Classification
| Level | Examples | Handling |
|-------|----------|----------|
| Public | Marketing content | No restrictions |
| Internal | Business metrics | Auth required |
| Confidential | User PII | Encrypted, audit logged |
| Restricted | Payment data, passwords | Never stored in plaintext |

### 4.3 GDPR Compliance
- **Data Export** (Article 20): Full user data export via API
- **Data Deletion** (Article 17): Account deletion with data anonymization
- **Consent Management**: Explicit opt-in for data processing
- **Data Retention**: 7-year retention for billing records (legal requirement)

## 5. Security Headers

All responses include the following security headers:

```
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [strict policy]
```

## 6. API Security

### 6.1 Rate Limiting
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public APIs | 60 req | 1 minute |
| Authenticated APIs | 100 req | 1 minute |
| Admin APIs | 30 req | 1 minute |
| Login/Auth | 5 req | 15 minutes |

### 6.2 Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- File upload restrictions (type, size, content validation)

### 6.3 CSRF Protection
- Same-origin policy enforcement
- Origin/Referer header validation
- CSRF tokens for state-changing operations

## 7. Infrastructure Security

### 7.1 Hosting (Vercel)
- Automatic DDoS protection
- Edge network with global distribution
- Automatic SSL certificate management
- Environment variable encryption

### 7.2 Database (Supabase)
- Managed PostgreSQL with daily backups
- Point-in-time recovery (PITR)
- Network isolation
- Connection pooling with PgBouncer

### 7.3 Third-Party Services
- Stripe PCI DSS Level 1 compliance
- OpenAI SOC 2 Type 2 certified
- All integrations via HTTPS only

## 8. Monitoring & Incident Response

### 8.1 Audit Logging
All security-relevant events are logged:
- Authentication events (success/failure)
- Authorization decisions
- Data access (sensitive data)
- Configuration changes
- Admin actions

### 8.2 Alerting
Real-time alerts for:
- Multiple failed login attempts
- Rate limit violations
- Suspicious access patterns
- System errors

### 8.3 Incident Response
1. **Detection**: Automated monitoring + manual reports
2. **Containment**: Immediate isolation of affected systems
3. **Eradication**: Remove threat and patch vulnerabilities
4. **Recovery**: Restore services with verification
5. **Post-Incident**: Root cause analysis and documentation

### 8.4 Data Breach Notification
- Internal notification: Within 1 hour
- User notification: Within 72 hours (GDPR requirement)
- Regulatory notification: As required by jurisdiction

## 9. Development Security

### 9.1 Secure Development Lifecycle
- Code review required for all changes
- Automated security scanning (npm audit)
- TypeScript strict mode for security-critical code
- Dependency updates reviewed monthly

### 9.2 Secret Management
- No secrets in source code
- Environment variables for all credentials
- Vercel environment variable encryption
- Secret rotation procedures documented

### 9.3 CI/CD Security
- Branch protection on main/production
- Required status checks before merge
- Automated tests including security tests
- Deploy previews for review

## 10. Compliance

### 10.1 Current Compliance
- GDPR (EU General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PCI DSS (via Stripe, no direct card handling)

### 10.2 Planned Certifications
- SOC 2 Type 2 (planned)
- ISO 27001 (planned)

## 11. Security Contacts

### Reporting Vulnerabilities
If you discover a security vulnerability, please report it to:
- Email: security@aiohub.jp
- Do NOT disclose publicly until resolved

### Security Team
- Security Lead: [Contact Internal Team]
- Incident Response: [Contact Internal Team]

## 12. Policy Review

This policy is reviewed and updated:
- Quarterly (minimum)
- After any security incident
- When significant system changes occur

---

## Appendix A: Security Checklist

### Pre-Deployment
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] All secrets are in environment variables
- [ ] Rate limiting is configured
- [ ] RLS policies are in place
- [ ] Security headers are configured

### Post-Deployment
- [ ] SSL certificate is valid
- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] Monitoring alerts are configured
- [ ] Backup/recovery tested

## Appendix B: Incident Response Contacts

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| On-Call Engineer | [Internal] | Immediate |
| Security Lead | [Internal] | 15 minutes |
| Management | [Internal] | 1 hour |
| Legal/Compliance | [Internal] | 4 hours |

## Appendix C: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-18 | Initial release |
