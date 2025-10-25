# Socratit.ai - Production Deployment Guide

## Overview

This guide walks you through deploying the Socratit.ai educational platform to production using **Railway (Backend)** and **Vercel (Frontend)**. This is the recommended deployment strategy for startups and small-to-medium scale applications.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL (Frontend CDN)                       │
│              React App + Static Assets                       │
│                  Port: 443 (HTTPS)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              RAILWAY (Backend Services)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js API Server (Node.js)                     │   │
│  │  Port: 3001 | WebSocket: Socket.io                   │   │
│  └──────────────┬──────────────────┬───────────────────┘   │
│                 │                  │                         │
│  ┌──────────────▼─────┐  ┌────────▼───────────┐            │
│  │  PostgreSQL 15      │  │  Redis 7 (Cache)   │            │
│  │  (Primary Database) │  │  (Optional)        │            │
│  └────────────────────┘  └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
│  - AWS SES (Email Delivery)                                  │
│  - OpenAI API (AI Teaching Assistant)                        │
│  - AWS S3 (File Storage - Optional)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before you begin, ensure you have:

- [ ] GitHub account (for code repository)
- [ ] Railway account (sign up at https://railway.app)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] AWS account (for SES email service)
- [ ] OpenAI API key (from https://platform.openai.com)
- [ ] Domain name (optional, but recommended for production)

---

## Part 1: Repository Setup

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `socratit-ai` (or your preferred name)
3. **Do NOT initialize** with README, .gitignore, or license (we'll push existing code)
4. Click "Create repository"

### Step 2: Push Your Code to GitHub

From your local project directory:

```bash
# Verify git is initialized (already done)
git status

# Create .gitignore
# (see .gitignore section below)

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Socratit.ai platform ready for deployment"

# Add remote repository (replace with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/socratit-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Part 2: Backend Deployment (Railway)

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Authenticate with GitHub and select your `socratit-ai` repository
5. Railway will detect your Dockerfile automatically

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL 15 database
4. Copy the `DATABASE_URL` connection string (you'll need this in Step 4)

### Step 3: Add Redis (Optional but Recommended)

1. Click "+ New" again
2. Select "Database" → "Redis"
3. Railway will provision a Redis 7 instance
4. Copy the `REDIS_URL` connection string

### Step 4: Configure Environment Variables

In your Railway backend service, go to **Variables** tab and add:

#### Required Variables:

```bash
# Node.js Environment
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Database (automatically provided by Railway)
DATABASE_URL=${Railway PostgreSQL DATABASE_URL}

# JWT Secrets (GENERATE NEW SECURE VALUES!)
JWT_ACCESS_SECRET=<generate-a-strong-random-secret-256-chars>
JWT_REFRESH_SECRET=<generate-a-different-strong-random-secret-256-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Email Service (AWS SES)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>

# Redis (if using Railway Redis)
REDIS_ENABLED=true
REDIS_HOST=${Railway Redis REDIS_HOST}
REDIS_PORT=${Railway Redis REDIS_PORT}
REDIS_PASSWORD=${Railway Redis REDIS_PASSWORD}

# Frontend URL (will update after deploying frontend)
FRONTEND_URL=https://your-app-name.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenAI API
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-3.5-turbo

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
AWS_S3_BUCKET=socratit-files-production

# Security
BCRYPT_ROUNDS=12
EMAIL_VERIFICATION_EXPIRY=3600000
PASSWORD_RESET_EXPIRY=3600000

# Compliance
AUDIT_LOG_RETENTION_DAYS=2555
UNVERIFIED_ACCOUNT_CLEANUP_DAYS=7
```

#### How to Generate JWT Secrets:

Run in your terminal:
```bash
# Generate access secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate refresh secret (run again for different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Configure Build Settings

1. Go to **Settings** tab in Railway
2. Set **Root Directory**: `socratit-backend`
3. Set **Start Command**: `sh -c "npx prisma migrate deploy && node dist/index.js"`
4. Railway will use your Dockerfile for building

### Step 6: Deploy Backend

1. Railway will automatically deploy when you push to GitHub
2. Monitor deployment logs in the **Deployments** tab
3. Once deployed, click on your service to get the public URL
4. Your backend URL will be something like: `https://socratit-backend-production.up.railway.app`

### Step 7: Verify Backend Health

Test your backend endpoints:

```bash
# Health check
curl https://your-backend-url.railway.app/health

# Readiness check
curl https://your-backend-url.railway.app/ready
```

Expected response:
```json
{
  "success": true,
  "message": "Server is ready",
  "database": "connected",
  "environment": "production"
}
```

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your `socratit-ai` repository from GitHub
4. Vercel will auto-detect it as a Create React App

### Step 2: Configure Build Settings

In the project setup:

- **Framework Preset**: Create React App
- **Root Directory**: `socratit-wireframes`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `build` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 3: Add Environment Variables

In Vercel project settings → **Environment Variables**:

```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

Replace `your-backend-url.railway.app` with your actual Railway backend URL from Part 2, Step 6.

### Step 4: Deploy Frontend

1. Click "Deploy"
2. Vercel will build and deploy your React app
3. Deployment typically takes 2-3 minutes
4. Your app will be available at: `https://your-app-name.vercel.app`

### Step 5: Update Backend FRONTEND_URL

Go back to Railway and update the `FRONTEND_URL` environment variable:

```bash
FRONTEND_URL=https://your-app-name.vercel.app
```

This ensures CORS is properly configured for your production frontend.

---

## Part 4: External Services Setup

### AWS SES (Email Service)

1. Go to AWS Console → SES
2. Verify your sending domain or email address
3. Request production access (remove sandbox limits)
4. Create IAM user with SES send permissions
5. Generate access keys
6. Add credentials to Railway environment variables

### OpenAI API

1. Go to https://platform.openai.com
2. Create API key
3. Add to Railway as `OPENAI_API_KEY`
4. Set usage limits to prevent unexpected charges

### AWS S3 (File Storage - Optional)

1. Create S3 bucket for file uploads
2. Configure CORS policy to allow your frontend domain
3. Create IAM user with S3 access
4. Add credentials to Railway environment variables

---

## Part 5: Custom Domain (Optional)

### For Frontend (Vercel):

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `app.socratit.ai`)
3. Update DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

### For Backend (Railway):

1. Go to Railway service → Settings → Networking
2. Add custom domain (e.g., `api.socratit.ai`)
3. Update DNS CNAME record to Railway's endpoint
4. SSL certificate is automatically provisioned

### Update Environment Variables:

After setting custom domains, update:

**Railway (Backend)**:
```bash
FRONTEND_URL=https://app.socratit.ai
```

**Vercel (Frontend)**:
```bash
REACT_APP_API_URL=https://api.socratit.ai
```

---

## Part 6: Database Setup

### Initial Migration

Railway will automatically run `npx prisma migrate deploy` on startup (configured in Dockerfile CMD).

### Seed Database (Optional)

If you want to seed initial data:

1. Go to Railway project → Backend service
2. Click on "..." → "Open Shell"
3. Run:
```bash
npm run prisma:seed
```

### Database Management

Access Prisma Studio:
```bash
# In Railway shell
npx prisma studio
```

Or connect using any PostgreSQL client with the `DATABASE_URL`.

---

## Part 7: Testing & Verification

### Backend Tests:

1. **Health Check**: `https://api.yourdomain.com/health`
2. **Readiness**: `https://api.yourdomain.com/ready`
3. **API Endpoint**: `https://api.yourdomain.com/api/v1/auth/login`

### Frontend Tests:

1. Visit your frontend URL
2. Test user registration and login
3. Verify email delivery (check spam folder)
4. Test creating a class (teacher account)
5. Test joining a class (student account)
6. Test AI Teaching Assistant chat
7. Test file upload functionality
8. Test real-time notifications

### WebSocket Test:

Open browser console on frontend and check for:
```
[WebSocket] Connected to server
```

---

## Part 8: Monitoring & Maintenance

### Railway Monitoring

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: CPU, Memory, Network usage
- **Alerts**: Set up alerts for service downtime

### Vercel Monitoring

- **Analytics**: Built-in Web Analytics
- **Logs**: Real-time function logs
- **Performance**: Core Web Vitals monitoring

### Database Backups

Railway provides automatic daily backups. To create manual backup:

1. Go to PostgreSQL service
2. Click "..." → "Backup"

### Recommended Monitoring Tools (Optional)

- **Sentry**: Error tracking and monitoring
- **LogRocket**: Session replay and debugging
- **Uptime Robot**: Uptime monitoring
- **DataDog**: Application performance monitoring

---

## Scaling Considerations

### When to Scale:

- Backend CPU/Memory usage consistently > 70%
- Database queries slowing down
- User count exceeds 1,000 concurrent users

### How to Scale on Railway:

1. **Vertical Scaling**: Increase CPU/Memory in service settings
2. **Horizontal Scaling**: Enable multiple instances (requires Redis for Socket.io)
3. **Database Scaling**: Upgrade to larger PostgreSQL plan

### Socket.io Multi-Instance Setup:

When running multiple backend instances, add Redis adapter:

```typescript
// In websocket.service.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## Cost Estimates

### Railway (Backend + Database):

- **Starter**: $5/month (500MB RAM, shared CPU)
- **Developer**: $20/month (8GB RAM, 8 vCPUs shared)
- **PostgreSQL**: Included in plan
- **Redis**: Included in plan

### Vercel (Frontend):

- **Hobby**: Free (100GB bandwidth, no commercial use)
- **Pro**: $20/month (1TB bandwidth, commercial use allowed)

### External Services:

- **AWS SES**: ~$0.10 per 1,000 emails
- **OpenAI API**: ~$0.002 per 1K tokens (gpt-3.5-turbo)
- **AWS S3**: ~$0.023 per GB/month

**Total Estimated Monthly Cost**: $25-50/month for up to 1,000 active users

---

## Troubleshooting

### Backend Not Starting

1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is correct
4. Check Prisma migrations ran successfully

### Frontend Can't Connect to Backend

1. Verify `REACT_APP_API_URL` is correct in Vercel
2. Check CORS configuration in backend (`FRONTEND_URL`)
3. Ensure backend is deployed and healthy (`/health` endpoint)

### Database Connection Errors

1. Verify `DATABASE_URL` format
2. Check Railway PostgreSQL service is running
3. Ensure migrations ran successfully
4. Check database connection limits

### Email Not Sending

1. Verify AWS SES credentials
2. Check email addresses are verified in SES
3. Ensure SES is out of sandbox mode
4. Check Railway logs for email errors

### WebSocket Not Connecting

1. Verify Socket.io CORS configuration
2. Check JWT token is being sent from frontend
3. Ensure backend WebSocket is initialized
4. Check browser console for connection errors

---

## Security Checklist

Before going live:

- [ ] Changed all default JWT secrets
- [ ] AWS SES credentials secured
- [ ] OpenAI API key secured
- [ ] Database password is strong
- [ ] Redis password is set (if using)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Helmet.js security headers enabled
- [ ] SSL/HTTPS enabled (automatic with Vercel/Railway)
- [ ] Environment variables not committed to Git
- [ ] Audit logging enabled
- [ ] Error messages don't expose sensitive data

---

## Next Steps

1. Set up continuous deployment (auto-deploy on git push)
2. Configure custom domain with SSL
3. Set up monitoring and alerts
4. Create backup strategy
5. Document API endpoints
6. Set up staging environment
7. Configure CI/CD pipeline with tests
8. Plan for horizontal scaling when needed

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.io Docs**: https://socket.io/docs/v4/

---

## Deployment Checklist Summary

### Pre-Deployment:
- [x] Git repository initialized
- [x] Code pushed to GitHub
- [x] .gitignore configured
- [x] Environment variables documented

### Backend (Railway):
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Redis added (optional)
- [ ] Environment variables configured
- [ ] JWT secrets generated
- [ ] Backend deployed successfully
- [ ] Health check endpoint verified
- [ ] Database migrations ran

### Frontend (Vercel):
- [ ] Vercel project created
- [ ] Root directory set to `socratit-wireframes`
- [ ] Environment variables configured
- [ ] Frontend deployed successfully
- [ ] Can access login page

### External Services:
- [ ] AWS SES configured and verified
- [ ] OpenAI API key added
- [ ] File storage configured (S3 or local)

### Final Steps:
- [ ] Backend `FRONTEND_URL` updated with Vercel URL
- [ ] Frontend can connect to backend API
- [ ] User registration works
- [ ] Email verification works
- [ ] Login/logout works
- [ ] WebSocket connection works
- [ ] AI Teaching Assistant works
- [ ] File uploads work
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Backups configured

---

**Congratulations!** Your Socratit.ai platform is now live in production! 🚀

For issues or questions, refer to the Troubleshooting section or check the platform documentation.
