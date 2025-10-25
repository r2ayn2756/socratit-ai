# Socratit.ai Deployment Checklist

Use this checklist to ensure all steps are completed before going live.

---

## Pre-Deployment

### Code Repository
- [ ] Git repository initialized
- [ ] `.gitignore` file created
- [ ] All sensitive files excluded (`.env`, `node_modules`, etc.)
- [ ] Code committed to local repository
- [ ] GitHub repository created
- [ ] Code pushed to GitHub (`git push -u origin main`)

### Environment Configuration
- [ ] Backend `.env.example` reviewed
- [ ] Frontend `.env.example` reviewed
- [ ] All required environment variables documented
- [ ] JWT secrets generation method documented
- [ ] AWS credentials ready (SES, S3)
- [ ] OpenAI API key obtained

---

## Backend Deployment (Railway)

### Project Setup
- [ ] Railway account created
- [ ] New project created in Railway
- [ ] GitHub repository connected
- [ ] Root directory set to `socratit-backend`

### Database Setup
- [ ] PostgreSQL database provisioned
- [ ] `DATABASE_URL` copied from Railway
- [ ] Redis cache provisioned (optional)
- [ ] Redis connection string copied

### Environment Variables (Railway Backend)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `API_VERSION=v1`
- [ ] `DATABASE_URL` set (from Railway PostgreSQL)
- [ ] `JWT_ACCESS_SECRET` generated and set (64+ chars)
- [ ] `JWT_REFRESH_SECRET` generated and set (64+ chars)
- [ ] `JWT_ACCESS_EXPIRY=15m`
- [ ] `JWT_REFRESH_EXPIRY=7d`
- [ ] `EMAIL_FROM` set (your sending email)
- [ ] `EMAIL_PROVIDER=ses`
- [ ] `AWS_REGION` set (e.g., us-east-1)
- [ ] `AWS_ACCESS_KEY_ID` set
- [ ] `AWS_SECRET_ACCESS_KEY` set
- [ ] `REDIS_ENABLED` set (true/false)
- [ ] `REDIS_HOST` set (if using Redis)
- [ ] `REDIS_PORT` set (if using Redis)
- [ ] `REDIS_PASSWORD` set (if using Redis)
- [ ] `FRONTEND_URL` set (will update after frontend deploy)
- [ ] `RATE_LIMIT_WINDOW_MS=900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`
- [ ] `OPENAI_API_KEY` set
- [ ] `OPENAI_MODEL=gpt-3.5-turbo`
- [ ] `MAX_FILE_SIZE=10485760`
- [ ] `UPLOAD_DIR=./uploads`
- [ ] `AWS_S3_BUCKET` set (if using S3)
- [ ] `BCRYPT_ROUNDS=12`
- [ ] `EMAIL_VERIFICATION_EXPIRY=3600000`
- [ ] `PASSWORD_RESET_EXPIRY=3600000`
- [ ] `AUDIT_LOG_RETENTION_DAYS=2555`
- [ ] `UNVERIFIED_ACCOUNT_CLEANUP_DAYS=7`

### Build Configuration
- [ ] Build command verified: `npm run build`
- [ ] Start command set: `sh -c "npx prisma migrate deploy && node dist/index.js"`
- [ ] Dockerfile detected and used

### Deployment
- [ ] Backend deployed successfully
- [ ] Deployment logs reviewed (no critical errors)
- [ ] Public URL obtained from Railway
- [ ] Health endpoint tested: `https://YOUR-BACKEND-URL/health`
- [ ] Readiness endpoint tested: `https://YOUR-BACKEND-URL/ready`
- [ ] Database connection verified (readiness check shows "connected")

---

## Frontend Deployment (Vercel)

### Project Setup
- [ ] Vercel account created
- [ ] New project created in Vercel
- [ ] GitHub repository imported
- [ ] Framework preset: Create React App
- [ ] Root directory set to `socratit-wireframes`
- [ ] Build command verified: `npm run build`
- [ ] Output directory verified: `build`

### Environment Variables (Vercel Frontend)
- [ ] `REACT_APP_API_URL` set to Railway backend URL

### Deployment
- [ ] Frontend deployed successfully
- [ ] Build logs reviewed (no errors)
- [ ] Public URL obtained from Vercel
- [ ] Application loads in browser
- [ ] No console errors in browser dev tools

