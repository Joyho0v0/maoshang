import 'reflect-metadata';
import pg from 'pg';
import { createHash } from 'node:crypto';
import { createApp } from '../../apps/api/src/main.js';
import { ControlledAuthenticationProvider, hashControlledPassword } from '../../apps/api/src/modules/identity/application/controlled-authentication.provider.js';
import { PostgresCrmStore } from '../../apps/api/src/modules/crm/infrastructure/postgres-crm.store.js';
import { randomUUID } from 'node:crypto';

describe('CRM/Catalog/Orders HTTP PostgreSQL vertical slice', () => {
  const organizationId = '00000000-0000-4000-8000-000000000601';
  const actorId = '00000000-0000-4000-8000-000000000602';
  const groupId = '00000000-0000-4000-8000-000000000603';
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
      authenticationProvider: new ControlledAuthenticationProvider([{ username: 'be-imp-04@example.test', subject: 'be-imp-04-subject', passwordHash: hashControlledPassword('pw') }]),
    });
    await app.init();
    const http = app.getHttpAdapter().getInstance();
    const csrf = await http.inject({ method: 'GET', url: '/api/v1/auth/csrf' });
    expect(csrf.statusCode).toBe(200);
    const bootstrapCookie = cookieFrom(csrf.headers['set-cookie']);
    csrfToken = csrf.json().csrfToken as string;
    const login = await http.inject({
      method: 'POST',
      url: '/api/v1/auth/sessions',
      headers: { cookie: bootstrapCookie, 'x-csrf-token': csrfToken },
      payload: { provider: 'LOCAL_PASSWORD', username: 'be-imp-04@example.test', password: 'pw' },
    });
    expect(login.statusCode).toBe(201);
    cookie = cookieFrom(login.headers['set-cookie']);
    csrfToken = login.json().csrfToken as string;
  });

  afterAll(async () => {
    if (app !== undefined) await app.close();
    if (pool !== undefined) await pool.end();
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('persists the three resources, replays idempotency, and exposes audit/outbox evidence', async () => {
    if (app === undefined || pool === undefined) return;
    const http = app.getHttpAdapter().getInstance();
    const headers = { cookie, 'x-csrf-token': csrfToken };

    const productRequest = {
      method: 'POST' as const,
      url: '/api/v1/products',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-product-1' },
      payload: { name: 'Widget', productCode: 'W-1', unit: 'PCS' },
    };
    const product = await http.inject(productRequest);
    expect(product.statusCode).toBe(201);
    expect(product.headers.etag).toBe('"v1"');
    expect(product.headers.location).toBe(`/api/v1/products/${product.json().id}`);
    const replay = await http.inject(productRequest);
    expect(replay.statusCode).toBe(201);
    expect(replay.headers['idempotent-replay']).toBe('true');

    const sku = await http.inject({
      method: 'POST',
      url: '/api/v1/skus',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-sku-1' },
      payload: { productId: product.json().id, skuCode: 'W-1-PCS', name: 'Widget SKU', unit: 'PCS', price: '12.34' },
    });
    expect(sku.statusCode).toBe(201);
    expect(sku.json()).toMatchObject({ trackingMode: 'NONE', baseUnit: 'PCS', lowStockThreshold: '0.000000', price: '12.3400' });

    const customer = await http.inject({
      method: 'POST',
      url: '/api/v1/customers',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-customer-1' },
      payload: { name: 'Acme', ownerUserId: actorId, contacts: [{ countryCode: 'CN', timezone: 'Asia/Shanghai' }] },
    });
    expect(customer.statusCode).toBe(201);
    expect(customer.json()).toMatchObject({ status: 'DRAFT', ownerUserId: actorId, businessGroupId: groupId, version: 1 });

    const submitted = await http.inject({
      method: 'POST',
      url: `/api/v1/customers/${customer.json().id}/submit-approval`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-customer-submit-1', 'if-match': '"v1"' },
      payload: { action: 'SUBMIT_APPROVAL' },
    });
    expect(submitted.statusCode).toBe(200);
    expect(submitted.json()).toMatchObject({ status: 'PENDING_APPROVAL', version: 2, approvalSummary: { latestOutcome: 'PENDING' } });

    const order = await http.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-1' },
      payload: { customerId: customer.json().id, orderNo: 'SO-BE-IMP-04-1', currency: 'USD', lines: [{ skuId: sku.json().id, quantity: '0.10', unitPrice: '0.20' }, { skuId: sku.json().id, quantity: '2', unitPrice: '3.50' }] },
    });
    expect(order.statusCode).toBe(201);
    expect(order.json()).toMatchObject({ totalAmount: '7.0200', status: 'DRAFT', stage: 'INITIAL_CONTACT' });

    const bypass = await http.inject({
      method: 'PATCH',
      url: `/api/v1/orders/${order.json().id}`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-status-bypass', 'if-match': '"v1"' },
      payload: { status: 'CONFIRMED' },
    });
    expect(bypass.statusCode).toBe(409);
    expect(bypass.json()).toMatchObject({ code: 'STATE_CONFLICT' });
    const bypassReplay = await http.inject({
      method: 'PATCH',
      url: `/api/v1/orders/${order.json().id}`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-status-bypass', 'if-match': '"v1"' },
      payload: { status: 'CONFIRMED' },
    });
    expect(bypassReplay.statusCode).toBe(409);

    const cancelled = await http.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.json().id}/transitions`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-cancel', 'if-match': '"v1"' },
      payload: { action: 'CANCEL' },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json()).toMatchObject({ status: 'CANCELLED', allowedTransitions: [] });
    const cancelledTransition = await http.inject({
      method: 'POST',
      url: `/api/v1/orders/${order.json().id}/transitions`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-cancelled-transition', 'if-match': '"v2"' },
      payload: { action: 'QUOTING' },
    });
    expect(cancelledTransition.statusCode).toBe(409);
    expect(cancelledTransition.json()).toMatchObject({ code: 'INVALID_TRANSITION' });

    const invalidDecimalRequest = {
      method: 'POST' as const,
      url: '/api/v1/orders',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-invalid-decimal' },
      payload: { customerId: customer.json().id, orderNo: 'SO-BE-IMP-04-DECIMAL', currency: 'USD', lines: [{ skuId: sku.json().id, quantity: '0', unitPrice: '1.00000' }] },
    };
    const invalidDecimal = await http.inject(invalidDecimalRequest);
    expect(invalidDecimal.statusCode).toBe(400);
    expect(invalidDecimal.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
    const invalidDecimalReplay = await http.inject(invalidDecimalRequest);
    expect(invalidDecimalReplay.statusCode).toBe(400);
    expect(invalidDecimalReplay.json()).toMatchObject({ code: 'VALIDATION_FAILED', status: 400 });
    const invalidDecimalConflict = await http.inject({ ...invalidDecimalRequest, payload: { ...invalidDecimalRequest.payload, lines: [{ skuId: sku.json().id, quantity: '1', unitPrice: '1.00000' }] } });
    expect(invalidDecimalConflict.statusCode).toBe(409);
    expect(invalidDecimalConflict.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });

    const stale = await http.inject({
      method: 'PATCH',
      url: `/api/v1/products/${product.json().id}`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-product-stale', 'if-match': '"v1"' },
      payload: { name: 'Widget v2' },
    });
    expect(stale.statusCode).toBe(200);
    const conflict = await http.inject({
      method: 'PATCH',
      url: `/api/v1/products/${product.json().id}`,
      headers: { ...headers, 'idempotency-key': 'be-imp-04-product-conflict', 'if-match': '"v1"' },
      payload: { name: 'Widget v3' },
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json()).toMatchObject({ code: 'VERSION_CONFLICT', meta: { currentVersion: 2, currentEtag: '"v2"' } });

    const invalidOrder = await http.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-rollback' },
      payload: { customerId: customer.json().id, orderNo: 'SO-BE-IMP-04-ROLLBACK', currency: 'USD', lines: [{ skuId: '00000000-0000-4000-8000-000000000699', quantity: '1', unitPrice: '1.00' }] },
    });
    expect(invalidOrder.statusCode).toBe(409);
    expect(invalidOrder.json()).toMatchObject({ code: 'BUSINESS_RULE_VIOLATION' });
    const invalidOrderReplay = await http.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { ...headers, 'idempotency-key': 'be-imp-04-order-rollback' },
      payload: { customerId: customer.json().id, orderNo: 'SO-BE-IMP-04-ROLLBACK', currency: 'USD', lines: [{ skuId: '00000000-0000-4000-8000-000000000699', quantity: '1', unitPrice: '1.00' }] },
    });
    expect(invalidOrderReplay.statusCode).toBe(409);
    expect(invalidOrderReplay.json()).toMatchObject({ code: 'BUSINESS_RULE_VIOLATION', status: 409 });
    await expect(pool.query('SELECT 1 FROM orders.order_header WHERE order_no = $1', ['SO-BE-IMP-04-ROLLBACK'])).resolves.toMatchObject({ rowCount: 0 });

    const failedLedger = await pool.query<{ state: string; http_status: number; completed: boolean }>(`SELECT state, http_status, completed_at IS NOT NULL AS completed FROM integration.idempotency_record WHERE organization_id = $1 AND operation_id = 'createOrder' AND key_hash = $2`, [organizationId, createHash('sha256').update('be-imp-04-order-invalid-decimal').digest()]);
    expect(failedLedger.rows[0]).toMatchObject({ state: 'FAILED', http_status: 400, completed: true });

    const counts = await pool.query<{ audit_count: string; outbox_count: string }>(`SELECT (SELECT count(*)::text FROM audit.audit_event WHERE organization_id = $1 AND resource_type IN ('CUSTOMER', 'ORDER', 'PRODUCT', 'SKU')) AS audit_count, (SELECT count(*)::text FROM integration.outbox_event WHERE organization_id = $1 AND aggregate_type IN ('CUSTOMER', 'ORDER', 'CATALOG')) AS outbox_count`, [organizationId]);
    expect(Number(counts.rows[0]?.audit_count)).toBeGreaterThanOrEqual(8);
    expect(Number(counts.rows[0]?.outbox_count)).toBeGreaterThanOrEqual(5);
    const failureAudits = await pool.query<{ action: string; outcome: string; reason: string | null }>(`SELECT action, outcome, reason FROM audit.audit_event WHERE organization_id = $1 AND outcome IN ('DENIED', 'FAILED') ORDER BY created_at`, [organizationId]);
    expect(failureAudits.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'order.update', outcome: 'FAILED', reason: 'status-stage-mismatch' }),
      expect.objectContaining({ action: 'order.transition', outcome: 'FAILED', reason: 'terminal-state' }),
      expect.objectContaining({ action: 'catalog.product.update', outcome: 'FAILED', reason: 'version-conflict' }),
    ]));
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('serializes concurrent HTTP owners for one catalog idempotency key', async () => {
    if (app === undefined || pool === undefined) return;
    const http = app.getHttpAdapter().getInstance();
    const request = {
      method: 'POST' as const,
      url: '/api/v1/products',
      headers: { cookie, 'x-csrf-token': csrfToken, 'idempotency-key': 'be-imp-04-product-concurrent' },
      payload: { name: 'Concurrent Widget', productCode: 'W-CONCURRENT', unit: 'PCS' },
    };
    const responses = await Promise.all([http.inject(request), http.inject(request)]);
    expect(responses.map((response) => response.statusCode).every((status) => status === 201 || status === 202)).toBe(true);
    expect(responses.some((response) => response.statusCode === 201)).toBe(true);
    await expect(pool.query('SELECT count(*)::int AS count FROM catalog.product WHERE organization_id = $1 AND product_code = $2', [organizationId, 'W-CONCURRENT'])).resolves.toMatchObject({ rows: [{ count: 1 }] });
  });

  it.skipIf(process.env.DATABASE_URL === undefined)('rejects a customer reassignment outside the actor group scope before any history write', async () => {
    if (pool === undefined) return;
    const targetGroupId = randomUUID();
    const targetUserId = randomUUID();
    const customerId = randomUUID();
    await pool.query('INSERT INTO org.business_group (id, organization_id, code, name) VALUES ($1, $2, $3, $4)', [targetGroupId, organizationId, `BE-IMP-04-B-${targetGroupId.slice(0, 8)}`, 'Out of scope group']);
    await pool.query(`INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name) VALUES ($1, $2, 'LOCAL_PASSWORD', $3, $4, 'Out of scope user')`, [targetUserId, organizationId, `${targetUserId}-subject`, `${targetUserId}@example.test`]);
    await pool.query('INSERT INTO org.membership (id, organization_id, user_id, business_group_id) VALUES ($1, $2, $3, $4)', [randomUUID(), organizationId, targetUserId, targetGroupId]);
    await pool.query(`INSERT INTO crm.customer (id, organization_id, name, owner_user_id, business_group_id) VALUES ($1, $2, 'Scope boundary customer', $3, $4)`, [customerId, organizationId, actorId, groupId]);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const store = new PostgresCrmStore(pool);
      await expect(store.commandCustomer(client, { organizationId, customerId, expectedVersion: 1, action: 'REASSIGN', actorUserId: actorId, requestId: randomUUID(), assigneeUserId: targetUserId, customerScope: { resourceType: 'CUSTOMER', scopeType: 'GROUP_SET', groupIds: [groupId] } })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
      await client.query('ROLLBACK');
      const current = await pool.query<{ business_group_id: string }>('SELECT business_group_id FROM crm.customer WHERE id = $1', [customerId]);
      const history = await pool.query('SELECT 1 FROM crm.customer_assignment_history WHERE customer_id = $1', [customerId]);
      expect(current.rows[0]?.business_group_id).toBe(groupId);
      expect(history.rowCount).toBe(0);
    } finally {
      client.release();
      await pool.query('DELETE FROM crm.customer WHERE id = $1', [customerId]);
      await pool.query('DELETE FROM org.membership WHERE user_id = $1', [targetUserId]);
      await pool.query('DELETE FROM iam.user_account WHERE id = $1', [targetUserId]);
      await pool.query('DELETE FROM org.business_group WHERE id = $1', [targetGroupId]);
    }
  });
});

async function seed(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO org.organization (id, code, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [organizationIdForSeed(), 'be-imp-04', 'BE-IMP-04']);
    await client.query(`INSERT INTO iam.user_account (id, organization_id, provider, provider_subject, username_normalized, display_name) VALUES ($1, $2, 'LOCAL_PASSWORD', 'be-imp-04-subject', 'be-imp-04@example.test', 'BE IMP 04') ON CONFLICT DO NOTHING`, [actorIdForSeed(), organizationIdForSeed()]);
    await client.query('INSERT INTO org.business_group (id, organization_id, code, name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [groupIdForSeed(), organizationIdForSeed(), 'BE-IMP-04-GROUP', 'BE IMP 04 Group']);
    await client.query('INSERT INTO org.membership (id, organization_id, user_id, business_group_id, is_primary) VALUES ($1, $2, $3, $4, true) ON CONFLICT DO NOTHING', ['00000000-0000-4000-8000-000000000606', organizationIdForSeed(), actorIdForSeed(), groupIdForSeed()]);
    await client.query('INSERT INTO iam.user_role_binding (id, organization_id, user_id, role_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', ['00000000-0000-4000-8000-000000000607', organizationIdForSeed(), actorIdForSeed(), '00000000-0000-4000-8000-000000001001']);
    for (const [id, resourceType] of [['00000000-0000-4000-8000-000000000608', 'ORGANIZATION'], ['00000000-0000-4000-8000-000000000609', 'CUSTOMER'], ['00000000-0000-4000-8000-000000000610', 'ORDER']] as const) {
      await client.query('INSERT INTO iam.user_data_scope (id, organization_id, user_id, resource_type, scope_type) VALUES ($1, $2, $3, $4, \'ALL_ORG\') ON CONFLICT DO NOTHING', [id, organizationIdForSeed(), actorIdForSeed(), resourceType]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function organizationIdForSeed(): string { return '00000000-0000-4000-8000-000000000601'; }
function actorIdForSeed(): string { return '00000000-0000-4000-8000-000000000602'; }
function groupIdForSeed(): string { return '00000000-0000-4000-8000-000000000603'; }

function cookieFrom(value: string | string[] | undefined): string {
  const cookie = Array.isArray(value) ? value[0] : value;
  if (cookie === undefined) throw new Error('Expected a session cookie.');
  return cookie.split(';', 1)[0] as string;
}
