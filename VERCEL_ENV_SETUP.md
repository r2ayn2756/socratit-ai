# Vercel Environment Variables Setup

## Custom Domain Configuration

After changing from `socratit-ai.vercel.app` to your custom domain `socratit.com`, you need to update environment variables in Vercel.

---

## Frontend (socratit-wireframes) - Vercel Environment Variables

Go to your Vercel project settings → Environment Variables and add/update:

### Production Environment

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `REACT_APP_API_URL` | `https://your-backend-url.com/api/v1` | Your deployed backend URL |

**Example:**
```
REACT_APP_API_URL=https://api.socratit.com/api/v1
```

OR if backend is on a different service (Railway, Render, etc.):
```
REACT_APP_API_URL=https://socratit-backend.railway.app/api/v1
```

### Preview Environment (Optional)

Same as production, or point to a staging backend:
```
REACT_APP_API_URL=https://staging-api.socratit.com/api/v1
```

### Development Environment (Optional)

```
REACT_APP_API_URL=http://localhost:3001/api/v1
```

---

## Backend Environment Variables

Your backend needs to know which domains to allow. Update these in your backend hosting (Railway, Render, etc.):

### Required Variables

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `FRONTEND_URL` | `https://socratit.com` | Your custom domain |
| `NODE_ENV` | `production` | Environment mode |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Strict for production |

### Full Example Backend .env for Production

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://socratit.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# JWT Secrets (CHANGE THESE!)
JWT_ACCESS_SECRET=your-secure-random-secret-here
JWT_REFRESH_SECRET=your-secure-random-secret-here

# Email
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Rate Limiting (strict for production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenAI
OPENAI_API_KEY=your-openai-key
```

---

## Steps to Update Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard

2. **Click on your project** (`socratit-wireframes` or similar)

3. **Go to Settings → Environment Variables**

4. **Add/Update `REACT_APP_API_URL`**
   - Click "Add New"
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend-url/api/v1`
   - Select environments: Production, Preview (optional)
   - Click "Save"

5. **Redeploy the frontend**
   - Go to Deployments tab
   - Click "..." menu on latest deployment
   - Select "Redeploy"
   - OR push a new commit to trigger auto-deploy

---

## Backend CORS Update

The backend code has been updated to allow:
- ✅ `https://socratit.com`
- ✅ `https://www.socratit.com`
- ✅ `https://socratit-ai.vercel.app` (backward compatible)
- ✅ All Vercel preview URLs

**Make sure to deploy the updated backend code!**

---

## Common Issues & Fixes

### Issue: CORS errors on custom domain

**Symptoms:**
- "Access to fetch has been blocked by CORS policy"
- "No 'Access-Control-Allow-Origin' header"

**Fix:**
1. Verify backend CORS includes your domain
2. Check `FRONTEND_URL` environment variable
3. Ensure HTTPS is used (not HTTP)
4. Redeploy backend after CORS changes

### Issue: API calls fail with 404

**Symptoms:**
- Network tab shows 404 errors
- "Cannot GET /api/v1/..."

**Fix:**
1. Check `REACT_APP_API_URL` is set in Vercel
2. Verify the URL includes `/api/v1`
3. Ensure backend is deployed and running
4. Check backend URL is accessible

### Issue: Authentication not working

**Symptoms:**
- Login works but immediately logs out
- "401 Unauthorized" on subsequent requests

**Fix:**
1. Check cookies are allowed for your domain
2. Verify `credentials: true` in CORS
3. Ensure HTTPS is used (cookies won't work on HTTP in production)

---

## Verification Steps

After deploying:

1. **Test the custom domain:**
   ```
   https://socratit.com
   ```

2. **Open browser DevTools → Network tab**
   - Should see API calls going to your backend
   - No CORS errors

3. **Test login:**
   - Should work without errors
   - Token should be stored properly

4. **Test a protected route:**
   - Navigate to dashboard
   - Should load without 401 errors

---

## Quick Checklist

- [ ] Updated backend CORS to include custom domain
- [ ] Set `REACT_APP_API_URL` in Vercel environment variables
- [ ] Deployed updated backend code
- [ ] Redeployed frontend on Vercel
- [ ] Tested custom domain loads
- [ ] Tested API calls work (no CORS errors)
- [ ] Tested login/authentication works
- [ ] Verified in production (not just preview)
