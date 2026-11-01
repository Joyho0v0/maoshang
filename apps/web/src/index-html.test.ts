import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const faviconSvg = readFileSync(resolve(process.cwd(), 'public/favicon.svg'), 'utf8');

describe('web document assets', () => {
  it('declares a served favicon so a fresh browser context has no missing icon request', () => {
    expect(indexHtml).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />');
    expect(faviconSvg).toContain('<svg');
  });
});