### Post-Frontend Deployment
- [ ] Update Railway `FRONTEND_URL` with Vercel URL
- [ ] Railway backend redeployed with new `FRONTEND_URL`
- [ ] CORS working (frontend can call backend)

---

## External Services

### AWS SES (Email)
- [ ] AWS account created
- [ ] SES service accessed
- [ ] Sending email address verified
- [ ] OR sending domain verified
- [ ] Production access requested (sandbox removed)
- [ ] IAM user created with SES send permissions
- [ ] Access key and secret generated
- [ ] Credentials added to Railway
- [ ] Test email sent successfully

### OpenAI API
- [ ] OpenAI account created
- [ ] API key generated
- [ ] Usage limits configured
- [ ] Billing alerts set up
- [ ] API key added to Railway
- [ ] Test AI request successful

### AWS S3 (Optional - File Storage)
- [ ] S3 bucket created
- [ ] Bucket name noted
- [ ] CORS policy configured
- [ ] IAM user created with S3 access
- [ ] Access key and secret generated
- [ ] Credentials added to Railway
- [ ] Test file upload successful

---

## Custom Domain (Optional)

### Frontend Domain
- [ ] Domain purchased
- [ ] Domain added in Vercel
- [ ] DNS records updated (A/CNAME)
- [ ] SSL certificate provisioned (automatic)
- [ ] Domain working: `https://app.yourdomain.com`
- [ ] `REACT_APP_API_URL` updated (if using API subdomain)
- [ ] Vercel redeployed

### Backend Domain
- [ ] Subdomain planned (e.g., api.yourdomain.com)
- [ ] Domain added in Railway
- [ ] DNS CNAME record added
- [ ] SSL certificate provisioned (automatic)
- [ ] Domain working: `https://api.yourdomain.com`
- [ ] `FRONTEND_URL` updated in Railway
- [ ] Railway backend redeployed

---

## Database

### Migrations
- [ ] Migrations run automatically on Railway startup
- [ ] Migration logs reviewed (no errors)
- [ ] All tables created successfully

### Seed Data (Optional)
- [ ] Seed script reviewed
- [ ] Railway shell opened
- [ ] `npm run prisma:seed` executed
- [ ] Seed data verified in database

### Backup
- [ ] Automatic backups enabled (Railway)
- [ ] Manual backup tested
- [ ] Backup restoration procedure documented

---

## Testing & Verification

### Backend API Tests
- [ ] `GET /health` returns 200 OK
- [ ] `GET /ready` returns 200 OK with database: "connected"
- [ ] `POST /api/v1/auth/register` works
- [ ] Email verification sent
- [ ] `POST /api/v1/auth/login` works
- [ ] JWT tokens returned
- [ ] Protected endpoints require authentication
- [ ] Rate limiting working

### Frontend Tests
- [ ] Home page loads
- [ ] Registration page loads
- [ ] Registration form submits successfully
- [ ] Email verification email received
- [ ] Login page loads
- [ ] Login works with verified account
- [ ] Dashboard loads after login
- [ ] Logout works
- [ ] Session persists on page refresh

### Feature Tests (Teacher)
- [ ] Teacher can create class
- [ ] Class code generated
- [ ] Teacher can view class roster
- [ ] Teacher can create assignment
- [ ] Teacher can view submissions
- [ ] Teacher can grade submissions
- [ ] Teacher can view analytics

### Feature Tests (Student)
- [ ] Student can join class with code
- [ ] Student can view classes
- [ ] Student can view assignments
- [ ] Student can submit assignment
- [ ] Student can view grades
- [ ] Student can view progress

### AI Teaching Assistant Tests
- [ ] Student can start AI conversation
- [ ] AI responds to questions
- [ ] Streaming chat works (real-time responses)
- [ ] Academic integrity filter blocks direct answers
- [ ] Student can share conversation with teacher
- [ ] Teacher can view AI insights
- [ ] Daily AI insights cron job runs

### Real-time Features
- [ ] WebSocket connects on login
- [ ] Real-time notifications work
- [ ] Presence status updates
- [ ] Message delivery works

### File Upload Tests
- [ ] File upload form works
- [ ] Files stored correctly (S3 or local)
- [ ] File size limits enforced
- [ ] File type validation works
- [ ] Files accessible after upload

---

## Security Verification

