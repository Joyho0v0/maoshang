import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { ApiProblemError } from '../../packages/contracts/openapi/client.js';
import { GeneratedApiClient, TransferExecutor } from '../../packages/contracts/openapi/generated-client.js';
import { createContractValidator } from '../../packages/contracts/openapi/runtime-validator.js';

const requestId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
const fileId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
const otherFileId = '3f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
const future = '2099-10-28T05:00:00Z';

const file = {
  id: fileId,
  href: `/api/v1/files/${fileId}`,
  organizationId: requestId,
  version: 1,
  createdAt: '2026-10-28T05:00:00Z',
  updatedAt: '2026-10-28T05:00:00Z',
  fileName: 'invoice.pdf',
  contentType: 'application/pdf',
  sizeBytes: 128,
  status: 'PENDING_UPLOAD',
};

const putTransfer = {
  kind: 'HTTP_PUT',
  method: 'PUT',
  locator: 'https://uploads.example.test/signed-put?token=opaque',
  expiresAt: future,
  headers: { 'Content-Type': 'application/pdf', 'X-Signed': 'opaque' },
};

const multipartTransfer = {
  kind: 'HTTP_MULTIPART_POST',
  method: 'POST',
  locator: 'https://uploads.example.test/signed-post?token=opaque',
  expiresAt: future,
  headers: { 'X-Signed': 'opaque' },
  formFields: { policy: 'opaque-policy', signature: 'opaque-signature' },
  fileField: 'file',
};

const downloadTransfer = {
  kind: 'HTTP_GET',
  method: 'GET',
  locator: 'https://downloads.example.test/signed-get?token=opaque',
  expiresAt: future,
  headers: { 'X-Signed': 'opaque' },
};

function uploadIntent(transfer: unknown, href = `/api/v1/files/${fileId}`): Record<string, unknown> {
  return { file, href, transfer };
}

function downloadIntent(transfer: unknown, href = `/api/v1/files/${fileId}`): Record<string, unknown> {
  return { file: { ...file, status: 'AVAILABLE' }, href, transfer };
}

async function document(): Promise<Record<string, unknown>> {
  return parse(await readFile(new URL('../../packages/contracts/openapi/openapi.yaml', import.meta.url), 'utf8')) as Record<string, unknown>;
}

function uploadInput() {
  return {
    headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': 'intent-key' },
    body: { fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes },
  };
}

