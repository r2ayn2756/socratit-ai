// ============================================================================
// PASSPORT OAUTH CONFIGURATION
// Google and Microsoft OAuth 2.0 strategies
// ============================================================================

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { prisma } from './database';
import { env } from './env';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// GOOGLE OAUTH STRATEGY
// ============================================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.BACKEND_URL}/api/v1/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email provided by Google'), undefined);
        }

        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const profilePhotoUrl = profile.photos?.[0]?.value;

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists - update profile photo if needed
          if (profilePhotoUrl && !user.profilePhotoUrl) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { profilePhotoUrl },
            });
          }
        } else {
          // Create new user - they'll need to complete onboarding
          // For now, we'll create a default school for them
          const schoolCode = `AUTO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          const school = await prisma.school.create({
            data: {
              name: `${firstName} ${lastName}'s School`,
              schoolCode,
            },
          });

          user = await prisma.user.create({
            data: {
              id: uuidv4(),
              email,
              firstName,
              lastName,
              role: 'TEACHER', // Default to TEACHER, they can change later
              schoolId: school.id,
              profilePhotoUrl,
              emailVerified: true, // Email verified by Google
              passwordHash: '', // No password for OAuth users
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// ============================================================================
// MICROSOFT OAUTH STRATEGY
// ============================================================================

passport.use(
  new MicrosoftStrategy(
    {
      clientID: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      callbackURL: `${env.BACKEND_URL}/api/v1/auth/microsoft/callback`,
      scope: ['user.read'],
      tenant: 'common', // Allow both personal and work/school accounts
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Microsoft profile
        const email = profile.emails?.[0]?.value || profile.userPrincipalName;
        if (!email) {
          return done(new Error('No email provided by Microsoft'), undefined);
        }

        const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
        const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
        const profilePhotoUrl = profile.photos?.[0]?.value;

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists - update profile photo if needed
          if (profilePhotoUrl && !user.profilePhotoUrl) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { profilePhotoUrl },
            });
          }
        } else {
          // Create new user
          const schoolCode = `AUTO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          const school = await prisma.school.create({
            data: {
              name: `${firstName} ${lastName}'s School`,
              schoolCode,
            },
          });

          user = await prisma.user.create({
            data: {
              id: uuidv4(),
              email,
              firstName,
              lastName,
              role: 'TEACHER', // Default to TEACHER
              schoolId: school.id,
              profilePhotoUrl,
              emailVerified: true, // Email verified by Microsoft
              passwordHash: '', // No password for OAuth users
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Microsoft OAuth error:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
