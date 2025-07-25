# Vercel Deployment Guide

This guide will help you deploy your Data Science Portfolio Website to Vercel.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A PostgreSQL database (Neon, PlanetScale, or Supabase recommended)
3. Your GitHub repository

## Deployment Steps

### 1. Prepare Your Environment Variables

In your Vercel dashboard, set up these environment variables:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-session-key-here
NODE_ENV=production
```

### 2. Update Authentication (Optional)

For production deployment, you may want to implement proper authentication. The current setup bypasses authentication for Vercel compatibility.

To implement real authentication, you can:
- Use NextAuth.js
- Implement JWT tokens
- Use Auth0 or similar services

### 3. Deploy to Vercel

1. Push your code to GitHub
2. In Vercel dashboard:
   - Import your repository
   - Set the build command to: `node build.js`
   - Set the framework preset to "Other"
   - Add your environment variables
   - Deploy

### 4. Database Setup

Make sure your PostgreSQL database has the required tables. Run this from your local machine:

```bash
npm run db:push
```

### 5. File Storage Considerations

For production deployment, consider:
- Using cloud storage (AWS S3, Cloudinary) for file uploads
- The current setup stores files locally, which won't persist on Vercel

## Files Created for Vercel

- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless function entry point
- `build.js` - Custom build script
- `server/vercelAuth.ts` - Simplified authentication
- `.env.example` - Environment variables template

## Troubleshooting

### Build Issues
- Ensure all dependencies are installed
- Check TypeScript compilation errors
- Verify environment variables are set

### Database Connection
- Ensure DATABASE_URL is correctly formatted
- Check if your database provider allows external connections
- Verify SSL settings if required

### Static Files
- Upload existing files in `public/` and `uploads/` to your cloud storage
- Update file URLs in your database if needed

## Alternative: Deploy on Replit

Your app is already configured for Replit deployment. Simply:
1. Push to your Replit repository
2. Click the "Deploy" button in Replit
3. Your app will be available at a `.replit.app` domain

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test database connectivity
4. Check file upload permissions