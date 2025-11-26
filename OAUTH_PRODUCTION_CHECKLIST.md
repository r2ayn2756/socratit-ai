# OAuth Production Deployment Checklist

## 🚀 Quick Setup for Production

### 1️⃣ Install Packages (Backend)
```bash
cd socratit-backend
npm install passport passport-google-oauth20 passport-microsoft
npm install --save-dev @types/passport @types/passport-google-oauth20 @types/passport-microsoft
```

### 2️⃣ Set Railway Environment Variables
Go to Railway → socratit-backend → Variables and add:

```env
BACKEND_URL=https://socratit-ai-production.up.railway.app
FRONTEND_URL=https://socratit-ai.vercel.app
GOOGLE_CLIENT_ID=<from_google_cloud_console>
GOOGLE_CLIENT_SECRET=<from_google_cloud_console>
MICROSOFT_CLIENT_ID=<from_azure_portal>
MICROSOFT_CLIENT_SECRET=<from_azure_portal>
```

### 3️⃣ Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized JavaScript origins:
   - `https://socratit-ai.vercel.app`
   - `https://socratit.com` (if using custom domain)
4. Add Authorized redirect URIs:
   - `https://socratit-ai-production.up.railway.app/api/v1/auth/google/callback`
5. Save Client ID and Secret → Add to Railway

### 4️⃣ Azure Portal Setup
1. Go to [Azure Portal](https://portal.azure.com/) → Azure Active Directory → App registrations
2. Register application (Accounts in any org directory + personal Microsoft accounts)
3. Go to Authentication → Add redirect URI:
   - `https://socratit-ai-production.up.railway.app/api/v1/auth/microsoft/callback`
4. Enable ID tokens under Implicit grant
5. Go to Certificates & secrets → New client secret
6. Save Application (client) ID and Secret → Add to Railway

### 5️⃣ Test Production
1. Visit: `https://socratit-ai.vercel.app/login`
2. Click Google or Microsoft button
3. Authenticate with your account
4. Should redirect back to your dashboard

---

## ✅ Verification Commands

### Check Railway Variables
```bash
# In Railway dashboard, verify these variables exist:
BACKEND_URL ✓
FRONTEND_URL ✓
GOOGLE_CLIENT_ID ✓
GOOGLE_CLIENT_SECRET ✓
MICROSOFT_CLIENT_ID ✓
MICROSOFT_CLIENT_SECRET ✓
```

### Test OAuth Endpoints
```bash
# These should redirect to OAuth provider login:
curl -I https://socratit-ai-production.up.railway.app/api/v1/auth/google
curl -I https://socratit-ai-production.up.railway.app/api/v1/auth/microsoft
```

---

## 🔧 Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| **redirect_uri_mismatch** | Verify redirect URI in OAuth console exactly matches: `https://socratit-ai-production.up.railway.app/api/v1/auth/google/callback` |
| **Wrong redirect after login** | Check `FRONTEND_URL` in Railway is `https://socratit-ai.vercel.app` (NOT localhost) |
| **CORS error** | Backend already configured for Vercel URLs - check Railway logs |
| **Invalid client** | Verify Client ID/Secret in Railway match OAuth console |
| **Cannot GET /auth/callback** | Frontend route already configured - check Vercel deployment |

---

## 📊 OAuth Flow Diagram

```
User clicks "Google/Microsoft" on login page
    ↓
Frontend redirects to: backend.railway.app/auth/google
    ↓
Backend redirects to: Google/Microsoft login page
    ↓
User authenticates with Google/Microsoft
    ↓
OAuth provider redirects to: backend.railway.app/auth/google/callback
    ↓
Backend processes OAuth, creates session, generates JWT tokens
    ↓
Backend redirects to: frontend.vercel.app/auth/callback?token=xxx&user=xxx
    ↓
Frontend stores tokens, updates auth context
    ↓
Frontend redirects to appropriate dashboard
    ✓ User is logged in!
```

---

## 🎯 URL Summary

| Purpose | Development | Production |
|---------|-------------|------------|
| Frontend | `http://localhost:3000` | `https://socratit-ai.vercel.app` |
| Backend | `http://localhost:3001` | `https://socratit-ai-production.up.railway.app` |
| OAuth Callback | `localhost:3001/api/v1/auth/google/callback` | `railway.app/api/v1/auth/google/callback` |
| Frontend Callback | `localhost:3000/auth/callback` | `vercel.app/auth/callback` |

---

## 📝 Notes

- **Frontend is already deployed** ✅ - OAuth buttons and callback page are live on Vercel
- **Backend code is ready** ✅ - Just needs npm packages installed and OAuth credentials configured
- **Users created via OAuth** default to TEACHER role with auto-generated school
- **Email is pre-verified** for OAuth users (verified by provider)
- **No password** stored for OAuth users

---

For detailed step-by-step instructions, see [OAUTH_SETUP_INSTRUCTIONS.md](OAUTH_SETUP_INSTRUCTIONS.md)
