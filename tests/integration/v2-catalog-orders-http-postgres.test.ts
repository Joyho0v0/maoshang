import 'reflect-metadata';
import pg from 'pg';
import { createApp } from '../../apps/api/src/main.js';
import { ControlledAuthenticationProvider, hashControlledPassword } from '../../apps/api/src/modules/identity/application/controlled-authentication.provider.js';
import { IdempotencyOwnershipLostError, IDEMPOTENCY_REPOSITORY, type PostgresIdempotencyRepository } from '../../apps/api/src/modules/integration/idempotency/postgres-idempotency-repository.js';

describe('Catalog + Orders v2 HTTP PostgreSQL runtime', () => {
  const organizationId = '00000000-0000-4000-8000-000000000701';
  const actorId = '00000000-0000-4000-8000-000000000702';
  const groupId = '00000000-0000-4000-8000-000000000703';
  const customerId = '00000000-0000-4000-8000-000000000704';
  const imageFileId = '00000000-0000-4000-8000-000000000711';
  const replacementImageFileId = '00000000-0000-4000-8000-000000000712';
  const notReadyFileId = '00000000-0000-4000-8000-000000000713';
  let pool: pg.Pool | undefined;
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  let cookie = '';
  let csrfToken = '';

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl === undefined) return;
    pool = new pg.Pool({ connectionString: databaseUrl, max: 8 });
    await seed(pool);
    app = await createApp({
      config: { nodeEnv: 'test', databaseUrl, sessionSecret: 's'.repeat(32) },
      authenticationProvider: new ControlledAuthenticationProvider([{ username: 'v2@example.test', subject: 'v2-subject', passwordHash: hashControlledPassword('pw') }]),
    });
    await app.init();
    const http = app.getHttpAdapter().getInstance();
    const csrf = await http.inject({ method: 'GET', url: '/api/v1/auth/csrf' });
    const bootstrapCookie = cookieFrom(csrf.headers['set-cookie']);
    const login = await http.inject({
      method: 'POST',
      url: '/api/v1/auth/sessions',
      headers: { cookie: bootstrapCookie, 'x-csrf-token': csrf.json().csrfToken },
      payload: { provider: 'LOCAL_PASSWORD', username: 'v2@example.test', password: 'pw' },
    });
    expect(login.statusCode).toBe(201);
    cookie = cookieFrom(login.headers['set-cookie']);
    csrfToken = login.json().csrfToken as string;
  });

  afterAll(async () => {
    if (app !== undefined) await app.close();
    if (pool !== undefined) await pool.end();
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('executes v2 product, SKU and order commands with versioned replay', async () => {
    if (app === undefined || pool === undefined) return;
    const http = app.getHttpAdapter().getInstance();
    const mutationHeaders = { cookie, 'x-csrf-token': csrfToken };

    const csrfFailure = await http.inject({
      method: 'POST',
      url: '/api/v2/products',
      headers: { cookie, 'idempotency-key': 'v2-csrf-rejection-1' },
      payload: { productCode: 'V2-CSRF-REJECTED', name: 'CSRF rejected', unit: 'PCS' },
    });
    expect(csrfFailure.statusCode).toBe(403);
    expect(csrfFailure.json()).toMatchObject({ status: 403, code: 'CSRF_FAILED', retryable: true, meta: { kind: 'CSRF', refreshHref: '/api/v2/auth/csrf' } });
    expect(csrfFailure.headers['cache-control']).toBe('no-store');
    expect(csrfFailure.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);

    const productRequest = {
      method: 'POST' as const,
      url: '/api/v2/products',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-product-command-1' },
      payload: { productCode: 'V2-P-1', name: 'V2 Product', unit: 'PCS' },
    };
    const product = await http.inject(productRequest);
    expect(product.statusCode).toBe(201);
    expect(product.headers.location).toBe(`/api/v2/products/${product.json().id}`);
    expect(product.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(product.headers.etag).toBe('"v1"');
    const productReplay = await http.inject(productRequest);
    expect(productReplay.statusCode).toBe(201);
    expect(productReplay.headers['idempotent-replay']).toBe('true');

    for (const [productCode, name, key] of [['V2-P-ALPHA', 'Alpha', 'v2-product-alpha-1'], ['V2-P-ZULU', 'Zulu', 'v2-product-zulu-1'] as const]) {
      const created = await http.inject({ method: 'POST', url: '/api/v2/products', headers: { ...mutationHeaders, 'idempotency-key': key }, payload: { productCode, name, unit: 'PCS' } });
      expect(created.statusCode).toBe(201);
    }
    const productsByName = await http.inject({ method: 'GET', url: '/api/v2/products?sort=name&page%5Bsize%5D=100', headers: { cookie } });
    expect(productsByName.statusCode).toBe(200);
    expect(productsByName.json().data.map((product: { name: string }) => product.name)).toEqual(['Alpha', 'V2 Product', 'Zulu']);
    for (const sort of ['name', '-name', 'status', '-status', 'id', '-id', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt', '-updatedAt,-id']) {
      const response = await http.inject({ method: 'GET', url: `/api/v2/products?sort=${sort}&page%5Bsize%5D=100`, headers: { cookie } });
      expect(response.statusCode, `Product sort ${sort}`).toBe(200);
    }
    const unknownQuery = await http.inject({ method: 'GET', url: '/api/v2/products?unknown=1', headers: { cookie } });
    expect(unknownQuery.statusCode).toBe(400);
    expect(unknownQuery.json()).toMatchObject({ code: 'VALIDATION_FAILED', meta: { violations: [{ field: 'unknown' }] } });
    const duplicateSort = await http.inject({ method: 'GET', url: '/api/v2/products?sort=name&sort=-name', headers: { cookie } });
    expect(duplicateSort.statusCode).toBe(400);
    expect(duplicateSort.json()).toMatchObject({ code: 'VALIDATION_FAILED', meta: { violations: [{ field: 'sort' }] } });
    const firstProductPage = await http.inject({ method: 'GET', url: '/api/v2/products?sort=name&page%5Bsize%5D=1', headers: { cookie } });
    const nameCursor = firstProductPage.json().page.nextCursor as string;
    const cursorSortReuse = await http.inject({ method: 'GET', url: `/api/v2/products?sort=-name&page%5Bafter%5D=${encodeURIComponent(nameCursor)}`, headers: { cookie } });
    expect(cursorSortReuse.statusCode).toBe(400);
    expect(cursorSortReuse.json()).toMatchObject({ code: 'VALIDATION_FAILED', meta: { kind: 'VALIDATION', violations: [{ field: 'page[after]', code: 'INVALID_CURSOR' }] } });

    const notReadyStatus = await http.inject({ method: 'GET', url: `/api/v2/files/${notReadyFileId}`, headers: { cookie } });
    expect(notReadyStatus.statusCode).toBe(200);
    expect(notReadyStatus.json()).toMatchObject({ id: notReadyFileId, status: 'SCANNING', href: `/api/v2/files/${notReadyFileId}` });
    const notReadyDownload = await http.inject({ method: 'POST', url: `/api/v2/files/${notReadyFileId}/download-intents`, headers: mutationHeaders });
    expect(notReadyDownload.statusCode).toBe(409);
    expect(notReadyDownload.json()).toMatchObject({ status: 409, code: 'FILE_NOT_READY', retryable: true, meta: { kind: 'FILE_NOT_READY', fileId: notReadyFileId, state: 'SCANNING', statusHref: `/api/v2/files/${notReadyFileId}` } });
    expect(notReadyDownload.headers['cache-control']).toBe('no-store');

    const sku = await http.inject({
      method: 'POST',
      url: '/api/v2/skus',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-sku-command-1' },
      payload: { productId: product.json().id, skuCode: 'V2-SKU-1', name: 'V2 SKU', unit: 'PCS', standardizationMode: 'STRICT' },
    });
    expect(sku.statusCode).toBe(201);
    expect(sku.json()).toMatchObject({ trackingMode: 'NONE', baseUnit: 'PCS', standardizationMode: 'STRICT', lowStockThreshold: '0.000000' });
    const skusByCode = await http.inject({ method: 'GET', url: '/api/v2/skus?sort=skuCode&page%5Bsize%5D=100', headers: { cookie } });
    expect(skusByCode.statusCode).toBe(200);
    expect(skusByCode.json().data.map((value: { skuCode: string }) => value.skuCode)).toEqual(['V2-SKU-1']);
    for (const sort of ['skuCode', '-skuCode', 'name', '-name', 'status', '-status', 'id', '-id', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt', '-updatedAt,-id']) {
      const response = await http.inject({ method: 'GET', url: `/api/v2/skus?sort=${sort}&page%5Bsize%5D=100`, headers: { cookie } });
      expect(response.statusCode, `SKU sort ${sort}`).toBe(200);
    }
    const duplicateSkuFilter = await http.inject({ method: 'GET', url: '/api/v2/skus?filter%5Bstatus%5D=ACTIVE&filter%5Bstatus%5D=INACTIVE', headers: { cookie } });
    expect(duplicateSkuFilter.statusCode).toBe(400);
    expect(duplicateSkuFilter.json()).toMatchObject({ code: 'VALIDATION_FAILED', meta: { violations: [{ field: 'filter[status]', code: 'DUPLICATE_QUERY_PARAMETER' }] } });
    for (const [skuCode, name, key] of [['V2-SKU-2', 'V2 SKU 2', 'v2-sku-command-2'], ['V2-SKU-3', 'V2 SKU 3', 'v2-sku-command-3'] as const]) {
      const extraSku = await http.inject({ method: 'POST', url: '/api/v2/skus', headers: { ...mutationHeaders, 'idempotency-key': key }, payload: { productId: product.json().id, skuCode, name, unit: 'PCS', standardizationMode: 'STRICT' } });
      expect(extraSku.statusCode).toBe(201);
    }
    const policyValidFrom = new Date(Date.now() - 1000).toISOString();
    const policy = await http.inject({
      method: 'PATCH',
      url: `/api/v2/skus/${sku.json().id}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-sku-policy-create-1', 'if-match': '"v1"' },
      payload: { pricePolicy: { action: 'CREATE', currency: 'USD', unitPrice: '10.0000', validFrom: policyValidFrom, validTo: null, isPrimary: true, riskBufferBps: 25 } },
    });
    expect(policy.statusCode).toBe(200);
    expect(policy.json()).toMatchObject({ version: 2, pricePolicies: [{ version: 1, currency: 'USD', unitPrice: '10.0000', isPrimary: true, riskBufferBps: 25, lifecycle: 'ACTIVE' }] });
    const policyId = policy.json().pricePolicies[0].policyId as string;
    const policyReplay = await http.inject({
      method: 'PATCH',
      url: `/api/v2/skus/${sku.json().id}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-sku-policy-create-1', 'if-match': '"v1"' },
      payload: { pricePolicy: { action: 'CREATE', currency: 'USD', unitPrice: '10.0000', validFrom: policyValidFrom, validTo: null, isPrimary: true, riskBufferBps: 25 } },
    });
    expect(policyReplay.statusCode).toBe(200);
    expect(policyReplay.headers['idempotent-replay']).toBe('true');

    const sameCurrencyOrder = await http.inject({
      method: 'POST',
      url: '/api/v2/orders',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-standard-order-usd-1' },
      payload: { customerId, orderNo: 'V2-SO-USD-1', currency: 'USD', lines: [{ itemKind: 'STANDARD', skuId: sku.json().id, quantity: '2' }] },
    });
    expect(sameCurrencyOrder.statusCode).toBe(201);
    expect(sameCurrencyOrder.json().lines[0]).toMatchObject({ itemKind: 'STANDARD', currency: 'USD', effectiveUnitPrice: '10.0000', priceSnapshot: { sourceKind: 'CATALOG_POLICY', sourceCurrency: 'USD', sourceUnitPrice: '10.0000' }, fxSnapshot: null });
    await pool.query(`INSERT INTO catalog.exchange_rate_snapshot (id,organization_id,base_currency,quote_currency,rate,source,captured_at,snapshot) VALUES ($1,$2,'USD','EUR',0.920000000000,'test-rate',clock_timestamp(),'{}'::jsonb)`, ['00000000-0000-4000-8000-000000000710', organizationId]);
    const crossCurrencyOrder = await http.inject({
      method: 'POST',
      url: '/api/v2/orders',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-standard-order-eur-1' },
      payload: { customerId, orderNo: 'V2-SO-EUR-1', currency: 'EUR', lines: [{ itemKind: 'STANDARD', skuId: sku.json().id, quantity: '2' }] },
    });
    expect(crossCurrencyOrder.statusCode).toBe(201);
    expect(crossCurrencyOrder.json().lines[0]).toMatchObject({ itemKind: 'STANDARD', currency: 'EUR', priceSnapshot: { sourceCurrency: 'USD' }, fxSnapshot: { baseCurrency: 'USD', quoteCurrency: 'EUR', riskBufferBps: 25 } });
    const crossCurrencyOrderClone = await http.inject({
      method: 'POST',
      url: '/api/v2/orders',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-standard-order-eur-2' },
      payload: { customerId, orderNo: 'V2-SO-EUR-2', currency: 'EUR', lines: [{ itemKind: 'STANDARD', skuId: sku.json().id, quantity: '2' }] },
    });
    expect(crossCurrencyOrderClone.statusCode).toBe(201);
    const crossSnapshotRows = (await pool.query<{ order_id: string; price_snapshot_v2_id: string; fx_snapshot_v2_id: string }>('SELECT order_id,price_snapshot_v2_id,fx_snapshot_v2_id FROM orders.order_item WHERE organization_id=$1 AND order_id=ANY($2::uuid[]) ORDER BY order_id', [organizationId, [crossCurrencyOrder.json().id, crossCurrencyOrderClone.json().id]])).rows;
    expect(crossSnapshotRows).toHaveLength(2);
    expect(new Set(crossSnapshotRows.map((row) => row.price_snapshot_v2_id)).size).toBe(2);
    expect(new Set(crossSnapshotRows.map((row) => row.fx_snapshot_v2_id)).size).toBe(2);
    const policyReplacement = await http.inject({
      method: 'PATCH',
      url: `/api/v2/skus/${sku.json().id}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-sku-policy-replace-1', 'if-match': '"v2"' },
      payload: { pricePolicy: { action: 'REPLACE', policyId, version: 1, currency: 'USD', unitPrice: '11.0000', validFrom: policyValidFrom, validTo: null, isPrimary: true, riskBufferBps: 25 } },
    });
    expect(policyReplacement.statusCode).toBe(200);
    expect(policyReplacement.json()).toMatchObject({ version: 3, pricePolicies: [{ policyId, version: 2, unitPrice: '11.0000' }] });
    const stalePolicy = await http.inject({
      method: 'PATCH',
      url: `/api/v2/skus/${sku.json().id}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-sku-policy-stale-1', 'if-match': '"v3"' },
      payload: { pricePolicy: { action: 'REPLACE', policyId, version: 1, currency: 'USD', unitPrice: '12.0000', validFrom: policyValidFrom, validTo: null, isPrimary: true, riskBufferBps: 25 } },
    });
    expect(stalePolicy.statusCode).toBe(409);
    expect(stalePolicy.json()).toMatchObject({ code: 'VERSION_CONFLICT' });

    const order = await http.inject({
      method: 'POST',
      url: '/api/v2/orders',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-command-1' },
      payload: { customerId, orderNo: 'V2-SO-1', currency: 'USD', lines: [{ itemKind: 'NON_STANDARD', name: 'Custom item', unit: 'PCS', quantity: '2', quotedUnitPrice: '3.50', standardizationMode: 'SIMPLE' }] },
    });
    expect(order.statusCode).toBe(201);
    expect(order.json()).toMatchObject({ status: 'DRAFT', stage: 'INITIAL_CONTACT', capabilities: expect.arrayContaining(['order.update', 'order.transition']), allowedTransitions: [{ action: 'ADVANCE', toStage: 'QUOTING' }, { action: 'CANCEL' }] });
    expect(order.json().lines[0]).toMatchObject({ itemKind: 'NON_STANDARD', currency: 'USD', fxSnapshot: null, priceSnapshot: { sourceKind: 'MANUAL_QUOTE', sourceCurrency: 'USD' } });
    const ordersByNumber = await http.inject({ method: 'GET', url: '/api/v2/orders?sort=orderNo&page%5Bsize%5D=100', headers: { cookie } });
    expect(ordersByNumber.statusCode).toBe(200);
    expect(ordersByNumber.json().data.map((value: { orderNo: string }) => value.orderNo)).toEqual(['V2-SO-1', 'V2-SO-EUR-1', 'V2-SO-EUR-2', 'V2-SO-USD-1']);
    for (const sort of ['orderNo', '-orderNo', 'status', '-status', 'id', '-id', 'createdAt', '-createdAt', 'updatedAt', '-updatedAt', '-updatedAt,-id']) {
      const response = await http.inject({ method: 'GET', url: `/api/v2/orders?sort=${sort}&page%5Bsize%5D=100`, headers: { cookie } });
      expect(response.statusCode, `Order sort ${sort}`).toBe(200);
    }
    const duplicateOrderPageSize = await http.inject({ method: 'GET', url: '/api/v2/orders?page%5Bsize%5D=1&page%5Bsize%5D=2', headers: { cookie } });
    expect(duplicateOrderPageSize.statusCode).toBe(400);
    expect(duplicateOrderPageSize.json()).toMatchObject({ code: 'VALIDATION_FAILED', meta: { violations: [{ field: 'page[size]', code: 'DUPLICATE_QUERY_PARAMETER' }] } });

    // Exercise the actual PostgreSQL precision boundary. pg's default Date parser rounds
    // timestamptz to milliseconds, while the keyset predicate must retain all six digits.
    await pool.query(`WITH ranked AS (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM catalog.product WHERE organization_id=$1)
      UPDATE catalog.product p SET created_at=timestamp with time zone '2026-01-01 00:00:00+00' + GREATEST(ranked.rn - 2, 0) * interval '1 microsecond', updated_at=timestamp with time zone '2026-01-01 00:00:00+00' + GREATEST(ranked.rn - 2, 0) * interval '1 microsecond'
      FROM ranked WHERE p.id=ranked.id`, [organizationId]);
    await pool.query(`WITH ranked AS (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM catalog.sku WHERE organization_id=$1)
      UPDATE catalog.sku s SET created_at=timestamp with time zone '2026-01-01 00:00:00+00' + GREATEST(ranked.rn - 2, 0) * interval '1 microsecond', updated_at=timestamp with time zone '2026-01-01 00:00:00+00' + GREATEST(ranked.rn - 2, 0) * interval '1 microsecond'
      FROM ranked WHERE s.id=ranked.id`, [organizationId]);
    await pool.query(`WITH ranked AS (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM orders.order_header WHERE organization_id=$1)
      UPDATE orders.order_header o SET created_at=timestamp with time zone '2026-01-01 00:00:00+00' + GREATEST(ranked.rn - 2, 0) * interval '1 microsecond', updated_at=timestamp with time zone '2026-01-01 00:00:00+00' + GREATEST(ranked.rn - 2, 0) * interval '1 microsecond'
      FROM ranked WHERE o.id=ranked.id`, [organizationId]);
    const collectPageIds = async (path: string, sort: string, expectedCount: number): Promise<string[]> => {
      const ids: string[] = [];
      let after: string | undefined;
      for (let page = 0; page < expectedCount + 2; page += 1) {
        const query = new URLSearchParams({ sort, 'page[size]': '1' });
        if (after !== undefined) query.set('page[after]', after);
        const response = await http.inject({ method: 'GET', url: `${path}?${query.toString()}`, headers: { cookie } });
        expect(response.statusCode, `${path} sort=${sort} page=${page}`).toBe(200);
        const body = response.json() as { data: Array<{ id: string }>; page: { hasNext: boolean; nextCursor: string | null } };
        ids.push(...body.data.map((item) => item.id));
        if (!body.page.hasNext) {
          expect(body.page.nextCursor).toBeNull();
          expect(ids).toHaveLength(expectedCount);
          expect(new Set(ids).size).toBe(expectedCount);
          return ids;
        }
        expect(body.page.nextCursor).toEqual(expect.any(String));
        expect(body.page.nextCursor).not.toBe(after);
        after = body.page.nextCursor!;
      }
      throw new Error(`keyset pagination did not terminate for ${path} sort=${sort}`);
    };
    for (const sort of ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', '-updatedAt,-id']) await collectPageIds('/api/v2/products', sort, 3);
    for (const sort of ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', '-updatedAt,-id']) await collectPageIds('/api/v2/skus', sort, 3);
    for (const sort of ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', '-updatedAt,-id']) await collectPageIds('/api/v2/orders', sort, 4);

    const snapshotOrder = await http.inject({
      method: 'POST',
      url: '/api/v2/orders',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-snapshot-order-1' },
      payload: { customerId, orderNo: 'V2-SO-SNAPSHOT-1', currency: 'USD', lines: [{ itemKind: 'NON_STANDARD', name: 'Custom item', unit: 'PCS', quantity: '2', quotedUnitPrice: '3.50', standardizationMode: 'SIMPLE' }] },
    });
    expect(snapshotOrder.statusCode).toBe(201);
    const snapshotOrderId = snapshotOrder.json().id as string;
    const snapshotLineId = snapshotOrder.json().lines[0].lineId as string;
    const initialOrderId = order.json().id as string;
    const sameFactOrderSnapshots = (await pool.query<{ order_id: string; snapshot_id: string }>('SELECT order_id,price_snapshot_v2_id AS snapshot_id FROM orders.order_item WHERE organization_id=$1 AND order_id=ANY($2::uuid[]) ORDER BY order_id', [organizationId, [initialOrderId, snapshotOrderId]])).rows;
    expect(sameFactOrderSnapshots).toHaveLength(2);
    expect(new Set(sameFactOrderSnapshots.map((row) => row.snapshot_id)).size).toBe(2);
    const beforeSnapshotEdit = (await pool.query<{ id: string; fingerprint: string }>('SELECT ps.id,ps.fingerprint FROM orders.order_item oi JOIN catalog.price_snapshot_v2 ps ON ps.organization_id=oi.organization_id AND ps.id=oi.price_snapshot_v2_id WHERE oi.organization_id=$1 AND oi.order_id=$2', [organizationId, snapshotOrderId])).rows[0]!;
    const beforeSnapshotEffects = {
      snapshots: (await pool.query<{ count: number }>('SELECT count(*)::int AS count FROM catalog.price_snapshot_v2 WHERE organization_id=$1', [organizationId])).rows[0]!.count,
      audits: (await pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM audit.audit_event WHERE organization_id=$1 AND resource_type='ORDER' AND resource_id=$2 AND action='order.updated'`, [organizationId, snapshotOrderId])).rows[0]!.count,
      outbox: (await pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM integration.outbox_event WHERE organization_id=$1 AND aggregate_type='ORDER' AND aggregate_id=$2 AND event_type='order.updated'`, [organizationId, snapshotOrderId])).rows[0]!.count,
    };
    const snapshotEdit = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${snapshotOrderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-snapshot-order-edit-1', 'if-match': '"v1"' },
      payload: { lines: [{ itemKind: 'NON_STANDARD', lineId: snapshotLineId, name: 'Custom item', unit: 'PCS', quantity: '2', quotedUnitPrice: '3.50', standardizationMode: 'SIMPLE', imageFileId: null }] },
    });
    expect(snapshotEdit.statusCode).toBe(200);
    const afterSnapshotEdit = (await pool.query<{ id: string; fingerprint: string; count: string }>('SELECT oi.price_snapshot_v2_id AS id,ps.fingerprint,(SELECT count(*)::text FROM catalog.price_snapshot_v2 WHERE organization_id=$1 AND fingerprint=$2) FROM orders.order_item oi JOIN catalog.price_snapshot_v2 ps ON ps.organization_id=oi.organization_id AND ps.id=oi.price_snapshot_v2_id WHERE oi.organization_id=$1 AND oi.order_id=$3', [organizationId, beforeSnapshotEdit.fingerprint, snapshotOrderId])).rows[0]!;
    expect(afterSnapshotEdit.id).not.toBe(beforeSnapshotEdit.id);
    await expect(pool.query('SELECT id FROM catalog.price_snapshot_v2 WHERE organization_id=$1 AND id=$2', [organizationId, beforeSnapshotEdit.id])).resolves.toMatchObject({ rows: [{ id: beforeSnapshotEdit.id }] });
    expect(afterSnapshotEdit.count).toBe('1');
    const afterSnapshotEffects = {
      snapshots: (await pool.query<{ count: number }>('SELECT count(*)::int AS count FROM catalog.price_snapshot_v2 WHERE organization_id=$1', [organizationId])).rows[0]!.count,
      audits: (await pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM audit.audit_event WHERE organization_id=$1 AND resource_type='ORDER' AND resource_id=$2 AND action='order.updated'`, [organizationId, snapshotOrderId])).rows[0]!.count,
      outbox: (await pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM integration.outbox_event WHERE organization_id=$1 AND aggregate_type='ORDER' AND aggregate_id=$2 AND event_type='order.updated'`, [organizationId, snapshotOrderId])).rows[0]!.count,
    };
    expect(afterSnapshotEffects).toEqual({ snapshots: beforeSnapshotEffects.snapshots + 1, audits: beforeSnapshotEffects.audits + 1, outbox: beforeSnapshotEffects.outbox + 1 });
    const snapshotEditReplay = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${snapshotOrderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-snapshot-order-edit-1', 'if-match': '"v1"' },
      payload: { lines: [{ itemKind: 'NON_STANDARD', lineId: snapshotLineId, name: 'Custom item', unit: 'PCS', quantity: '2', quotedUnitPrice: '3.50', standardizationMode: 'SIMPLE', imageFileId: null }] },
    });
    expect(snapshotEditReplay.statusCode).toBe(200);
    expect(snapshotEditReplay.headers['idempotent-replay']).toBe('true');
    await expect(pool.query<{ count: number }>('SELECT count(*)::int AS count FROM catalog.price_snapshot_v2 WHERE organization_id=$1', [organizationId])).resolves.toMatchObject({ rows: [{ count: afterSnapshotEffects.snapshots }] });
    await expect(pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM audit.audit_event WHERE organization_id=$1 AND resource_type='ORDER' AND resource_id=$2 AND action='order.updated'`, [organizationId, snapshotOrderId])).resolves.toMatchObject({ rows: [{ count: afterSnapshotEffects.audits }] });
    await expect(pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM integration.outbox_event WHERE organization_id=$1 AND aggregate_type='ORDER' AND aggregate_id=$2 AND event_type='order.updated'`, [organizationId, snapshotOrderId])).resolves.toMatchObject({ rows: [{ count: afterSnapshotEffects.outbox }] });

    const orderId = order.json().id as string;
    const read = await http.inject({ method: 'GET', url: `/api/v2/orders/${orderId}`, headers: { cookie } });
    expect(read.statusCode).toBe(200);
    expect(read.headers.etag).toBe('"v1"');
    const patch = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${orderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-edit-1', 'if-match': '"v1"' },
      payload: { metadata: { source: 'v2-test' }, lines: [{ itemKind: 'NON_STANDARD', lineId: order.json().lines[0].lineId, name: 'Custom item revised', unit: 'PCS', quantity: '1', quotedUnitPrice: '4.00', standardizationMode: 'SIMPLE', imageFileId }] },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().metadata).toEqual({ source: 'v2-test' });
    expect(patch.json().totalAmount).toBe('4.0000');
    await expect(pool.query('SELECT resource_type,resource_id,purpose,resource_owner_id FROM files.file_link WHERE organization_id=$1 AND file_id=$2', [organizationId, imageFileId])).resolves.toMatchObject({ rows: [{ resource_type: 'ORDER', resource_id: orderId, purpose: 'IMAGE', resource_owner_id: actorId }] });

    const replaceImage = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${orderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-image-replace-1', 'if-match': '"v2"' },
      payload: { lines: [{ itemKind: 'NON_STANDARD', lineId: order.json().lines[0].lineId, name: 'Custom item replaced', unit: 'PCS', quantity: '1', quotedUnitPrice: '5.00', standardizationMode: 'SIMPLE', imageFileId: replacementImageFileId }] },
    });
    expect(replaceImage.statusCode).toBe(200);
    await expect(pool.query('SELECT file_id FROM files.file_link WHERE organization_id=$1 AND resource_type=\'ORDER\' AND resource_id=$2 AND purpose=\'IMAGE\' ORDER BY file_id', [organizationId, orderId])).resolves.toMatchObject({ rows: [{ file_id: replacementImageFileId }] });
    const replaceReplay = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${orderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-image-replace-1', 'if-match': '"v2"' },
      payload: { lines: [{ itemKind: 'NON_STANDARD', lineId: order.json().lines[0].lineId, name: 'Custom item replaced', unit: 'PCS', quantity: '1', quotedUnitPrice: '5.00', standardizationMode: 'SIMPLE', imageFileId: replacementImageFileId }] },
    });
    expect(replaceReplay.statusCode).toBe(200);
    await expect(pool.query('SELECT count(*)::int AS count FROM files.file_link WHERE organization_id=$1 AND resource_type=\'ORDER\' AND resource_id=$2 AND purpose=\'IMAGE\'', [organizationId, orderId])).resolves.toMatchObject({ rows: [{ count: 1 }] });
    const removeImage = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${orderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-image-remove-1', 'if-match': '"v3"' },
      payload: { lines: [{ itemKind: 'NON_STANDARD', lineId: order.json().lines[0].lineId, name: 'Custom item without image', unit: 'PCS', quantity: '1', quotedUnitPrice: '5.00', standardizationMode: 'SIMPLE', imageFileId: null }] },
    });
    expect(removeImage.statusCode).toBe(200);
    await expect(pool.query('SELECT count(*)::int AS count FROM files.file_link WHERE organization_id=$1 AND resource_type=\'ORDER\' AND resource_id=$2 AND purpose=\'IMAGE\'', [organizationId, orderId])).resolves.toMatchObject({ rows: [{ count: 0 }] });
    const rollbackImage = await http.inject({
      method: 'PATCH',
      url: `/api/v2/orders/${orderId}`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-image-rollback-1', 'if-match': '"v4"' },
      payload: { lines: [{ itemKind: 'NON_STANDARD', lineId: order.json().lines[0].lineId, name: 'Should rollback', unit: 'PCS', quantity: '1', quotedUnitPrice: '6.00', standardizationMode: 'SIMPLE', imageFileId: notReadyFileId }] },
    });
    expect(rollbackImage.statusCode).toBe(409);
    await expect(pool.query('SELECT count(*)::int AS count FROM files.file_link WHERE organization_id=$1 AND resource_type=\'ORDER\' AND resource_id=$2 AND purpose=\'IMAGE\'', [organizationId, orderId])).resolves.toMatchObject({ rows: [{ count: 0 }] });

    const cancelled = await http.inject({
      method: 'POST',
      url: `/api/v2/orders/${orderId}/transitions`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-cancel-1', 'if-match': '"v4"' },
      payload: { action: 'CANCEL' },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json()).toMatchObject({ status: 'CANCELLED', allowedTransitions: [], capabilities: [] });

    const invalidQuery = await http.inject({ method: 'GET', url: '/api/v2/products?sort=not-allowlisted', headers: { cookie } });
    expect(invalidQuery.statusCode).toBe(400);
    expect(invalidQuery.json()).toMatchObject({ code: 'VALIDATION_FAILED' });

    const repository = app.get<PostgresIdempotencyRepository>(IDEMPOTENCY_REPOSITORY);
    type FenceOwnerHook = (client: unknown, claim: unknown) => Promise<unknown>;
    const fenced = repository as unknown as { fenceOwner: FenceOwnerHook };
    const originalFenceOwner = fenced.fenceOwner.bind(repository);
    fenced.fenceOwner = async () => { throw new IdempotencyOwnershipLostError(); };
    const ownershipLossRequest = {
      method: 'POST' as const,
      url: '/api/v2/products',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-owner-loss-1' },
      payload: { productCode: 'V2-OWNER-LOSS', name: 'Owner loss', unit: 'PCS' },
    };
    const ownershipLoss = await http.inject(ownershipLossRequest);
    expect(ownershipLoss.statusCode).toBe(500);
    expect(ownershipLoss.json()).toMatchObject({ status: 500, code: 'INTERNAL_ERROR', retryable: true });
    await expect(pool.query<{ state: string; http_status: number | null; problem_body: unknown }>("SELECT state,http_status,problem_body FROM integration.idempotency_record WHERE organization_id=$1 AND actor_user_id=$2 AND operation_id='createProductV2' AND key_hash=digest('v2-owner-loss-1','sha256')", [organizationId, actorId])).resolves.toSatisfy((result) => result.rows[0]?.state === 'IN_PROGRESS' && result.rows[0]?.http_status === null && result.rows[0]?.problem_body === null);
    await expect(pool.query('SELECT count(*)::int AS count FROM catalog.product WHERE organization_id=$1 AND product_code=$2', [organizationId, 'V2-OWNER-LOSS'])).resolves.toMatchObject({ rows: [{ count: 0 }] });
    fenced.fenceOwner = originalFenceOwner;
    const ownershipRecovered = await http.inject(ownershipLossRequest);
    expect(ownershipRecovered.statusCode).toBe(201);
  });

  async function seed(database: pg.Pool): Promise<void> {
    await database.query('INSERT INTO org.organization (id, code, name) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [organizationId, 'v2-formal', 'V2 Formal']);
    await database.query(`INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name) VALUES ($1,$2,'LOCAL_PASSWORD','v2-subject','v2@example.test','V2 User') ON CONFLICT DO NOTHING`, [actorId, organizationId]);
    await database.query('INSERT INTO org.business_group (id, organization_id, code, name) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [groupId, organizationId, 'V2-GROUP', 'V2 Group']);
    await database.query('INSERT INTO org.membership (id, organization_id, user_id, business_group_id, is_primary) VALUES ($1,$2,$3,$4,true) ON CONFLICT DO NOTHING', ['00000000-0000-4000-8000-000000000705', organizationId, actorId, groupId]);
    await database.query('INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', ['00000000-0000-4000-8000-000000000706', organizationId, actorId, '00000000-0000-4000-8000-000000001001']);
    for (const [id, resourceType] of [['00000000-0000-4000-8000-000000000707', 'ORGANIZATION'], ['00000000-0000-4000-8000-000000000708', 'ORDER'], ['00000000-0000-4000-8000-000000000709', 'FILE']] as const) {
      await database.query('INSERT INTO iam.user_data_scope (id, organization_id, user_id, resource_type, scope_type) VALUES ($1,$2,$3,$4,\'ALL_ORG\') ON CONFLICT DO NOTHING', [id, organizationId, actorId, resourceType]);
    }
    await database.query('INSERT INTO crm.customer (id, organization_id, name, owner_user_id, business_group_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [customerId, organizationId, 'V2 Customer', actorId, groupId]);
    await database.query(`INSERT INTO files.file_object (id, organization_id, created_by, business_group_id, object_key, original_name, declared_content_type, declared_size_bytes, status, metadata) VALUES ($1,$2,$3,$4,$5,'v2-image.png','image/png',12,'AVAILABLE','{}'::jsonb) ON CONFLICT DO NOTHING`, [imageFileId, organizationId, actorId, groupId, `v2-formal-image-object-key-${imageFileId}`]);
    await database.query(`INSERT INTO files.file_object (id, organization_id, created_by, business_group_id, object_key, original_name, declared_content_type, declared_size_bytes, status, metadata) VALUES ($1,$2,$3,$4,$5,'v2-replacement-image.png','image/png',12,'AVAILABLE','{}'::jsonb) ON CONFLICT DO NOTHING`, [replacementImageFileId, organizationId, actorId, groupId, `v2-formal-replacement-image-object-key-${replacementImageFileId}`]);
    await database.query(`INSERT INTO files.file_object (id, organization_id, created_by, business_group_id, object_key, original_name, declared_content_type, declared_size_bytes, status, metadata) VALUES ($1,$2,$3,$4,$5,'v2-not-ready-image.png','image/png',12,'SCANNING','{}'::jsonb) ON CONFLICT DO NOTHING`, [notReadyFileId, organizationId, actorId, groupId, `v2-formal-not-ready-image-object-key-${notReadyFileId}`]);
  }
});

function cookieFrom(value: string | string[] | undefined): string {
  const cookie = Array.isArray(value) ? value[0] : value;
  if (cookie === undefined) throw new Error('Expected a session cookie');
  return cookie.split(';', 1)[0] as string;
}
