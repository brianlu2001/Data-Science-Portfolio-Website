# Vercel Deployment Troubleshooting

## Understanding the 404 Error (ID: iad1::4rzt5-1753418251671-94b42b4d77a8)

This 404 NOT_FOUND error typically occurs when:
1. The API function isn't properly configured or deployed
2. The serverless function has runtime errors during initialization
3. Database connection fails during function cold start
4. Express app routing conflicts with Vercel's routing system

## Root Cause Analysis

The error ID pattern suggests this is a Vercel function deployment issue. Common causes:
- **Cold Start Failures**: Database connection timeouts during function initialization
- **Import Errors**: Missing dependencies or incorrect import paths
- **Routing Conflicts**: Express routing conflicting with Vercel's route matching

## Current Setup

Your application now has the correct structure:

```
dist/
└── public/          # Frontend build output (Vercel outputDirectory)
    ├── index.html   # Main HTML file
    └── assets/      # CSS, JS, and other assets
        ├── index-*.css
        └── index-*.js

api/
└── index.ts         # Serverless function for backend API
```

## Vercel Configuration Explanation

Our `vercel.json` is configured to:

1. **Build**: Use `node vercel-build.js` to create the frontend bundle
2. **Output**: Frontend files go to `dist/public/` (Vercel's outputDirectory)
3. **API Routes**: `/api/*` requests → serverless function at `api/index.ts`
4. **Static Files**: All other requests → static files in `dist/public/`

## Deployment Checklist

### Before Deploying
- [ ] Environment variables set in Vercel dashboard:
  - `DATABASE_URL` (your PostgreSQL connection string)
  - `SESSION_SECRET` (a secure random string)
  - `NODE_ENV=production`

### Build Process
- [ ] Run `node vercel-build.js` locally to test
- [ ] Verify `dist/public/index.html` exists
- [ ] Check that assets are in `dist/public/assets/`

### After Deployment
- [ ] Check Vercel function logs for errors
- [ ] Test API endpoints: `your-app.vercel.app/api/projects`
- [ ] Verify static files load: `your-app.vercel.app/assets/index-*.js`

## Common Issues & Solutions

### 1. 404 on Root Path
**Problem**: Main page doesn't load
**Solution**: Ensure `dist/public/index.html` exists and `outputDirectory` is correct

### 2. API Routes Not Working
**Problem**: `/api/*` returns 404
**Solution**: Check that `api/index.ts` exports a default function

### 3. Static Assets Not Loading
**Problem**: CSS/JS files return 404
**Solution**: Verify assets are in `dist/public/assets/` and routing is correct

### 4. Database Connection Errors
**Problem**: API returns 500 errors
**Solution**: Check `DATABASE_URL` environment variable and database accessibility

## Testing Your Build Locally

```bash
# Test the build process
node vercel-build.js

# Check output structure
ls -la dist/public/
ls -la dist/public/assets/

# Test the API function (optional)
# Install vercel CLI: npm i -g vercel
# Run: vercel dev
```

## Getting Help

If deployment still fails:

1. **Check Vercel Build Logs**: Look for specific error messages
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test Database Connection**: Use a database GUI tool to verify connectivity
4. **Check Function Logs**: Look at runtime logs in Vercel dashboard

## Alternative: Stay on Replit

If Vercel continues to be problematic, your app works perfectly on Replit:
1. Click "Deploy" in your Replit project
2. No additional configuration needed
3. Get a `.replit.app` domain automatically