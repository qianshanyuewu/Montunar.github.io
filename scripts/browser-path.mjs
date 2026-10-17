import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export function browserPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (process.platform !== 'darwin') return undefined;
  const root = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(root)) return undefined;
  const candidates = readdirSync(root)
    .filter((x) => x.startsWith('chromium_headless_shell-'))
    .sort()
    .reverse();
  for (const candidate of candidates)
    for (const arch of ['arm64', 'x64']) {
      const executable = join(
        root,
        candidate,
        `chrome-headless-shell-mac-${arch}`,
        'chrome-headless-shell',
      );
      if (existsSync(executable)) return executable;
    }
  return undefined;
}
