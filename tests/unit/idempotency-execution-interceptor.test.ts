import { lastValueFrom, of } from 'rxjs';
import { IDEMPOTENT_RESOURCE_PROJECTORS, IdempotencyExecutionInterceptor, resourceReferenceForResponse } from '../../apps/api/src/common/security/idempotency-execution.interceptor.js';
import { requireIdempotencyTransaction } from '../../apps/api/src/common/security/idempotency-transaction-context.js';
import { IdempotencyConflictError } from '../../apps/api/src/modules/integration/idempotency/in-memory-idempotency-store.js';
import { EXPECTED_OPERATION_MANIFEST } from '../../packages/contracts/openapi/contract-manifest.js';
import { operations, type OperationId } from '../../packages/contracts/openapi/generated-client.js';

describe('idempotency execution interceptor', () => {
  const EXPECTED_PROJECTOR_POLICIES = {
    createUser: { type: 'USER', hrefPolicy: 'organization-user', pathParameter: 'id' },
    updateUserRoleBindings: { type: 'USER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    updateUserDataScopeGrants: { type: 'USER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createCustomer: { type: 'CUSTOMER', hrefPolicy: 'collection', pathParameter: null },
    updateCustomer: { type: 'CUSTOMER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    submitCustomerApproval: { type: 'CUSTOMER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    approveCustomer: { type: 'CUSTOMER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    rejectCustomer: { type: 'CUSTOMER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    reassignCustomer: { type: 'CUSTOMER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createProduct: { type: 'PRODUCT', hrefPolicy: 'collection', pathParameter: null },
    updateProduct: { type: 'PRODUCT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createSku: { type: 'SKU', hrefPolicy: 'collection', pathParameter: null },
    updateSku: { type: 'SKU', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createOrder: { type: 'ORDER', hrefPolicy: 'collection', pathParameter: null },
    updateOrder: { type: 'ORDER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    transitionOrder: { type: 'ORDER', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createInventoryReservation: { type: 'INVENTORY_RESERVATION', hrefPolicy: 'collection', pathParameter: null },
    releaseInventoryReservation: { type: 'INVENTORY_OPERATION', hrefPolicy: 'collection', pathParameter: null },
    createInventoryObservation: { type: 'INVENTORY_OBSERVATION', hrefPolicy: 'collection', pathParameter: null },
    createInitialReceipt: { type: 'INVENTORY_OPERATION', hrefPolicy: 'collection', pathParameter: null },
    createInventoryReceipt: { type: 'INVENTORY_OPERATION', hrefPolicy: 'collection', pathParameter: null },
    createInventoryAdjustment: { type: 'INVENTORY_OPERATION', hrefPolicy: 'collection', pathParameter: null },
    issueInventory: { type: 'INVENTORY_OPERATION', hrefPolicy: 'collection', pathParameter: null },
    reverseInventoryOperation: { type: 'INVENTORY_OPERATION', hrefPolicy: 'collection', pathParameter: null },
    createPayment: { type: 'PAYMENT', hrefPolicy: 'collection', pathParameter: null },
    attachPaymentProof: { type: 'PAYMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    submitPaymentReview: { type: 'PAYMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    reviewPayment: { type: 'PAYMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    reversePayment: { type: 'PAYMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createUploadIntent: { type: 'FILE', hrefPolicy: 'collection', pathParameter: null },
    completeUpload: { type: 'FILE', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createDocument: { type: 'DOCUMENT', hrefPolicy: 'collection', pathParameter: null },
    updateDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createDocumentVersion: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    submitDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    approveDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    rejectDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    finalizeDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    issueDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    voidDocument: { type: 'DOCUMENT', hrefPolicy: 'existing:id', pathParameter: 'id' },
    createTask: { type: 'TASK', hrefPolicy: 'collection', pathParameter: null },
    completeTask: { type: 'TASK', hrefPolicy: 'existing:id', pathParameter: 'id' },
  } as const;

  const EXPECTED_PROJECTOR_CONTRACTS = {
    createUser: { status: 201, schema: 'User', hrefTemplate: '/api/v1/organizations/{pathId}/users/{resourceId}' },
    updateUserRoleBindings: { status: 200, schema: 'User', hrefTemplate: '/api/v1/users/{resourceId}' },
    updateUserDataScopeGrants: { status: 200, schema: 'User', hrefTemplate: '/api/v1/users/{resourceId}' },
    createCustomer: { status: 201, schema: 'Customer', hrefTemplate: '/api/v1/customers/{resourceId}' },
    updateCustomer: { status: 200, schema: 'Customer', hrefTemplate: '/api/v1/customers/{resourceId}' },
    submitCustomerApproval: { status: 200, schema: 'Customer', hrefTemplate: '/api/v1/customers/{resourceId}' },
    approveCustomer: { status: 200, schema: 'Customer', hrefTemplate: '/api/v1/customers/{resourceId}' },
    rejectCustomer: { status: 200, schema: 'Customer', hrefTemplate: '/api/v1/customers/{resourceId}' },
    reassignCustomer: { status: 200, schema: 'Customer', hrefTemplate: '/api/v1/customers/{resourceId}' },
    createProduct: { status: 201, schema: 'Product', hrefTemplate: '/api/v1/products/{resourceId}' },
    updateProduct: { status: 200, schema: 'Product', hrefTemplate: '/api/v1/products/{resourceId}' },
    createSku: { status: 201, schema: 'Sku', hrefTemplate: '/api/v1/skus/{resourceId}' },
    updateSku: { status: 200, schema: 'Sku', hrefTemplate: '/api/v1/skus/{resourceId}' },
    createOrder: { status: 201, schema: 'Order', hrefTemplate: '/api/v1/orders/{resourceId}' },
    updateOrder: { status: 200, schema: 'Order', hrefTemplate: '/api/v1/orders/{resourceId}' },
    transitionOrder: { status: 200, schema: 'Order', hrefTemplate: '/api/v1/orders/{resourceId}' },
    createInventoryReservation: { status: 201, schema: 'InventoryReservation', hrefTemplate: '/api/v1/inventory/reservations/{resourceId}' },
    releaseInventoryReservation: { status: 200, schema: 'InventoryOperation', hrefTemplate: '/api/v1/inventory/operations/{resourceId}' },
    createInventoryObservation: { status: 201, schema: 'InventoryObservation', hrefTemplate: '/api/v1/inventory/observations/{resourceId}' },
    createInitialReceipt: { status: 201, schema: 'InventoryOperation', hrefTemplate: '/api/v1/inventory/operations/{resourceId}' },
    createInventoryReceipt: { status: 201, schema: 'InventoryOperation', hrefTemplate: '/api/v1/inventory/operations/{resourceId}' },
    createInventoryAdjustment: { status: 201, schema: 'InventoryOperation', hrefTemplate: '/api/v1/inventory/operations/{resourceId}' },
    issueInventory: { status: 201, schema: 'InventoryOperation', hrefTemplate: '/api/v1/inventory/operations/{resourceId}' },
    reverseInventoryOperation: { status: 201, schema: 'InventoryOperation', hrefTemplate: '/api/v1/inventory/operations/{resourceId}' },
    createPayment: { status: 201, schema: 'Payment', hrefTemplate: '/api/v1/payments/{resourceId}' },
    attachPaymentProof: { status: 200, schema: 'Payment', hrefTemplate: '/api/v1/payments/{resourceId}' },
    submitPaymentReview: { status: 200, schema: 'Payment', hrefTemplate: '/api/v1/payments/{resourceId}' },
    reviewPayment: { status: 200, schema: 'Payment', hrefTemplate: '/api/v1/payments/{resourceId}' },
    reversePayment: { status: 200, schema: 'Payment', hrefTemplate: '/api/v1/payments/{resourceId}' },
    createUploadIntent: { status: 201, schema: 'File', hrefTemplate: '/api/v1/files/{resourceId}' },
    completeUpload: { status: 200, schema: 'File', hrefTemplate: '/api/v1/files/{resourceId}' },
    createDocument: { status: 201, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    updateDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    createDocumentVersion: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    submitDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    approveDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    rejectDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    finalizeDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    issueDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    voidDocument: { status: 200, schema: 'Document', hrefTemplate: '/api/v1/documents/{resourceId}' },
    createTask: { status: 201, schema: 'Task', hrefTemplate: '/api/v1/tasks/{resourceId}' },
    completeTask: { status: 200, schema: 'Task', hrefTemplate: '/api/v1/tasks/{resourceId}' },
  } as const;

  it('has an operation-aware projector for every synchronous idempotent resource response', () => {
    const expected = EXPECTED_OPERATION_MANIFEST
      .filter((entry) => entry.idempotency)
      .filter((entry) => Object.entries(operations[entry.operationId].responses).some(([status, contract]) => status.startsWith('2') && status !== '202' && contract.schema !== undefined))
      .map((entry) => entry.operationId)
      .sort();
    expect(Object.keys(IDEMPOTENT_RESOURCE_PROJECTORS).sort()).toEqual(expected);
    for (const operationId of expected) {
      const success = Object.entries(operations[operationId].responses).find(([status, contract]) => status.startsWith('2') && status !== '202' && contract.schema !== undefined);
      expect(success).toBeDefined();
      const [status, contract] = success as [string, { schema?: string }];
      expect(IDEMPOTENT_RESOURCE_PROJECTORS[operationId]).toMatchObject({ status: Number(status), schema: contract.schema });
    }
  });

  it('locks the independent response contract, resource type, and canonical href policy for all 42 projectors', () => {
    expect(Object.keys(IDEMPOTENT_RESOURCE_PROJECTORS).sort()).toEqual(Object.keys(EXPECTED_PROJECTOR_POLICIES).sort());
    expect(Object.keys(IDEMPOTENT_RESOURCE_PROJECTORS).sort()).toEqual(Object.keys(EXPECTED_PROJECTOR_CONTRACTS).sort());
    for (const [operationId, expected] of Object.entries(EXPECTED_PROJECTOR_POLICIES)) {
      const contract = EXPECTED_PROJECTOR_CONTRACTS[operationId as keyof typeof EXPECTED_PROJECTOR_CONTRACTS];
      expect(IDEMPOTENT_RESOURCE_PROJECTORS[operationId]).toMatchObject({ ...expected, status: contract.status, schema: contract.schema });
    }
  });

  it('positively projects every independent operation/status branch to its expected canonical resource', () => {
    const resourceId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const organizationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    for (const [operationId, expected] of Object.entries(EXPECTED_PROJECTOR_CONTRACTS)) {
      const policy = EXPECTED_PROJECTOR_POLICIES[operationId as keyof typeof EXPECTED_PROJECTOR_POLICIES];
      const pathId = policy.pathParameter === null ? undefined : policy.hrefPolicy === 'organization-user' ? organizationId : resourceId;
      const href = expected.hrefTemplate.replace('{pathId}', pathId ?? '').replace('{resourceId}', resourceId);
      const request = { params: pathId === undefined ? {} : { id: pathId } };
      const response = { getHeader: (name: string) => name.toLowerCase() === 'location' ? href : undefined };
      const projected = resourceReferenceForResponse(operationId, operations[operationId as OperationId], request as never, response as never, { id: resourceId }, expected.status);
      expect(projected).toEqual({ type: policy.type, id: resourceId, href });
    }
  });

  it('rejects a resource reference whose Location belongs to the request action, not the returned operation', () => {
    const reservationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const operationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/inventory/reservations/${reservationId}/release`,
      routeOptions: { url: '/api/v1/inventory/reservations/:id/release' },
      params: { id: reservationId },
    };
    const response = { getHeader: (name: string) => name.toLowerCase() === 'location' ? `/api/v1/inventory/reservations/${reservationId}` : undefined };

    expect(resourceReferenceForResponse('releaseInventoryReservation', operations.releaseInventoryReservation, request as never, response as never, { id: operationId }, 200)).toBeUndefined();
  });

  it('executes the controller only through the repository transaction boundary', async () => {
    let controllerExecutions = 0;
    let persistedResult: unknown;
    const transactionClient = { query: async () => undefined };
    const claim = { commandId: 'command-1', claimRole: 'OWNER' as const };
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work(transactionClient, claim);
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const request = {
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      headers: { 'idempotency-key': 'key-1', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: (name: string) => name.toLowerCase() === 'location' ? '/api/v1/customers/2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' : undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;
    const next = { handle: () => {
      controllerExecutions += 1;
      expect(requireIdempotencyTransaction(request as never)).toEqual({ client: transactionClient, claim });
      return of({ id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' });
    } };

    const result = await lastValueFrom(interceptor.intercept(context, next as never));
    const callbackClient = (result as { id: string }).id;
    expect(callbackClient).toBe('2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019');
    expect(controllerExecutions).toBe(1);
    expect(persistedResult).toMatchObject({ resource: { type: 'CUSTOMER', id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019', href: '/api/v1/customers/2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' } });
  });

  it('maps a request-hash conflict to the typed 409 problem contract', async () => {
    const repository = { execute: async () => { throw new IdempotencyConflictError(); } };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const request = {
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      headers: { 'idempotency-key': 'key-1', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await expect(lastValueFrom(interceptor.intercept(context, { handle: () => of({}) } as never))).rejects.toMatchObject({ name: 'ProblemError', status: 409, code: 'IDEMPOTENCY_KEY_REUSED' });
  });

  it('marks a terminal replay for HTTP consumers', async () => {
    const headers: Record<string, string> = {};
    const repository = { execute: async () => ({ status: 201, body: { id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' }, replayed: true }) };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const request = {
      method: 'POST',
      url: '/api/v1/customers',
      routeOptions: { url: '/api/v1/customers' },
      params: {},
      query: {},
      body: { name: 'Acme', ownerUserId: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2' },
      headers: { 'idempotency-key': 'key-1', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: (name: string, value: string) => { headers[name] = value; return response; } };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await expect(lastValueFrom(interceptor.intercept(context, { handle: () => of({}) } as never))).resolves.toEqual({ id: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' });
    expect(headers['idempotent-replay']).toBe('true');
  });

  it('projects transition resources to their canonical resource href', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-transition', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const orderId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/orders/${orderId}/transitions`,
      routeOptions: { url: '/api/v1/orders/:id/transitions' },
      params: { id: orderId },
      query: {},
      body: { action: 'CONFIRM' },
      headers: { 'idempotency-key': 'transition-key', 'x-csrf-token': 'csrf-token-value', 'if-match': '"1"' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 200, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: orderId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'ORDER', id: orderId, href: `/api/v1/orders/${orderId}` } });
  });

  it('projects inventory observations with a dedicated resource type', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-observation', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const observationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: '/api/v1/inventory/observations',
      routeOptions: { url: '/api/v1/inventory/observations' },
      params: {},
      query: {},
      body: { skuId: observationId, quantity: '1' },
      headers: { 'idempotency-key': 'observation-key', 'x-csrf-token': 'csrf-token-value' },
      user: { id: 'f8b6e3a9-3a0a-4c1c-b3f3-5d65d08c17e2', organizationId: '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019' },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: observationId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'INVENTORY_OBSERVATION', id: observationId, href: `/api/v1/inventory/observations/${observationId}` } });
  });

  it('projects released reservations to the returned inventory operation href', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-release', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const reservationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const operationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/inventory/reservations/${reservationId}/release`,
      routeOptions: { url: '/api/v1/inventory/reservations/:id/release' },
      params: { id: reservationId },
      query: {},
      body: { reason: 'manual' },
      headers: { 'idempotency-key': 'release-key', 'x-csrf-token': 'csrf-token-value', 'if-match': '"1"' },
      user: { id: reservationId, organizationId: operationId },
    };
    const response = { statusCode: 200, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: operationId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'INVENTORY_OPERATION', id: operationId, href: `/api/v1/inventory/operations/${operationId}` } });
  });

  it('projects reversed inventory operations to the new operation href', async () => {
    let persistedResult: unknown;
    const repository = {
      execute: async (_input: unknown, work: (client: unknown, claim: unknown) => Promise<unknown>) => {
        persistedResult = await work({}, { commandId: 'command-reverse', claimRole: 'OWNER' });
        return persistedResult;
      },
    };
    const interceptor = new IdempotencyExecutionInterceptor(repository as never);
    const sourceOperationId = 'f8b6e3a9-3a0a-4c1c-b3e3-5d65d08c17e2';
    const reversalOperationId = '2f6a6a3d-90e4-4ff8-b0f3-8a8225e7f019';
    const request = {
      method: 'POST',
      url: `/api/v1/inventory/operations/${sourceOperationId}/reverse`,
      routeOptions: { url: '/api/v1/inventory/operations/:operationId/reverse' },
      params: { operationId: sourceOperationId },
      query: {},
      body: { operationType: 'REVERSAL', lines: [{ skuId: sourceOperationId, quantity: '1' }] },
      headers: { 'idempotency-key': 'reverse-key', 'x-csrf-token': 'csrf-token-value', 'if-match': '"v1"' },
      user: { id: sourceOperationId, organizationId: reversalOperationId },
    };
    const response = { statusCode: 201, getHeader: () => undefined, header: () => response };
    const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }) } as never;

    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ id: reversalOperationId }) } as never));

    expect(persistedResult).toMatchObject({ resource: { type: 'INVENTORY_OPERATION', id: reversalOperationId, href: `/api/v1/inventory/operations/${reversalOperationId}` } });
  });
});
