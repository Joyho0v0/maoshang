import { canonicalRequestHash, canonicalizeRequest } from '../../apps/api/src/common/security/canonical-request.js';
import { formatEtag, parseEtag } from '../../apps/api/src/common/http/etag.js';

describe('request consistency primitives', () => {
  it('hashes semantically identical canonical requests identically', () => {
    const first = { method: 'POST', path: '/api/v1/customers', body: { b: 2, a: 1 }, ifMatch: '"v3"' };
    const second = { method: 'post', path: '/api/v1/customers', body: { a: 1, b: 2 }, ifMatch: '"v3"' };

    expect(canonicalizeRequest(first)).toBe(canonicalizeRequest(second));
    expect(canonicalRequestHash(first)).toBe(canonicalRequestHash(second));
    expect(canonicalRequestHash({ ...first, ifMatch: '"v4"' })).not.toBe(canonicalRequestHash(first));
  });

  it('only accepts strong version ETags and rejects wildcard writes', () => {
    expect(formatEtag(7)).toBe('"v7"');
    expect(parseEtag('"v7"')).toBe(7);
    expect(parseEtag('*')).toBeUndefined();
    expect(parseEtag('W/"v7"')).toBeUndefined();
  });
});
