# OAuth Setup Instructions for Socratit.ai

This document contains all the manual steps required to complete the Google and Microsoft OAuth integration.

## 🎯 Overview

The codebase is now ready for OAuth authentication with Google and Microsoft. However, you need to complete the following manual steps:

---

## 📦 Step 1: Install NPM Packages (Backend)

Navigate to the backend directory and install the required OAuth packages:

```bash
cd socratit-backend
npm install passport passport-google-oauth20 passport-microsoft
npm install --save-dev @types/passport @types/passport-google-oauth20
```

### Expected Packages:
- `passport` - Authentication middleware for Node.js
- `passport-google-oauth20` - Google OAuth 2.0 strategy for Passport
- `passport-microsoft` - Microsoft OAuth strategy for Passport
- `@types/passport` - TypeScript types for Passport
- `@types/passport-google-oauth20` - TypeScript types for Google OAuth strategy

---

## 🔑 Step 2: Create Google OAuth Credentials

### 2.1 Go to Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" → "Credentials"

### 2.2 Configure OAuth Consent Screen
1. Click "Configure Consent Screen"
2. Select "External" user type
3. Fill in the required information:
   - App name: **Socratit.ai**
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Save and continue

### 2.3 Create OAuth 2.0 Client ID
1. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: **Web application**
3. Name: **Socratit.ai OAuth**
4. Authorized JavaScript origins:
   - Development: `http://localhost:3000`
   - Production Frontend: `https://socratit-ai.vercel.app`
   - Production Custom Domain: `https://socratit.com` (if applicable)
   - Production Custom Domain: `https://dydactyc.com` (if applicable)
5. Authorized redirect URIs:
   - Development: `http://localhost:3001/api/v1/auth/google/callback`
   - Production: `https://socratit-ai-production.up.railway.app/api/v1/auth/google/callback`
6. Click "Create"
7. **Save the Client ID and Client Secret** - you'll need these for environment variables

---

## 🔑 Step 3: Create Microsoft OAuth Credentials

