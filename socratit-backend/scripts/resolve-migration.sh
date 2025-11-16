#!/bin/bash
# Resolve failed migration before running migrate deploy

echo "Checking for failed migrations..."

# Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back 20251116151230_update_assignment_system

echo "Failed migration resolved. Proceeding with normal migrations..."
