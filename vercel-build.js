// Vercel-specific build script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Vercel build process...');

try {
  // Build the frontend with Vite
  console.log('🔨 Building frontend with Vite...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Verify the build output structure
  const distPublicDir = './dist/public';
  if (!fs.existsSync(distPublicDir)) {
    console.error('❌ Vite build did not create dist/public/ directory');
    process.exit(1);
  }
  
  // Check for index.html
  const indexPath = path.join(distPublicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in dist/public/');
    process.exit(1);
  }
  
  console.log('✅ Frontend build completed');
  console.log('📁 Build output structure:');
  
  // List the contents
  const listDir = (dir, prefix = '') => {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        if (item === 'assets') {
          listDir(itemPath, prefix + '  ');
        }
      } else {
        console.log(`${prefix}📄 ${item} (${(stat.size / 1024).toFixed(1)}KB)`);
      }
    });
  };
  
  listDir(distPublicDir);
  
  // Create necessary directories for file uploads
  const directories = ['./uploads', './public/projects', './public/reports'];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created ${dir}`);
    }
  });
  
  console.log('🎉 Vercel build completed successfully!');
  console.log('🌐 Ready for deployment');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}