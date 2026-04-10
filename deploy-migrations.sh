#!/bin/bash

# Quick deployment script for teacher/parent profile fixes
# This script applies the necessary database migrations

echo "🚀 Deploying Profile Creation Fixes..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📦 Applying migrations..."
echo ""

# Change to project directory
cd "$(dirname "$0")" || exit 1

# Push migrations
echo "Running: supabase db push"
supabase db push

echo ""
echo "✅ Migrations applied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to http://localhost:5175/"
echo "2. Click 'Create Account'"
echo "3. Select 'I'm a Teacher' or 'I'm a Parent'"
echo "4. Fill in the form and create an account"
echo "5. ✅ Profile should be created automatically!"
echo ""
echo "🔍 To verify:"
echo "1. Go to Supabase Dashboard"
echo "2. Check 'users' table for new entry"
echo "3. Check 'teacher_profiles' or 'parent_profiles' table"
echo ""
