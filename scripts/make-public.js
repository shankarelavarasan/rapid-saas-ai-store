// Cross-platform mkdir public + optional copy
import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ public directory created');
} else {
  console.log('ℹ️ public directory already exists');
}

// Optional: copy frontend build output if exists
const buildDir = path.join(process.cwd(), 'build');
if (fs.existsSync(buildDir)) {
  fs.cpSync(buildDir, publicDir, { recursive: true });
  console.log('📂 Copied build output to public directory');
} else {
  console.log('⚠️ No build directory found, skipping copy');
}

console.log('🎉 Build process completed successfully!');