# Windows Setup Guide - Socratit.ai Backend

This guide will help you set up the backend on Windows without Redis (optional Redis setup included at the end).

---

## ✅ Step 1: Install PostgreSQL

### Download and Install

1. **Download PostgreSQL** from: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Download the latest version (15 or 16)
   - File size: ~300MB

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the installation wizard

3. **Set Password** (IMPORTANT!)
   - When prompted, set a password for the PostgreSQL superuser
   - **Remember this password!** You'll need it for the backend
   - Example: Use `postgres` as the password for simplicity

4. **Port Configuration**
   - Default port is `5432` - keep this unless you have a conflict
   - Click "Next"

5. **Complete Installation**
   - Click "Next" through remaining screens
   - Uncheck "Launch Stack Builder" at the end
   - Click "Finish"

### Verify Installation

1. Open **Command Prompt** (cmd)
2. Run:
   ```cmd
   psql --version
   ```
   You should see: `psql (PostgreSQL) 15.x` or similar

   **If command not found:**
   - Add PostgreSQL to your PATH:
   - Go to: `C:\Program Files\PostgreSQL\15\bin` (or your version)
   - Copy this path
   - Search "Environment Variables" in Windows Start
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and paste the PostgreSQL bin path
   - Click "OK" on all dialogs
   - Close and reopen Command Prompt

---

## ✅ Step 2: Create Database

### Option A: Using pgAdmin (GUI - Easier)

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Enter your master password if prompted
3. In the left sidebar, expand **Servers** > **PostgreSQL 15**
4. Right-click on **Databases** → **Create** → **Database**
5. Enter database name: `socratit_dev`
6. Click **Save**

### Option B: Using Command Line

1. Open **Command Prompt**
2. Login to PostgreSQL:
   ```cmd
   psql -U postgres
   ```
   Enter your password when prompted

3. Create the database:
   ```sql
   CREATE DATABASE socratit_dev;
   ```

4. Exit psql:
   ```sql
   \q
   ```

---

## ✅ Step 3: Install Node.js (if not already installed)

1. Download from: https://nodejs.org/
2. Install the **LTS version** (recommended)
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

---

## ✅ Step 4: Set Up Backend

### Navigate to Backend Directory

```cmd
cd C:\Users\towne\Code\Socratit.ai\socratit-backend
```

### Install Dependencies

```cmd
npm install
```

This will take a few minutes...

### Configure Database Connection

1. Open `.env` file in the `socratit-backend` folder
2. Update the `DATABASE_URL` to match your PostgreSQL password:

   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/socratit_dev
   ```

   Example if your password is `postgres`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/socratit_dev
   ```

3. **Confirm Redis is disabled** (should already be):
   ```env
   REDIS_ENABLED=false
   ```

### Run Database Migrations and Seed Data

```cmd
npm run db:setup
```

This will:
- Create all database tables
- Seed test accounts and schools

You should see:
```
✅ Database connected successfully
✅ Created school: Demo High School
✅ Created teacher: teacher@demo.com
✅ Created student: student@demo.com
✅ Created admin: admin@demo.com
```

---

## ✅ Step 5: Start the Backend

```cmd
npm run dev
```

You should see:
```
========================================
🚀 Socratit.ai Backend Server
📍 Environment: development
🌐 Server running on port 3001
📡 API: http://localhost:3001/api/v1
💚 Health: http://localhost:3001/health
💾 Storage: MEMORY
========================================
```

**Notice:** `Storage: MEMORY` means it's using in-memory storage instead of Redis (this is fine!)

---

## ✅ Step 6: Test the Backend

### Test Health Endpoint

Open your browser or use `curl`:
```
http://localhost:3001/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-01-22T...",
  "environment": "development"
}
```

### Test Login

Using **PowerShell** or **curl** (if installed):

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"teacher@demo.com","password":"Password123"}'
```

Or using **curl**:
```cmd
curl -X POST http://localhost:3001/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"teacher@demo.com\",\"password\":\"Password123\"}"
```

You should get back a response with `accessToken` and `refreshToken`!

---

## 🎉 Success!

Your backend is now running WITHOUT Redis! You can:

- ✅ Register new users
- ✅ Login and get JWT tokens
- ✅ Access protected endpoints
- ✅ Reset passwords
- ✅ All authentication features work

**In-memory storage handles:**
- Token blacklisting
- Rate limiting
- Temporary data

**Note:** In-memory storage resets when you restart the server. This is fine for development!

---

## 🧪 Test Accounts

Use these to test:

- **Teacher**: `teacher@demo.com` / `Password123`
- **Student**: `student@demo.com` / `Password123`
- **Admin**: `admin@demo.com` / `Password123`

**School Codes** (for registration):
- `DEMO0001` - Demo High School
- `TEST0002` - Test Middle School

---

## 🔧 Common Issues

### Issue: `psql: command not found`
**Solution:** Add PostgreSQL to PATH (see Step 1)

### Issue: `password authentication failed`
**Solution:** Check your password in `.env` file matches PostgreSQL password

### Issue: `database "socratit_dev" does not exist`
**Solution:** Create the database (see Step 2)

### Issue: Port 3001 already in use
**Solution:**
- Find and kill the process using port 3001
- Or change `PORT=3002` in `.env` file

### Issue: Cannot connect to database
**Solution:**
- Verify PostgreSQL is running:
  - Open **Task Manager** → Check for `postgres.exe`
  - Or open **Services** → Look for "PostgreSQL"
- Restart PostgreSQL service if needed

---

## 📦 Optional: Install Redis (For Production-Like Setup)

If you want to use Redis later:

### Option 1: Memurai (Native Windows, Free for Dev)

1. Download from: https://www.memurai.com/get-memurai
2. Install the free developer edition
3. Start Memurai from Start Menu
4. Update `.env`:
   ```env
   REDIS_ENABLED=true
   ```
5. Restart backend: `npm run dev`

You'll see: `💾 Storage: REDIS`

### Option 2: WSL + Redis (Recommended for Production Learning)

1. Install WSL (Windows Subsystem for Linux):
   ```powershell
   wsl --install
   ```

2. Restart your computer

3. Open Ubuntu from Start Menu

4. Install Redis in Ubuntu:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

5. Update `.env`:
   ```env
   REDIS_ENABLED=true
   ```

6. Restart backend: `npm run dev`

### Option 3: Docker (If you have Docker Desktop)

See `DOCKER_SETUP.md` for full Docker setup

---

## 🚀 Next Steps

1. **Frontend Integration**: Connect your React frontend to this backend
2. **Test API Endpoints**: Use Postman or similar tools
3. **Build Batch 2**: Start building Class Management system

---

## 📝 Quick Commands Reference

```cmd
# Start development server
npm run dev

# Run database migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

---

## ✅ You're Ready!

Your backend is fully functional on Windows without Redis. When you're ready for production or want to test Redis features, follow the optional Redis setup above.

Happy coding! 🎉
