#!/bin/bash
# Initialize local D1 database with schema and test data
# Run this to ensure database has schema and test data before starting dev server

echo "🔧 Initializing local D1 database (fund-rating-db)..."

# Check if database is empty by trying to query counterparty table
RESULT=$(npx wrangler d1 execute fund-rating-db --local --command="SELECT COUNT(*) as count FROM counterparty" 2>&1)

if echo "$RESULT" | grep -q "no such table"; then
  echo "📋 Applying schema..."
  npx wrangler d1 execute fund-rating-db --local --file=schema.sql
  if [ $? -eq 0 ]; then
    echo "✅ Schema applied successfully"
  else
    echo "❌ Failed to apply schema"
    exit 1
  fi
fi

# Check if data exists
COUNT=$(npx wrangler d1 execute fund-rating-db --local --command="SELECT COUNT(*) as count FROM counterparty" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
  echo "🌱 Seeding test data..."
  npx wrangler d1 execute fund-rating-db --local --file=seed-test-data.sql
  if [ $? -eq 0 ]; then
    echo "✅ Test data seeded successfully"
    echo ""
    echo "📊 Test cases available:"
    echo "  1. Alpha Fund (FUND001) - Route A - Final Rating: 1"
    echo "  2. test2 (434342) - Route B - Final Rating: 3"
    echo "  3. debug fund (debug001) - Route A - Final Rating: 3"
  else
    echo "❌ Failed to seed test data"
    exit 1
  fi
else
  echo "ℹ️  Database already contains $COUNT counterparty records"
  echo "✅ Existing data preserved - no need to reseed"
fi

echo ""
echo "✅ Database ready!"
echo ""
echo "📝 IMPORTANT: The dev server must use the correct database binding:"
echo "   npm run dev   (uses: wrangler pages dev frontend --binding DB=fund-rating-db)"
echo ""
echo "🌐 After starting dev server, access at http://localhost:8788"
echo "🔄 To reset database: npm run reset-db"
