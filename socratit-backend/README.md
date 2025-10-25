# Socratit.ai Backend

Enterprise classroom management SaaS platform backend built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Role-based access control (Teacher, Student, Admin)
  - Email verification
  - Password reset flow
  - Secure password hashing with bcrypt

- **Multi-tenancy**
  - Complete data isolation between schools
  - School-based user management

- **Security**
  - FERPA and COPPA compliant audit logging
  - Rate limiting on all endpoints
  - CORS protection
  - Helmet security headers
  - Input validation and sanitization
  - Token blacklisting on logout

- **Infrastructure**
  - PostgreSQL database with Prisma ORM
  - Redis for caching and session management (OPTIONAL - falls back to in-memory)
  - AWS SES for email delivery (development mode uses console)

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x (OPTIONAL - not required for development)
- npm or yarn

## 🪟 Windows Users - Start Here!

If you're on Windows, follow the detailed [Windows Setup Guide](WINDOWS_SETUP.md) for step-by-step instructions with PostgreSQL installation.

**Quick Summary for Windows:**
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create database `socratit_dev`
3. Run `npm install` and `npm run db:setup`
4. Redis is **OPTIONAL** - backend works without it!

---

## Getting Started

### 1. Clone and Install

```bash
cd socratit-backend
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/socratit_dev
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key
REDIS_HOST=localhost
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

#### Option A: Quick Setup (Recommended for Development)

```bash
npm run db:setup
```

This will:
- Run database migrations
- Seed the database with test data

#### Option B: Manual Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Access API Documentation

- Health Check: `http://localhost:3001/health`
- API Base: `http://localhost:3001/api/v1`

## Test Accounts

After seeding, you can use these accounts:

- **Teacher**: `teacher@demo.com` / `Password123`
- **Student**: `student@demo.com` / `Password123`
- **Admin**: `admin@demo.com` / `Password123`

**School Codes:**
- Demo High School: `DEMO0001`
- Test Middle School: `TEST0002`

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/logout` | Logout user | Yes |
| POST | `/refresh` | Refresh access token | No |
| POST | `/verify-email` | Verify email address | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user profile | Yes |
| PATCH | `/me` | Update current user profile | Yes |
| POST | `/change-password` | Change password | Yes |

## Project Structure

```
src/
├── config/           # Configuration files (env, database, redis)
├── controllers/      # Route controllers
├── middleware/       # Express middleware (auth, validation, error handling)
├── routes/           # API routes
├── services/         # Business logic services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── validators/       # Request validation schemas
├── __tests__/        # Test files
├── app.ts            # Express app configuration
└── index.ts          # Server entry point

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Database seeding script
```

## Development

### Available Scripts

```bash
# Development
npm run dev                 # Start development server with hot reload

# Database
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations (dev)
npm run prisma:studio       # Open Prisma Studio (DB GUI)
npm run prisma:seed         # Seed database
npm run db:setup            # Run migrations + seed

# Build
npm run build               # Build for production
npm start                   # Start production server

# Testing
npm test                    # Run tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage

# Code Quality
npm run lint                # Run ESLint
npm run format              # Format code with Prettier
```

### Database Migrations

Create a new migration:

```bash
npx prisma migrate dev --name migration_name
```

Apply migrations in production:

```bash
npm run prisma:migrate:prod
```

## Security Best Practices

### JWT Configuration

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens are blacklisted on logout
- Refresh tokens are rotated on each use

### Password Requirements

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Common passwords are rejected

### Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Password reset: 3 requests per hour
- Email verification: 5 requests per hour

## Deployment

### Environment Variables

Ensure all environment variables are set in production:

```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_ACCESS_SECRET=strong-secret-minimum-32-chars
JWT_REFRESH_SECRET=strong-secret-minimum-32-chars
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
EMAIL_PROVIDER=ses
```

### Build and Deploy

```bash
# Build the application
npm run build

# Run migrations
npm run prisma:migrate:prod

# Start production server
npm start
```

### AWS Deployment Checklist

- [ ] Set up RDS PostgreSQL instance
- [ ] Set up ElastiCache Redis instance
- [ ] Configure AWS SES for email sending
- [ ] Set up S3 bucket for file uploads (future)
- [ ] Configure security groups and VPC
- [ ] Set up load balancer (for horizontal scaling)
- [ ] Configure environment variables
- [ ] Set up monitoring and logging

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://postgres:postgres@localhost:5432/socratit_dev

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Should return: PONG
```

### Port Already in Use

```bash
# Kill process on port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3001 | xargs kill
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Run linting and tests
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please create an issue on GitHub.
