import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const SOURCE_ROOTS = ['api', 'playwright', 'utils'];

test('@utils @policy source directories should not contain JavaScript files', async () => {
  const javascriptFiles = (
    await Promise.all(SOURCE_ROOTS.map((sourceRoot) => findJavaScriptFiles(sourceRoot)))
  ).flat();

  expect(javascriptFiles, 'Source code must be written in TypeScript').toEqual([]);
});

async function findJavaScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  const matches: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      matches.push(...await findJavaScriptFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      matches.push(entryPath);
    }
  }

  return matches;
}
