# 📧 Email Authentication Troubleshooting Guide

**Last Updated:** 2025-09-23  
**Purpose:** Production email delivery troubleshooting and configuration reference

---

## 🎯 Quick Diagnosis

### Common Issues
1. **Redirect to localhost in auth emails** → Check environment configuration
2. **Email not delivered** → Check Supabase SMTP settings 
3. **Email confirmed but still can't login** → Check user confirmation status
4. **Rate limiting errors** → Check Supabase quotas and rate limits

---

## 🔧 Supabase Dashboard Configuration

### Required Settings for Production

#### 1. Authentication → Emails → SMTP Settings
```
✅ Enable Custom SMTP: OFF
   (Use Supabase built-in email delivery)
```

#### 2. Authentication → URL Configuration
```
Site URL: https://aiohub.jp
Redirect URLs: 
  - https://aiohub.jp/*
  - https://aiohub.jp/auth/confirm
  - https://aiohub.jp/auth/reset-password-confirm
Default redirect URL: https://aiohub.jp
```

**❌ NEVER include localhost URLs in production:**
- ~~http://localhost:3000/*~~
- ~~http://localhost:3001/*~~

#### 3. Authentication → Templates
```
Confirm signup template: {{ .ConfirmationURL }}
Reset password template: {{ .ConfirmationURL }}
```
**Note:** Templates use Supabase variables - do not modify unless necessary

---

## 🌍 Environment Variables

### Production (Vercel)
```bash
NEXT_PUBLIC_APP_URL=https://aiohub.jp
```

### Preview (Vercel) 
```bash
NEXT_PUBLIC_APP_URL=https://aiohub.jp
```

### Development (Local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ⚠️ Critical Rules
1. **NEVER** set `NEXT_PUBLIC_APP_URL` to localhost in production
2. **ALWAYS** use HTTPS in production
3. **Remove trailing slashes** from APP_URL values

---

## 🚨 Troubleshooting Steps

### Issue: Auth emails contain localhost redirect

#### Step 1: Verify Environment Variables
```bash
# Check current production environment
curl https://aiohub.jp/api/ops/env-check

# Should return:
{
  "appUrlConfigured": true,
  "appUrlIsProduction": true,
  "isProduction": true
}
```

#### Step 2: Check Supabase Dashboard
1. Go to Authentication → URL Configuration
2. Verify Site URL = `https://aiohub.jp`
3. Verify no localhost entries in Redirect URLs
4. Save if changes needed

#### Step 3: Test Email Generation
```bash
# Test password reset (replace with real email)
curl -X POST https://aiohub.jp/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yourdomain.com"}'

# Check email for correct redirect URL
```

### Issue: Emails not being delivered

#### Step 1: Check Supabase Email Delivery
1. Supabase Dashboard → Authentication → Users
2. Try "Resend confirmation" for a test user
3. Check if email is delivered

#### Step 2: Verify SMTP Settings
1. Go to Authentication → Emails → SMTP Settings
2. Ensure "Enable Custom SMTP" is **OFF**
3. Supabase built-in delivery should be active

#### Step 3: Check Rate Limits
1. Supabase Dashboard → Settings → API
2. Check current usage for email quotas
3. Wait if rate limited, or upgrade plan if needed

---

## 🔍 Verification Commands

### Environment Check
```bash
# Basic check
curl https://aiohub.jp/api/ops/env-check

# Detailed check (requires admin key)
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
     https://aiohub.jp/api/ops/env-check
```

### Email System Test
```bash
# Full email system test
curl -X POST https://aiohub.jp/api/ops/email/test \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "test@yourdomain.com"}'
```

### Build Verification
```bash
# Verify production build
npm run build

# Check for localhost references
grep -r "localhost" src/ --exclude-dir=node_modules
# Should only show development fallbacks
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] `NEXT_PUBLIC_APP_URL=https://aiohub.jp` set in Vercel
- [ ] Supabase Site URL = `https://aiohub.jp`
- [ ] Supabase Redirect URLs contain `https://aiohub.jp/*`
- [ ] No localhost references in Supabase config
- [ ] Build passes: `npm run build`

### Post-Deployment
- [ ] Environment check passes: `/api/ops/env-check`
- [ ] Test signup with real email
- [ ] Verify email contains `https://aiohub.jp` redirect
- [ ] Test full auth flow: signup → email → confirm → login

**Generated:** 2025-09-23  
**Maintainer:** Development Team  
**Version:** 1.0
