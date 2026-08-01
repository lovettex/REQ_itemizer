import { chromium } from '@playwright/test';

// Playwright is installed with npx, we need to find it
const { execSync } = await import('child_process');
try {
  execSync('npx playwright install --dry-run', { stdio: 'pipe' });
} catch {}

// Actually let's just use the headless shell directly
const PW_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || 
  (process.platform === 'win32' ? 'C:\Users\lovet\AppData\Local\ms-playwright' : null);

console.log('Checking for chromium...');
console.log('PLAYWRIGHT_BROWSERS_PATH:', PW_PATH);
