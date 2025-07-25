// Custom build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting Vercel build process...');

try {
  // Build the frontend with Vite
  console.log('Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Ensure dist directory structure is correct
  const distDir = './dist';
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create necessary directories for uploads and public files
  const uploadsDir = './uploads';
  const publicDir = './public';
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}