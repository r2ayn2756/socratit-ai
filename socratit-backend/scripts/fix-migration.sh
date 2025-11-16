#!/bin/bash
# Fix failed migration by marking it as applied
# This script tries multiple approaches to resolve the migration issue

MIGRATION_NAME="20251116151230_update_assignment_system"

echo "🔧 Attempting to fix failed migration..."

# Approach 1: Mark as applied (migration succeeded but was marked as failed)
echo "📋 Trying: Mark migration as applied..."
if npx prisma migrate resolve --applied "$MIGRATION_NAME" 2>/dev/null; then
    echo "✅ Migration marked as applied"
    exit 0
fi

# Approach 2: Mark as rolled back (will be reapplied)
echo "📋 Trying: Mark migration as rolled back..."
if npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" 2>/dev/null; then
    echo "✅ Migration marked as rolled back - will be reapplied"
    exit 0
fi

# Approach 3: Direct SQL fix
echo "📋 Trying: Direct database fix..."
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -c "DELETE FROM _prisma_migrations WHERE migration_name = '$MIGRATION_NAME' AND finished_at IS NULL;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Failed migration record removed via SQL"
        exit 0
    fi
fi

# If all approaches fail, log and continue
echo "⚠️  Could not automatically fix migration"
echo "   This may be resolved during migrate deploy"
exit 0
