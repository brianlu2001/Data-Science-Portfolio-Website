# Vercel Build Troubleshooting Guide

## The "Command exited with 127" Error

This error typically means the build command cannot be found. Here's how we've solved it:

### Root Cause
- Vercel's build environment may have different paths than local development
- The `vite` command might not be in the expected location
- Build tools may not be globally available

### Our Solution: `build-vercel.sh`

We created a robust build script that tries multiple methods:

1. **Global vite command** - if vite is globally available
2. **Local binary** - `./node_modules/.bin/vite build`
3. **npx fallback** - `npx vite build` as last resort

### Vercel Configuration

```json
{
  "framework": null,
  "buildCommand": "bash build-vercel.sh",
  "outputDirectory": "dist/public",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Prevention of Future Build Errors

1. **Always use fallback methods** for build commands
2. **Test build script locally** before deploying
3. **Use explicit paths** when possible
4. **Add verification steps** to ensure build output exists

### Testing the Build Script

Run locally to verify:
```bash
./build-vercel.sh
```

Should output:
- Build method being used
- Successful build confirmation
- Verification that `dist/public/index.html` exists

### Alternative Approaches

If the bash script fails, these are backup options for `vercel.json`:

```json
// Option 1: Use npx directly
"buildCommand": "npx vite build"

// Option 2: Use npm script (requires package.json modification)
"buildCommand": "npm run build:frontend"
```

### Success Indicators

✅ Build script runs without errors
✅ `dist/public/index.html` is created
✅ Assets are generated in `dist/public/assets/`
✅ No "command not found" errors

This approach ensures your Vercel deployment will work regardless of the build environment configuration.