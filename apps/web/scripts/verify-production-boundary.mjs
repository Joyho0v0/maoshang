/* global console, process */

import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const distDirectory = resolve(process.argv[2] ?? 'dist');
const forbiddenMarkers = [
  'UiHarnessPage',
  '/__ui-harness',
  '共享组件检查台',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000301',
  'SO-NEW',
  'fixture-next',
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

const files = await listFiles(distDirectory);
const violations = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const marker of forbiddenMarkers) {
    if (source.includes(marker)) violations.push(`${file}: ${marker}`);
  }
}

if (violations.length > 0) {
  console.error(`Production UI harness boundary failed:\n${violations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Production UI harness boundary passed: ${files.length} bundle files checked.`);
}
