// Custom build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting Vercel build process...');

try {
  // Build the frontend with Vite
  console.log('Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Verify dist directory was created
  const distDir = './dist';
  if (!fs.existsSync(distDir)) {
    console.error('Vite build did not create dist/ directory');
    process.exit(1);
  }
  
  console.log('✅ Frontend built successfully');
  
  // List contents of dist directory
  console.log('📁 Contents of dist/:', fs.readdirSync(distDir));
  
  // Create necessary directories for uploads and public files if they don't exist
  const uploadsDir = './uploads';
  const publicDir = './public';
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  }
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created public directory');
  }
  
  // Ensure public subdirectories exist
  const projectsDir = './public/projects';
  const reportsDir = './public/reports';
  
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
    console.log('✅ Created public/projects directory');
  }
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log('✅ Created public/reports directory');
  }
  
  console.log('🎉 Build completed successfully!');
  console.log('📋 Ready for Vercel deployment');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}