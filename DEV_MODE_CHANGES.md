# Development Mode Changes

## Email Verification Disabled for Local Development

For easier local development and testing, the following changes have been made:

### 1. Email Sending Disabled
**File**: `src/controllers/auth.controller.ts` (Lines 103-109)

```typescript
// Send verification email (disabled for development)
// TODO: Re-enable email verification in production
// const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
// await sendVerificationEmail(user.email, {
//   firstName: user.firstName,
//   verificationLink,
// });
```

**Reason**: Email service (SMTP/SendGrid) is not configured in local environment.

### 2. Email Verification Check Disabled
**File**: `src/controllers/auth.controller.ts` (Lines 159-163)

```typescript
// Check if email is verified (disabled for development)
// TODO: Re-enable email verification in production
// if (!user.emailVerified) {
//   throw new AppError('Please verify your email before logging in', 403);
// }
```

**Reason**: Users can't verify emails if verification emails aren't being sent.

### 3. JWT Token Fix
**File**: `src/controllers/auth.controller.ts` (Lines 167-174, 250-257)

**Added firstName and lastName to access tokens**:
```typescript
const accessToken = generateAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role,
  schoolId: user.schoolId,
  firstName: user.firstName,  // ADDED
  lastName: user.lastName,     // ADDED
});
```

**Reason**: Frontend and Batch 2 features require firstName/lastName in JWT payload.

---

## Impact

### ✅ What Now Works:
- Sign up with any email (real or fake)
- Login immediately without email verification
- All Batch 2 features (class creation, enrollment, etc.)

### ⚠️ What's Disabled:
- Email verification emails
- Email verification enforcement
- Password reset emails (if implemented)

---

## Before Deploying to Production

**IMPORTANT**: Before deploying to production, you MUST:

1. **Configure Email Service**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your_sendgrid_api_key
   EMAIL_FROM=noreply@socratit.ai
   ```

2. **Re-enable Email Verification**:
   - Uncomment lines 103-109 in `auth.controller.ts` (send verification email)
   - Uncomment lines 159-163 in `auth.controller.ts` (check email verification)

3. **Test Email Flow**:
   - Sign up with real email
   - Verify email is received
   - Click verification link
   - Confirm login works

4. **Update Frontend**:
   - Add "Resend Verification Email" button
   - Show verification pending state
   - Handle verification errors gracefully

---

## Current Signup Flow (Development)

1. User fills signup form with:
   - Email (any format, doesn't need to be real)
   - Password (strong password required)
   - First/Last name
   - Role (TEACHER/STUDENT/ADMIN)
   - School Code (must be valid: `DEMO0001`)
   - Grade Level (if student)

2. Backend creates user with `emailVerified = false`

3. User can **immediately login** (verification check disabled)

4. User gets access token with full user data

5. User is redirected to dashboard

---

## Demo School Code

For testing, use this school code:
- **School Code**: `DEMO0001`
- **School Name**: Demo High School

This school was created by running:
```bash
cd socratit-backend
npx ts-node seed-demo-school.ts
```

---

## Security Notes

### Current State (Development)
- ⚠️ No email verification
- ⚠️ Users can use fake emails
- ✅ Strong password requirements still enforced
- ✅ School code validation still enforced
- ✅ JWT authentication still active
- ✅ Role-based access control still active

### Production Requirements
- ✅ Email verification MUST be enabled
- ✅ Email service MUST be configured
- ✅ HTTPS MUST be enforced
- ✅ Rate limiting on signup endpoint
- ✅ CAPTCHA on signup form (recommended)

---

## Troubleshooting

### Can't Login After Signup
**Solution**: Make sure backend server was restarted after making these changes.

```bash
# Stop server (Ctrl+C)
cd socratit-backend
npm run dev
```

### Invalid School Code Error
**Solution**: Use `DEMO0001` as the school code, or create a new school:

```bash
cd socratit-backend
npx ts-node seed-demo-school.ts
```

### JWT Token Errors
**Issue**: Old code didn't include firstName/lastName in tokens.

**Solution**: Already fixed in this update. Token generation now includes:
- userId, email, role, schoolId (existing)
- firstName, lastName (NEW - required for Batch 2)

---

**Last Updated**: October 23, 2025
**Status**: Development mode active, email verification disabled
