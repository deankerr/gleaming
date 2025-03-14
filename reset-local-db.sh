#!/bin/bash

# Reset local Wrangler state to start fresh
echo "🧹 Removing local Wrangler state..."
rm -rf .wrangler/state

# Extract the database name from wrangler.jsonc
DB_NAME=$(grep -o '"database_name": *"[^"]*"' wrangler.jsonc | head -1 | cut -d'"' -f4)

if [ -z "$DB_NAME" ]; then
  echo "❌ Could not find database_name in wrangler.jsonc"
  exit 1
fi

echo "📦 Found database: $DB_NAME"

# Apply migrations (uses yes to auto-confirm)
echo "🔄 Applying migrations from migrations directory..."
echo "y" | npx wrangler d1 migrations apply $DB_NAME --local

# Start the dev server in the background
echo "🚀 Starting dev server in the background..."
npx wrangler dev --port 8788 &
DEV_SERVER_PID=$!

# Wait a moment for the server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Initialize the default workspace
echo "🏗️ Initializing default workspace..."
curl -s http://localhost:8788/admin/init

# Stop the background dev server
echo "🛑 Stopping dev server..."
kill $DEV_SERVER_PID

echo "✅ Local database reset complete!"
echo "You can now run 'pnpm run dev' to start the development server." 