describe('file intent contract', () => {
  it('accepts provider-neutral PUT, multipart POST, and GET descriptors', async () => {
    const validator = createContractValidator(await document(), { now: () => new Date('2026-10-29T00:00:00Z') });
    expect(validator.validate('UploadIntent', uploadIntent(putTransfer))).toBe(true);
    expect(validator.validate('UploadIntent', uploadIntent(multipartTransfer))).toBe(true);
    expect(validator.validate('DownloadIntent', downloadIntent(downloadTransfer))).toBe(true);
  });

  it('rejects stale, non-HTTPS, mismatched, incomplete, forbidden, and cross-resource descriptors', async () => {
    const validator = createContractValidator(await document(), { now: () => new Date('2026-10-29T00:00:00Z') });
    const invalidUploads = [
      uploadIntent({ ...putTransfer, locator: '/relative' }),
      uploadIntent({ ...putTransfer, locator: 'http://uploads.example.test/signed' }),
      uploadIntent({ ...putTransfer, expiresAt: '2020-10-28T05:00:00Z' }),
      uploadIntent({ ...putTransfer, method: 'POST' }),
      uploadIntent({ ...putTransfer, headers: { Authorization: 'Bearer leaked' } }),
      uploadIntent({ ...putTransfer, headers: { 'X-Signed': 'opaque' } }),
      uploadIntent({ ...multipartTransfer, formFields: {} }),
      uploadIntent({ ...multipartTransfer, fileField: '' }),
      uploadIntent({ ...multipartTransfer, headers: { Cookie: 'session=leaked' } }),
      uploadIntent({ ...multipartTransfer, headers: { 'cOnTeNt-TyPe': 'multipart/form-data' } }),
      uploadIntent(putTransfer, `/api/v1/files/${otherFileId}`),
      { ...uploadIntent(putTransfer), file: { ...file, href: undefined } },
      { ...uploadIntent(putTransfer), file: { ...file, href: `/api/v1/files/${otherFileId}` } },
    ];
    for (const candidate of invalidUploads) expect(validator.validate('UploadIntent', candidate)).toBe(false);
    expect(validator.validate('DownloadIntent', downloadIntent({ ...downloadTransfer, method: 'POST' }))).toBe(false);
    expect(validator.validate('DownloadIntent', downloadIntent({ ...downloadTransfer, formFields: { file: 'wrong-domain' } }))).toBe(false);
    expect(validator.validate('DownloadIntent', { ...downloadIntent(downloadTransfer), file: { ...file, status: 'SCANNING' } })).toBe(false);
  });

  it('enforces upload 201 and download 200 success contracts including canonical Location', async () => {
    const validator = createContractValidator(await document());
    const client = new GeneratedApiClient({
      fetch: async (input) => {
        const url = String(input);
        if (url.endsWith('/files/upload-intents')) {
          return new Response(JSON.stringify(uploadIntent(putTransfer)), { status: 201, headers: {
            'content-type': 'application/json', 'x-request-id': requestId, etag: '"v1"', location: `/api/v1/files/${fileId}`, 'cache-control': 'no-store',
          } });
        }
        return new Response(JSON.stringify(downloadIntent(downloadTransfer)), { status: 200, headers: {
          'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'no-store',
        } });
      },
      validator,
    });

    await expect(client.call('createUploadIntent', uploadInput())).resolves.toMatchObject({ status: 201, data: { href: `/api/v1/files/${fileId}` }, headers: { Location: `/api/v1/files/${fileId}`, 'Cache-Control': 'no-store' } });
    await expect(client.call('createDownloadIntent', { pathParams: { id: fileId }, headers: { 'X-CSRF-Token': 'csrf-token-value' } })).resolves.toMatchObject({ status: 200, data: { href: `/api/v1/files/${fileId}` }, headers: { 'Cache-Control': 'no-store' } });

    for (const body of [
      { ...uploadIntent(putTransfer), file: { ...file, href: undefined } },
      { ...uploadIntent(putTransfer), file: { ...file, href: `/api/v1/files/${otherFileId}` } },
    ]) {
      const invalidUploadClient = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify(body), { status: 201, headers: {
          'content-type': 'application/json', 'x-request-id': requestId, etag: '"v1"', location: `/api/v1/files/${fileId}`, 'cache-control': 'no-store',
        } }),
        validator,
      });
      await expect(invalidUploadClient.call('createUploadIntent', uploadInput())).rejects.toThrow(/Invalid UploadIntent response/);
    }

    const badLocationClient = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify(uploadIntent(putTransfer)), { status: 201, headers: {
        'content-type': 'application/json', 'x-request-id': requestId, etag: '"v1"', location: `/api/v1/files/${otherFileId}`, 'cache-control': 'no-store',
      } }),
      validator,
    });
    await expect(badLocationClient.call('createUploadIntent', uploadInput())).rejects.toThrow(/Location.*href/i);

    const badContentLocationClient = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify(uploadIntent(putTransfer)), { status: 201, headers: {
        'content-type': 'application/json', 'x-request-id': requestId, etag: '"v1"', location: `/api/v1/files/${fileId}`, 'content-location': `/api/v1/files/${otherFileId}`, 'cache-control': 'no-store',
      } }),
      validator,
    });
    await expect(badContentLocationClient.call('createUploadIntent', uploadInput())).rejects.toThrow(/Content-Location.*href/i);

    const unavailableDownloadClient = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ ...downloadIntent(downloadTransfer), file: { ...file, status: 'SCANNING' } }), { status: 200, headers: {
        'content-type': 'application/json', 'x-request-id': requestId, 'cache-control': 'no-store',
      } }),
      validator,
    });
    await expect(unavailableDownloadClient.call('createDownloadIntent', { pathParams: { id: fileId }, headers: { 'X-CSRF-Token': 'csrf-token-value' } })).rejects.toThrow(/Invalid DownloadIntent response/);
  });

  it('maps upload-only 413/415 to typed Problems and keeps 422 undeclared', async () => {
    const validator = createContractValidator(await document());
    for (const [status, code] of [[413, 'FILE_TOO_LARGE'], [415, 'UNSUPPORTED_MEDIA_TYPE']] as const) {
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify({ type: `urn:autoflow:problem:${code.toLowerCase()}`, title: code, status, code, requestId, retryable: false, meta: null }), { status, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
        validator,
      });
      await expect(client.call('createUploadIntent', uploadInput())).rejects.toBeInstanceOf(ApiProblemError);
    }
    const undeclared = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:validation-failed', title: 'Validation failed', status: 422, code: 'VALIDATION_FAILED', requestId, retryable: false, meta: { violations: [{ field: 'x', code: 'BAD', message: 'bad' }] } }), { status: 422, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
      validator,
    });
    await expect(undeclared.call('createUploadIntent', uploadInput())).rejects.toThrow(/Unexpected HTTP 422/);

    const nonUpload413415 = [413, 415] as const;
    for (const status of nonUpload413415) {
      const client = new GeneratedApiClient({
        fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:transport', title: 'Transport', status, code: status === 413 ? 'FILE_TOO_LARGE' : 'UNSUPPORTED_MEDIA_TYPE', requestId, retryable: false, meta: null }), { status, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
        validator,
      });
      await expect(client.call('createCustomer', { headers: { 'X-CSRF-Token': 'csrf-token-value', 'Idempotency-Key': `undeclared-${status}` }, body: { name: 'Acme', ownerUserId: requestId } })).rejects.toThrow(new RegExp(`Unexpected HTTP ${status}`));
    }

    const notReady = new GeneratedApiClient({
      fetch: async () => new Response(JSON.stringify({ type: 'urn:autoflow:problem:file-not-ready', title: 'File not ready', status: 409, code: 'FILE_NOT_READY', requestId, retryable: true, meta: { fileId, state: 'SCANNING', statusHref: `/api/v1/files/${fileId}` } }), { status: 409, headers: { 'content-type': 'application/problem+json', 'x-request-id': requestId } }),
      validator,
    });
    await expect(notReady.call('createDownloadIntent', { pathParams: { id: fileId }, headers: { 'X-CSRF-Token': 'csrf-token-value' } })).rejects.toMatchObject({ name: 'ApiProblemError', status: 409, problem: { code: 'FILE_NOT_READY' } });
  });

  it('executes transfers in an isolated security context and never fetches invalid descriptors', async () => {
    const calls: RequestInit[] = [];
    const executor = new TransferExecutor({
      now: () => new Date('2026-10-29T00:00:00Z'),
      fetch: async (_input, init) => {
        calls.push(init ?? {});
        return new Response('provider-body', { status: 413 });
      },
    });
    const putResponse = await executor.upload(uploadIntent(putTransfer) as never, new Uint8Array([1, 2]));
    expect(putResponse.status).toBe(413);
    expect(calls[0]).toMatchObject({ method: 'PUT', credentials: 'omit', referrerPolicy: 'no-referrer' });
    expect(new Headers(calls[0]?.headers).get('authorization')).toBeNull();
    expect(new Headers(calls[0]?.headers).get('cookie')).toBeNull();

    const multipartResponse = await executor.upload(uploadIntent(multipartTransfer) as never, new Blob(['bytes'], { type: 'application/pdf' }));
    expect(multipartResponse.status).toBe(413);
    expect(calls[1]).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer' });
    expect(calls[1]?.body).toBeInstanceOf(FormData);

    const downloadResponse = await executor.download(downloadIntent(downloadTransfer) as never);
    expect(downloadResponse.status).toBe(413);
    expect(calls[2]).toMatchObject({ method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer' });

    const beforeInvalid = calls.length;
    await expect(executor.download(downloadIntent({ ...downloadTransfer, expiresAt: '2020-10-28T05:00:00Z' }) as never)).rejects.toThrow(/expired/i);
    await expect(executor.download(downloadIntent({ ...downloadTransfer, headers: { 'X-CSRF-Token': 'leaked' } }) as never)).rejects.toThrow(/forbidden/i);
    await expect(executor.upload(uploadIntent({ ...multipartTransfer, headers: { 'CONTENT-TYPE': 'multipart/form-data' } }) as never, new Blob(['bytes']))).rejects.toThrow(/forbidden|content-type/i);
    await expect(executor.download(uploadIntent(multipartTransfer) as never)).rejects.toThrow(/Invalid transfer intent|direction/i);
    await expect(executor.upload(downloadIntent(downloadTransfer) as never, new Blob(['bytes']))).rejects.toThrow(/Invalid transfer intent|direction/i);
    expect(calls).toHaveLength(beforeInvalid);
  });
});
