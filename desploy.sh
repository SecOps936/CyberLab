#!/bin/bash
set -e  # Exit on any error

# Step 1: Make sure Node modules are installed
echo "Installing dependencies..."
npm ci

# Step 2: Build the project
echo "Building project..."
npm run build

# Step 3: Copy dist/ to target web directory
TARGET_DIR="/var/www/cyber.yit-agency.com/"
echo "Deploying to $TARGET_DIR..."
cp -r dist/. "$TARGET_DIR"

echo "Deployment complete!"
