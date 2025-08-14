// Move public assets to root for deployment
import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
const rootDir = process.cwd();

// Function to copy files recursively
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Copy all files in directory
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    // Copy file
    fs.copyFileSync(src, dest);
  }
}

try {
  // Check if public directory exists
  if (fs.existsSync(publicDir)) {
    console.log('📂 Moving public assets to root directory...');
    
    // Get all items in public directory
    const items = fs.readdirSync(publicDir);
    
    items.forEach(item => {
      const srcPath = path.join(publicDir, item);
      const destPath = path.join(rootDir, item);
      
      // Skip if destination already exists and is the same
      if (fs.existsSync(destPath)) {
        console.log(`⚠️  ${item} already exists in root, skipping...`);
        return;
      }
      
      copyRecursive(srcPath, destPath);
      console.log(`✅ Copied ${item} to root`);
    });
    
    console.log('🎉 Successfully moved all public assets to root!');
    console.log('📍 Assets are now available at root level for deployment');
  } else {
    console.log('ℹ️  No public directory found, skipping move operation');
  }
} catch (error) {
  console.error('❌ Error moving public assets:', error.message);
  process.exit(1);
}

console.log('✨ Build process completed - ready for deployment!');