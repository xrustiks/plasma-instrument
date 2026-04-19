import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');
const indexScriptPath = path.join(projectRoot, 'build', 'generate-search-index.mjs');

let queue = Promise.resolve();

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [indexScriptPath], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `Search index build failed with code ${code}`));
    });
  });
}

export function scheduleSearchIndexRebuild() {
  queue = queue
    .then(() => runBuild())
    .catch((error) => {
      console.error('[search-index] Rebuild failed:', error.message);
    });

  return queue;
}
