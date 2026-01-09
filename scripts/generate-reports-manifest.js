/**
 * Generate reports manifest file
 * This script scans the public/reports folder and creates a JSON manifest
 * that the frontend can use to dynamically display available reports.
 * 
 * Run: node scripts/generate-reports-manifest.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '..', 'public', 'reports');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'reports-manifest.json');

// Helper to generate a display name from filename
function generateDisplayName(filename) {
  // Remove extension
  let name = filename.replace(/\.(html|pdf)$/i, '');
  
  // Try to extract description if filename has " - " separator (e.g., "prefix - Description")
  // Use the part after the LAST " - " if it exists, as that's usually the title
  const dashIndex = name.indexOf(' - ');
  if (dashIndex !== -1) {
    name = name.substring(dashIndex + 3); // Get everything after " - "
  }
  
  // Clean up underscores and extra spaces
  name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter if it's lowercase
  if (name.length > 0 && name[0] === name[0].toLowerCase()) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }
  
  return name;
}

function generateManifest() {
  console.log('📁 Scanning reports directory:', REPORTS_DIR);
  
  // Check if reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    console.log('⚠️ Reports directory does not exist. Creating empty manifest.');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ reports: [], generatedAt: new Date().toISOString() }, null, 2));
    return;
  }
  
  // Read all files in the reports directory
  const files = fs.readdirSync(REPORTS_DIR);
  
  // Filter for HTML and PDF files only
  const reportFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.html' || ext === '.pdf';
  });
  
  console.log(`📄 Found ${reportFiles.length} report files`);
  
  // Generate report entries
  const reports = reportFiles.map(filename => {
    const ext = path.extname(filename).toLowerCase().slice(1); // 'html' or 'pdf'
    const displayName = generateDisplayName(filename);
    
    return {
      filename,
      url: `/reports/${filename}`,
      type: ext,
      displayName
    };
  });
  
  // Sort by display name
  reports.sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  // Create manifest object
  const manifest = {
    reports,
    generatedAt: new Date().toISOString(),
    count: reports.length
  };
  
  // Write manifest file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Generated reports manifest:', OUTPUT_FILE);
  console.log('📊 Reports included:');
  reports.forEach(r => {
    console.log(`   - [${r.type.toUpperCase()}] ${r.displayName}`);
  });
}

// Run the script
generateManifest();
