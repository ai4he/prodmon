#!/bin/bash

echo "🐒 Starting Productivity Monkey..."
echo ""
echo "Building TypeScript..."
npm run build 2>&1 | grep -E "(error|warning|✓)" || true

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build complete!"
    echo ""
    echo "Starting Electron app..."
    npm start
else
    echo ""
    echo "❌ Build failed. Please check errors above."
    exit 1
fi
