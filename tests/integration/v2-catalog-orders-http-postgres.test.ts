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

    const sku = await http.inject({
      method: 'POST',
      url: '/api/v2/skus',
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-sku-command-1' },
      payload: { productId: product.json().id, skuCode: 'V2-SKU-1', name: 'V2 SKU', unit: 'PCS', standardizationMode: 'STRICT' },
    });
    expect(sku.statusCode).toBe(201);
    expect(sku.json()).toMatchObject({ trackingMode: 'NONE', baseUnit: 'PCS', standardizationMode: 'STRICT', lowStockThreshold: '0.000000' });
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

    const cancelled = await http.inject({
      method: 'POST',
      url: `/api/v2/orders/${orderId}/transitions`,
      headers: { ...mutationHeaders, 'idempotency-key': 'v2-order-cancel-1', 'if-match': '"v2"' },
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
  }
});

function cookieFrom(value: string | string[] | undefined): string {
  const cookie = Array.isArray(value) ? value[0] : value;
  if (cookie === undefined) throw new Error('Expected a session cookie');
  return cookie.split(';', 1)[0] as string;
}