### Secrets & Keys
- [ ] All default secrets changed
- [ ] JWT secrets are strong (64+ characters)
- [ ] AWS credentials secured
- [ ] OpenAI API key secured
- [ ] Database password is strong
- [ ] No secrets in Git repository
- [ ] `.env` files in `.gitignore`

### Application Security
- [ ] HTTPS enabled (automatic with Vercel/Railway)
- [ ] CORS properly configured
- [ ] Helmet security headers enabled
- [ ] Rate limiting active
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection (React escaping)
- [ ] CSRF protection (JWT tokens)
- [ ] Password hashing (bcrypt)
- [ ] Email verification required
- [ ] Role-based access control working

### Compliance
- [ ] Audit logging enabled
- [ ] FERPA/COPPA compliance documented
- [ ] No PII sent to OpenAI
- [ ] Audit retention configured (7 years)
- [ ] Data isolation by school working
- [ ] Soft deletes implemented

---

## Monitoring & Maintenance

### Railway Monitoring
- [ ] Deployment notifications configured
- [ ] Error alerts configured
- [ ] Resource usage monitored
- [ ] Logs accessible

### Vercel Monitoring
- [ ] Analytics enabled
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled

### External Monitoring (Optional)
- [ ] Uptime monitoring configured (UptimeRobot, etc.)
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring (DataDog, New Relic)
- [ ] Log aggregation (Logtail, Papertrail)

### Backups
- [ ] Database backup schedule verified
- [ ] Backup retention policy set
- [ ] Backup restoration tested
- [ ] File upload backups configured (if using S3)

---

## Documentation

### For Your Team
- [ ] Deployment guide available (DEPLOYMENT.md)
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Troubleshooting guide available

### For Users (Optional)
- [ ] User documentation created
- [ ] Teacher onboarding guide
- [ ] Student onboarding guide
- [ ] FAQ document
- [ ] Support contact information

---

## Post-Deployment

### Immediate
- [ ] Announce launch to stakeholders
- [ ] Monitor error logs for 24 hours
- [ ] Watch resource usage
- [ ] Test all critical flows
- [ ] Verify email deliverability

### First Week
- [ ] Review user feedback
- [ ] Fix critical bugs
- [ ] Monitor costs (AWS, OpenAI, Railway, Vercel)
- [ ] Optimize slow endpoints
- [ ] Review security logs

### Ongoing
- [ ] Regular security updates
- [ ] Dependency updates (npm audit)
- [ ] Database optimization
- [ ] Performance monitoring
- [ ] Cost optimization
- [ ] Feature development based on feedback

---

## Scaling Checklist (Future)

### When Load Increases
- [ ] Monitor CPU/Memory usage
- [ ] Vertical scaling (increase resources)
- [ ] Database connection pooling optimized
- [ ] Horizontal scaling planned
- [ ] Socket.io Redis adapter configured
- [ ] CDN for static assets
- [ ] Database read replicas (if needed)
- [ ] Caching strategy enhanced

---

## Rollback Plan

### If Deployment Fails
- [ ] Previous version tagged in Git
- [ ] Railway rollback procedure known
- [ ] Vercel rollback procedure known
- [ ] Database migration rollback tested
- [ ] Backup restoration procedure ready
- [ ] Downtime communication plan

---

## Sign-off

### Deployment Team
- [ ] Developer sign-off
- [ ] QA sign-off (if applicable)
- [ ] Security review (if applicable)
- [ ] Product owner approval
- [ ] Stakeholder notification

### Launch
- [ ] Production URL: ______________________________
- [ ] Backend API URL: ______________________________
- [ ] Launch date/time: ______________________________
- [ ] Deployed by: ______________________________
- [ ] Version/Commit SHA: ______________________________

---

**🚀 Ready for Production!**

---

## Quick Reference

### Generate JWT Secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test Backend Health
```bash
curl https://YOUR-BACKEND-URL/health
curl https://YOUR-BACKEND-URL/ready
```

### View Railway Logs
```bash
railway logs
```

### Open Railway Shell
```bash
railway shell
```

### Run Database Migration (Railway Shell)
```bash
npx prisma migrate deploy
```

### Seed Database (Railway Shell)
```bash
npm run prisma:seed
```

### View Database (Railway Shell)
```bash
npx prisma studio
```

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
