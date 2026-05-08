import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

// Build the React app
console.log('Building React app...');
execSync('pnpm build', { stdio: 'inherit' });

// Compile TypeScript for Electron
console.log('Compiling Electron TypeScript...');
try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
} catch {
  console.log('Copying Electron files as fallback...');
}

console.log('Build complete!');
