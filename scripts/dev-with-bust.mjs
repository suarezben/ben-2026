/**
 * Launches Vite dev from the package root (same as `vite` but with a stable cwd).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// `npm run dev` cwd is always this package root (not the script file path).
const root = process.cwd();

const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteBin)) {
  console.error('vite not found at', viteBin, '— run npm install from the project root.');
  process.exit(1);
}

const extraArgs = process.argv.slice(2);

const child = spawn(process.execPath, [viteBin, ...extraArgs], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
