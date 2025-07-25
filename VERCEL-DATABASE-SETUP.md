# 🗄️ Vercel Database Setup Guide

## The Problem
Your projects are missing on Vercel because it's using a different database than your Replit development environment.

## ✅ Solution 1: Use Your Existing Database (Recommended)

Your Replit environment already has all your projects. Use the same database for Vercel:

1. **Get Your Database URL from Replit**:
   ```bash
   echo $DATABASE_URL
   ```
   Copy this exact URL.

2. **Set it in Vercel**:
   - Go to your Vercel project dashboard
   - Settings → Environment Variables  
   - Update `DATABASE_URL` to the same value from Replit
   - Redeploy your project

3. **Verify**: Your projects will appear immediately on Vercel

## Alternative Solution 2: Migrate Data to New Database

If you prefer a separate production database:

1. **Export your data** (run this in Replit):
   ```sql
   -- Export projects
   SELECT * FROM projects;
   
   -- Export site settings  
   SELECT * FROM site_settings;
   ```

2. **Set up your new production database** in Vercel

3. **Import the data** using the SQL results

## Current Data Summary
You have:
- ✅ 8 complete projects with descriptions, images, and URLs
- ✅ Site settings with your contact info and bio
- ✅ All files and reports properly uploaded

## Recommendation
Use Solution 1 - it's faster and your data is already there. Just point Vercel to the same database URL that Replit is using.