### 3.1 Go to Azure Portal
1. Navigate to [Azure Portal](https://portal.azure.com/)
2. Go to "Azure Active Directory" → "App registrations"
3. Click "New registration"

### 3.2 Register Application
1. Name: **Socratit.ai**
2. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
3. Redirect URI:
   - Platform: **Web**
   - Development: `http://localhost:3001/api/v1/auth/microsoft/callback`
4. Click "Register"

### 3.3 Configure Authentication Settings
1. In your app registration, go to "Authentication"
2. Under "Platform configurations", add web platform if not already added
3. Under "Redirect URIs", add:
   - Development: `http://localhost:3001/api/v1/auth/microsoft/callback`
   - Production: `https://socratit-ai-production.up.railway.app/api/v1/auth/microsoft/callback`
4. Under "Front-channel logout URL", leave empty
5. Under "Implicit grant and hybrid flows", check:
   - ✅ ID tokens (used for implicit and hybrid flows)
6. Save

### 3.4 Create Client Secret
1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: **OAuth Secret**
4. Expiration: Choose appropriate duration (recommended: 24 months)
5. Click "Add"
6. **Copy the secret value immediately** - you can't view it again!

### 3.5 Get Application (Client) ID
1. Go to "Overview" tab
2. **Copy the "Application (client) ID"** - this is your Client ID

---

## 🌍 Step 4: Update Environment Variables

### 4.1 Backend Environment Variables

Update your `.env` file in `socratit-backend/` with the following:

```env
# Backend URL
BACKEND_URL=http://localhost:3001  # Development
# BACKEND_URL=https://socratit-ai-production.up.railway.app  # Production

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
```

### 4.2 Production Environment (Railway)

In your Railway backend project settings, add these environment variables:

```
BACKEND_URL=https://socratit-ai-production.up.railway.app
FRONTEND_URL=https://socratit-ai.vercel.app
GOOGLE_CLIENT_ID=<your_production_google_client_id>
GOOGLE_CLIENT_SECRET=<your_production_google_client_secret>
MICROSOFT_CLIENT_ID=<your_production_microsoft_client_id>
MICROSOFT_CLIENT_SECRET=<your_production_microsoft_client_secret>
```

**IMPORTANT:** The `FRONTEND_URL` must match your Vercel deployment URL. After OAuth completes, users will be redirected to:
`${FRONTEND_URL}/auth/callback?token=...&refreshToken=...&user=...`

**For Custom Domains:**
If you're using `socratit.com` or `dydactyc.com`, update `FRONTEND_URL` accordingly:
```
FRONTEND_URL=https://socratit.com
# or
FRONTEND_URL=https://dydactyc.com
```

---

## ✅ Step 5: Test the OAuth Flow

### 5.1 Start the Development Servers

**Backend:**
```bash
cd socratit-backend
npm run dev
```

**Frontend:**
```bash
cd socratit-wireframes
npm start
```

### 5.2 Test Google OAuth
1. Navigate to `http://localhost:3000/login`
2. Click the "Google" button
3. You should be redirected to Google's OAuth consent screen
4. Log in with a Google account
5. You should be redirected back to the appropriate dashboard

### 5.3 Test Microsoft OAuth
1. Navigate to `http://localhost:3000/login`
2. Click the "Microsoft" button
3. You should be redirected to Microsoft's OAuth consent screen
4. Log in with a Microsoft account
5. You should be redirected back to the appropriate dashboard

---

## 🌐 Production Deployment Configuration

### Understanding the OAuth Flow URLs

The OAuth flow involves THREE URLs that must all be configured correctly:

1. **Frontend URL** (where user clicks the OAuth button):
   - Development: `http://localhost:3000/login`
   - Production: `https://socratit-ai.vercel.app/login` (or your custom domain)

2. **Backend OAuth Initiation** (where the frontend redirects to start OAuth):
   - Development: `http://localhost:3001/api/v1/auth/google` (or `/auth/microsoft`)
   - Production: `https://socratit-ai-production.up.railway.app/api/v1/auth/google`

3. **Backend OAuth Callback** (where Google/Microsoft sends the user after authentication):
   - Development: `http://localhost:3001/api/v1/auth/google/callback`
   - Production: `https://socratit-ai-production.up.railway.app/api/v1/auth/google/callback`

4. **Frontend Callback** (where the backend redirects after processing OAuth):
   - Development: `http://localhost:3000/auth/callback?token=...`
   - Production: `https://socratit-ai.vercel.app/auth/callback?token=...`

### Key Environment Variables by Service

**Railway Backend:**
```env
BACKEND_URL=https://socratit-ai-production.up.railway.app
FRONTEND_URL=https://socratit-ai.vercel.app  # CRITICAL: Must match your Vercel URL
GOOGLE_CLIENT_ID=<your_client_id>
GOOGLE_CLIENT_SECRET=<your_client_secret>
MICROSOFT_CLIENT_ID=<your_client_id>
MICROSOFT_CLIENT_SECRET=<your_client_secret>
```

**Vercel Frontend:**
The frontend automatically uses the correct API URL from environment:
```env
REACT_APP_API_URL=https://socratit-ai-production.up.railway.app/api/v1
```

### Verifying Your Setup

1. **Check Railway Environment Variables:**
   - Go to Railway → Your Backend Project → Variables
   - Ensure `BACKEND_URL` and `FRONTEND_URL` are set correctly

2. **Check OAuth Provider Settings:**
   - Google Cloud Console → Credentials → Your OAuth Client
   - Verify redirect URI: `https://socratit-ai-production.up.railway.app/api/v1/auth/google/callback`
   - Azure Portal → App registrations → Your App → Authentication
   - Verify redirect URI: `https://socratit-ai-production.up.railway.app/api/v1/auth/microsoft/callback`

3. **Test the Production Flow:**
   - Go to `https://socratit-ai.vercel.app/login`
   - Click Google or Microsoft button
   - You should be redirected through OAuth and back to your dashboard

---

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Solution:** Make sure the redirect URI in your OAuth provider console EXACTLY matches the callback URL:

**Development:**
- Google: `http://localhost:3001/api/v1/auth/google/callback`
- Microsoft: `http://localhost:3001/api/v1/auth/microsoft/callback`

**Production:**
- Google: `https://socratit-ai-production.up.railway.app/api/v1/auth/google/callback`
- Microsoft: `https://socratit-ai-production.up.railway.app/api/v1/auth/microsoft/callback`

### Issue: "Invalid client" Error

**Solution:** Double-check your Client ID and Client Secret in the `.env` file.

### Issue: TypeScript Compilation Errors

**Solution:** Make sure you installed all the TypeScript type definitions:
```bash
npm install --save-dev @types/passport @types/passport-google-oauth20
```

### Issue: CORS Errors

**Solution:** The backend is already configured to accept requests from common origins. Verify these are in `socratit-backend/src/app.ts`:
```javascript
const allowedOrigins = [
  'https://socratit-ai.vercel.app',    // Production
  'https://socratit.com',              // Custom domain
  'https://dydactyc.com',              // Custom domain
  'http://localhost:3000',             // Development
];
```

### Issue: User Gets Redirected to Wrong URL After OAuth

**Symptoms:** After OAuth login, user is redirected to `http://localhost:3000/auth/callback` instead of production URL.

**Solution:**
1. Check Railway environment variable `FRONTEND_URL` - it should be `https://socratit-ai.vercel.app` (not localhost!)
2. The backend uses this variable to redirect users after OAuth: `${env.FRONTEND_URL}/auth/callback`
3. Update Railway variables and redeploy if needed

### Issue: OAuth Works Locally but Not in Production

**Checklist:**
1. ✅ Verify Railway has all OAuth environment variables set
2. ✅ Verify `BACKEND_URL` in Railway matches your Railway deployment URL
3. ✅ Verify `FRONTEND_URL` in Railway matches your Vercel deployment URL
4. ✅ Verify OAuth provider has production redirect URIs configured
5. ✅ Test the production API directly: `https://socratit-ai-production.up.railway.app/api/v1/auth/google`
6. ✅ Check Railway logs for error messages

### Issue: "Cannot GET /auth/callback" Error

**Solution:** This means the frontend route isn't configured. Verify:
1. `socratit-wireframes/src/App.tsx` has the route: `<Route path="/auth/callback" element={<OAuthCallback />} />`
2. The OAuthCallback component is imported correctly
3. Redeploy the frontend to Vercel

---

## 📝 What's Already Implemented

### Frontend Changes:
✅ OAuth buttons added to LoginPage
✅ OAuth buttons added to SignupPage
✅ OAuthCallback page created to handle OAuth redirects
✅ Auth service updated with OAuth helper methods
✅ Route added for `/auth/callback`

### Backend Changes:
✅ Passport configuration file created (`src/config/passport.ts`)
✅ Google OAuth strategy configured
✅ Microsoft OAuth strategy configured
✅ OAuth controller methods added (`googleCallback`, `microsoftCallback`)
✅ OAuth routes added to auth routes
✅ Passport middleware initialized in app.ts
✅ Environment configuration updated with OAuth variables

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Install npm packages in backend
- [ ] Set up Google OAuth credentials
- [ ] Set up Microsoft OAuth credentials
- [ ] Add production redirect URIs to OAuth providers
- [ ] Update production environment variables in Railway
- [ ] Test OAuth flow in development
- [ ] Test OAuth flow in production after deployment

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Passport.js Documentation](http://www.passportjs.org/docs/)

---

## 💡 Notes

1. **Default User Role:** Users signing up via OAuth will be created with the `TEACHER` role by default. They can be updated to `STUDENT` later if needed.

2. **Email Verification:** Users authenticating via OAuth are automatically marked as email verified since the OAuth provider has already verified their email.

3. **No Password for OAuth Users:** Users created via OAuth don't have a password in the database. If they want to set a password later, you may need to implement a "Set Password" feature.

4. **School Assignment:** New OAuth users are automatically assigned to a new auto-generated school. For better organization, consider adding an onboarding flow to collect school information.

---

## ❓ Questions?

If you encounter any issues not covered here, please check:
1. Console logs in the browser (F12 → Console)
2. Backend logs in the terminal
3. Network tab in browser DevTools (F12 → Network)

Good luck with the setup! 🎉
