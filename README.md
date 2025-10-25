# Socratit.ai - Educational Platform

An intelligent educational platform featuring AI-powered teaching assistance, comprehensive assignment management, and real-time analytics for K-12 education.

## Features

- **AI Teaching Assistant** - GPT-powered tutor with academic integrity controls
- **Assignment Management** - Practice, quizzes, tests, homework, and challenges
- **Grading System** - Automated and manual grading with analytics
- **Real-time Communication** - WebSocket-based messaging and notifications
- **Progress Tracking** - Student learning analytics and concept mastery
- **Multi-tenancy** - School-based data isolation
- **FERPA/COPPA Compliant** - Comprehensive audit logging and data protection

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+ (optional)
- **Real-time**: Socket.io 4.x
- **AI**: OpenAI GPT-3.5 Turbo
- **Email**: AWS SES
- **Security**: JWT authentication, bcrypt, Helmet.js, rate limiting

### Frontend
- **Framework**: React 19.x with TypeScript
- **Routing**: React Router 7.x
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS 3.x
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+ (optional, but recommended)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/socratit-ai.git
cd socratit-ai
```

2. **Backend Setup**
```bash
cd socratit-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Set DATABASE_URL to your PostgreSQL connection
# - Generate JWT secrets: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# - Configure AWS SES credentials (or set EMAIL_PROVIDER=console for dev)
# - Add OpenAI API key
# - Set REDIS_ENABLED=true if using Redis

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma:seed

# Start development server
npm run dev
```

Backend will run on http://localhost:3001

3. **Frontend Setup**
```bash
cd socratit-wireframes

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env
# - Set REACT_APP_API_URL=http://localhost:3001

# Start development server
npm start
```

Frontend will run on http://localhost:3000

### First User Account

1. Navigate to http://localhost:3000
2. Click "Register" to create a school admin account
3. School code will be generated automatically
4. Verify your email (check console logs in dev mode)
5. Login and start creating classes

## Project Structure

```
socratit.ai/
├── socratit-backend/          # Backend API service
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── jobs/              # Cron jobs
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Input validation
│   │   └── seeds/             # Database seeds
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── Dockerfile             # Production Docker image
│   └── package.json
│
├── socratit-wireframes/       # Frontend React app
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom hooks
│   │   ├── contexts/          # React contexts
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   └── package.json
│
├── .gitignore                 # Git ignore rules
├── DEPLOYMENT.md              # Comprehensive deployment guide
├── DEPLOYMENT-CHECKLIST.md    # Step-by-step deployment checklist
└── README.md                  # This file
```

## API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Health Checks
- `GET /health` - Basic health check
- `GET /ready` - Readiness check (includes database connectivity)

### Main Resources
- `/api/v1/users` - User management
- `/api/v1/classes` - Class management
- `/api/v1/assignments` - Assignment CRUD
- `/api/v1/submissions` - Student submissions
- `/api/v1/grades` - Grading system
- `/api/v1/analytics` - Learning analytics
- `/api/v1/ai-ta` - AI Teaching Assistant
- `/api/v1/messages` - Messaging system
- `/api/v1/notifications` - Notifications
- `/api/v1/progress` - Progress tracking

## Development

### Run Tests
```bash
# Backend tests
cd socratit-backend
npm test

# Frontend tests
cd socratit-wireframes
npm test
```

### Build for Production
```bash
# Backend
cd socratit-backend
npm run build
npm start

# Frontend
cd socratit-wireframes
npm run build
# Serve the build folder with a static server
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (DB GUI)
npx prisma studio

# Seed database
npm run prisma:seed
```

## Deployment

For production deployment instructions, see:
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for Railway + Vercel
- **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** - Step-by-step checklist

### Recommended Stack
- **Frontend**: Vercel (or Netlify, AWS S3 + CloudFront)
- **Backend**: Railway (or Render, AWS ECS, DigitalOcean App Platform)
- **Database**: Railway PostgreSQL (or AWS RDS, DigitalOcean Managed DB)
- **Cache**: Railway Redis (or AWS ElastiCache, DigitalOcean Managed Redis)
- **Email**: AWS SES (or SendGrid, Mailgun)
- **File Storage**: AWS S3 (or DigitalOcean Spaces, Cloudinary)

## Environment Variables

### Backend (.env)
```bash
NODE_ENV=development|production
PORT=3001
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
OPENAI_API_KEY=your-openai-key
REDIS_ENABLED=true|false
FRONTEND_URL=http://localhost:3000
# See .env.example for all variables
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001
```

## Security

- **Authentication**: JWT-based with refresh tokens
- **Password Hashing**: bcrypt with 12 rounds
- **HTTPS**: Required in production (automatic with Vercel/Railway)
- **CORS**: Configured to allow only frontend domain
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: All inputs validated with Joi/express-validator
- **SQL Injection**: Protected by Prisma ORM
- **XSS**: Protected by React's built-in escaping
- **Helmet.js**: Security headers enabled
- **Audit Logging**: All actions logged for FERPA compliance

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works
- [ ] Token refresh works

#### Teacher Workflows
- [ ] Create class
- [ ] Create assignment
- [ ] Grade submissions
- [ ] View analytics
- [ ] Manage students

#### Student Workflows
- [ ] Join class with code
- [ ] View assignments
- [ ] Submit assignment
- [ ] View grades
- [ ] Use AI tutor

#### AI Features
- [ ] Start conversation
- [ ] Send message
- [ ] Receive streaming response
- [ ] Academic integrity filter works
- [ ] Share conversation with teacher

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npx prisma migrate deploy`
- Check all required environment variables are set

### Frontend can't connect to backend
- Verify REACT_APP_API_URL in `.env`
- Check backend is running on port 3001
- Ensure CORS is configured (`FRONTEND_URL` in backend `.env`)

### Database errors
- Run `npx prisma generate` to regenerate Prisma client
- Check migrations: `npx prisma migrate status`
- Reset database (dev only): `npx prisma migrate reset`

### WebSocket not connecting
- Verify Socket.io CORS configuration
- Check JWT token is being sent from frontend
- Ensure firewall allows WebSocket connections

## License

Copyright © 2025 Socratit.ai. All rights reserved.

## Support

For questions or issues:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) for setup steps
- Open an issue on GitHub

---

**Ready to deploy?** Start with [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.
