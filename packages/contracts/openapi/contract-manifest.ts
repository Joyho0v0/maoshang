export interface ExpectedOperation {
  operationId: string;
  method: string;
  path: string;
  pathParams: readonly string[];
  csrf: boolean;
  idempotency: boolean;
  ifMatch: boolean;
}

export interface ExpectedContractShape {
  readonly queryParams?: readonly string[];
  readonly requestSchema?: string;
  readonly responseSchemas?: Readonly<Record<string, string | null>>;
  readonly requiredResponseHeaders?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Consumer-facing contract expectations are intentionally kept separate from
 * the OpenAPI document. The safety manifest above freezes every operation;
 * this second manifest freezes the high-risk query/body/response shapes that
 * must not drift while templates are refactored.
 */
export const EXPECTED_CONTRACT_SHAPES: Readonly<Record<string, ExpectedContractShape>> = {
  getCsrfToken: { responseSchemas: { '200': 'CsrfToken' }, requiredResponseHeaders: { '200': ['Cache-Control'] } },
  createSession: { requestSchema: 'SessionRequest', responseSchemas: { '201': 'Session' }, requiredResponseHeaders: { '201': ['Cache-Control'] } },
  getCurrentSession: { responseSchemas: { '200': 'Session' }, requiredResponseHeaders: { '200': ['Cache-Control'] } },
  getCommandStatus: { responseSchemas: { '200': 'CommandStatus' }, requiredResponseHeaders: { '200': ['Cache-Control'] } },
  listCustomers: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'CustomerPage' } },
  listProducts: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'ProductPage' } },
  listSkus: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'SkuPage' } },
  listOrders: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'OrderPage' } },
  listInventoryBalances: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'InventoryBalancePage' } },
  listInventoryMovements: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'InventoryMovementPage' } },
  listInventoryReservations: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'InventoryReservationPage' } },
  listInventoryObservations: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'InventoryObservationPage' } },
  listPayments: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'PaymentPage' } },
  listDocuments: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'DocumentPage' } },
  listTasks: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'TaskPage' } },
  listAuditEvents: { queryParams: ['page[after]', 'page[size]', 'sort', 'filter'], responseSchemas: { '200': 'AuditEventPage' } },
  createProduct: { requestSchema: 'ProductCreateRequest', responseSchemas: { '201': 'Product', '202': 'CommandStatusInProgress' } },
  createSku: { requestSchema: 'SkuCreateRequest', responseSchemas: { '201': 'Sku', '202': 'CommandStatusInProgress' } },
  createOrder: { requestSchema: 'OrderCreateRequest', responseSchemas: { '201': 'Order', '202': 'CommandStatusInProgress' } },
  createInventoryReservation: { requestSchema: 'InventoryReservationCreateRequest', responseSchemas: { '201': 'InventoryReservation', '202': 'CommandStatusInProgress' } },
  createInventoryObservation: { requestSchema: 'InventoryObservationCreateRequest', responseSchemas: { '201': 'InventoryObservation', '202': 'CommandStatusInProgress' } },
  createInitialReceipt: { requestSchema: 'InventoryOperationCreateRequest', responseSchemas: { '201': 'InventoryOperation', '202': 'CommandStatusInProgress' } },
  createInventoryReceipt: { requestSchema: 'InventoryOperationCreateRequest', responseSchemas: { '201': 'InventoryOperation', '202': 'CommandStatusInProgress' } },
  createInventoryAdjustment: { requestSchema: 'InventoryOperationCreateRequest', responseSchemas: { '201': 'InventoryOperation', '202': 'CommandStatusInProgress' } },
  issueInventory: { requestSchema: 'InventoryOperationCreateRequest', responseSchemas: { '201': 'InventoryOperation', '202': 'CommandStatusInProgress' } },
  createPayment: { requestSchema: 'PaymentCreateRequest', responseSchemas: { '201': 'Payment', '202': 'CommandStatusInProgress' } },
  createUploadIntent: { requestSchema: 'FileCreateRequest', responseSchemas: { '201': 'File', '202': 'CommandStatusInProgress' } },
  createTask: { requestSchema: 'TaskCreateRequest', responseSchemas: { '201': 'Task', '202': 'CommandStatusInProgress' } },
  updateProduct: { requestSchema: 'ProductUpdateRequest', responseSchemas: { '200': 'Product', '202': 'CommandStatusInProgress' } },
  updateSku: { requestSchema: 'SkuUpdateRequest', responseSchemas: { '200': 'Sku', '202': 'CommandStatusInProgress' } },
  updateOrder: { requestSchema: 'OrderUpdateRequest', responseSchemas: { '200': 'Order', '202': 'CommandStatusInProgress' } },
  updateDocument: { requestSchema: 'DocumentUpdateRequest', responseSchemas: { '200': 'Document', '202': 'CommandStatusInProgress' } },
  transitionOrder: { requestSchema: 'OrderCommandRequest', responseSchemas: { '200': 'Order', '202': 'CommandStatusInProgress' } },
  releaseInventoryReservation: { requestSchema: 'InventoryCommandRequestTyped', responseSchemas: { '200': 'InventoryOperation', '202': 'CommandStatusInProgress' } },
  attachPaymentProof: { requestSchema: 'PaymentCommandRequest', responseSchemas: { '200': 'Payment', '202': 'CommandStatusInProgress' } },
  submitPaymentReview: { requestSchema: 'PaymentCommandRequest', responseSchemas: { '200': 'Payment', '202': 'CommandStatusInProgress' } },
  reviewPayment: { requestSchema: 'PaymentCommandRequest', responseSchemas: { '200': 'Payment', '202': 'CommandStatusInProgress' } },
  reversePayment: { requestSchema: 'PaymentCommandRequest', responseSchemas: { '200': 'Payment', '202': 'CommandStatusInProgress' } },
  completeUpload: { requestSchema: 'FileCommandRequest', responseSchemas: { '200': 'File', '202': 'CommandStatusInProgress' } },
  createDocument: { requestSchema: 'DocumentCreateRequest', responseSchemas: { '201': 'Document', '202': 'CommandStatusInProgress' }, requiredResponseHeaders: { '201': ['Location'], '202': ['Retry-After', 'Cache-Control', 'Content-Location'] } },
};

export const EXPECTED_OPERATION_MANIFEST =   [
    {
      "operationId": "getCsrfToken",
      "method": "get",
      "path": "/auth/csrf",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createSession",
      "method": "post",
      "path": "/auth/sessions",
      "pathParams": [],
      "csrf": true,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "getCurrentSession",
      "method": "get",
      "path": "/auth/sessions/current",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "deleteCurrentSession",
      "method": "delete",
      "path": "/auth/sessions/current",
      "pathParams": [],
      "csrf": true,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "getCommandStatus",
      "method": "get",
      "path": "/commands/status",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "getUser",
      "method": "get",
      "path": "/users/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createUser",
      "method": "post",
      "path": "/organizations/{id}/users",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "updateUserRoleBindings",
      "method": "put",
      "path": "/users/{id}/role-bindings",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "updateUserDataScopeGrants",
      "method": "put",
      "path": "/users/{id}/data-scope-grants",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "disableUser",
      "method": "post",
      "path": "/users/{id}/disable",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listCustomers",
      "method": "get",
      "path": "/customers",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createCustomer",
      "method": "post",
      "path": "/customers",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getCustomer",
      "method": "get",
      "path": "/customers/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "updateCustomer",
      "method": "patch",
      "path": "/customers/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "submitCustomerApproval",
      "method": "post",
      "path": "/customers/{id}/submit-approval",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "approveCustomer",
      "method": "post",
      "path": "/customers/{id}/approve",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "rejectCustomer",
      "method": "post",
      "path": "/customers/{id}/reject",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "reassignCustomer",
      "method": "post",
      "path": "/customers/{id}/reassign",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listProducts",
      "method": "get",
      "path": "/products",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createProduct",
      "method": "post",
      "path": "/products",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getProduct",
      "method": "get",
      "path": "/products/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "updateProduct",
      "method": "patch",
      "path": "/products/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listSkus",
      "method": "get",
      "path": "/skus",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createSku",
      "method": "post",
      "path": "/skus",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getSku",
      "method": "get",
      "path": "/skus/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "updateSku",
      "method": "patch",
      "path": "/skus/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listOrders",
      "method": "get",
      "path": "/orders",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createOrder",
      "method": "post",
      "path": "/orders",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getOrder",
      "method": "get",
      "path": "/orders/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "updateOrder",
      "method": "patch",
      "path": "/orders/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "transitionOrder",
      "method": "post",
      "path": "/orders/{id}/transitions",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listInventoryBalances",
      "method": "get",
      "path": "/inventory/balances",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "listInventoryMovements",
      "method": "get",
      "path": "/inventory/movements",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "listInventoryReservations",
      "method": "get",
      "path": "/inventory/reservations",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createInventoryReservation",
      "method": "post",
      "path": "/inventory/reservations",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getInventory",
      "method": "get",
      "path": "/inventory/reservations/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "releaseInventoryReservation",
      "method": "post",
      "path": "/inventory/reservations/{id}/release",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listInventoryObservations",
      "method": "get",
      "path": "/inventory/observations",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createInventoryObservation",
      "method": "post",
      "path": "/inventory/observations",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getInventoryOperation",
      "method": "get",
      "path": "/inventory/operations/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createInitialReceipt",
      "method": "post",
      "path": "/inventory/initial-receipts",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "createInventoryReceipt",
      "method": "post",
      "path": "/inventory/receipts",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "createInventoryAdjustment",
      "method": "post",
      "path": "/inventory/adjustments",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "issueInventory",
      "method": "post",
      "path": "/inventory/issues",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "reverseInventoryOperation",
      "method": "post",
      "path": "/inventory/operations/{operationId}/reverse",
      "pathParams": [
        "operationId"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listPayments",
      "method": "get",
      "path": "/payments",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createPayment",
      "method": "post",
      "path": "/payments",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getPayment",
      "method": "get",
      "path": "/payments/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "attachPaymentProof",
      "method": "post",
      "path": "/payments/{id}/proofs",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "submitPaymentReview",
      "method": "post",
      "path": "/payments/{id}/submit-review",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "reviewPayment",
      "method": "post",
      "path": "/payments/{id}/review",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "reversePayment",
      "method": "post",
      "path": "/payments/{id}/reverse",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "getFile",
      "method": "get",
      "path": "/files/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createUploadIntent",
      "method": "post",
      "path": "/files/upload-intents",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "completeUpload",
      "method": "post",
      "path": "/files/{id}/complete",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "createDownloadIntent",
      "method": "post",
      "path": "/files/{id}/download-intents",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "listDocuments",
      "method": "get",
      "path": "/orders/{orderId}/documents",
      "pathParams": [
        "orderId"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createDocument",
      "method": "post",
      "path": "/orders/{orderId}/documents",
      "pathParams": [
        "orderId"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "getDocument",
      "method": "get",
      "path": "/documents/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "updateDocument",
      "method": "patch",
      "path": "/documents/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "createDocumentVersion",
      "method": "post",
      "path": "/documents/{id}/versions",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "submitDocument",
      "method": "post",
      "path": "/documents/{id}/submit",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "approveDocument",
      "method": "post",
      "path": "/documents/{id}/approve",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "rejectDocument",
      "method": "post",
      "path": "/documents/{id}/reject",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "finalizeDocument",
      "method": "post",
      "path": "/documents/{id}/finalize",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "issueDocument",
      "method": "post",
      "path": "/documents/{id}/issue",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "voidDocument",
      "method": "post",
      "path": "/documents/{id}/void",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listTasks",
      "method": "get",
      "path": "/tasks",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "createTask",
      "method": "post",
      "path": "/tasks",
      "pathParams": [],
      "csrf": true,
      "idempotency": true,
      "ifMatch": false
    },
    {
      "operationId": "getTask",
      "method": "get",
      "path": "/tasks/{id}",
      "pathParams": [
        "id"
      ],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    },
    {
      "operationId": "completeTask",
      "method": "post",
      "path": "/tasks/{id}/complete",
      "pathParams": [
        "id"
      ],
      "csrf": true,
      "idempotency": true,
      "ifMatch": true
    },
    {
      "operationId": "listAuditEvents",
      "method": "get",
      "path": "/audit-events",
      "pathParams": [],
      "csrf": false,
      "idempotency": false,
      "ifMatch": false
    }
  ] as const satisfies readonly ExpectedOperation[];

type AnyRecord = Record<string, unknown>;

export function assertOperationManifest(document: AnyRecord): void {
  const templates = (document['x-operationTemplates'] ?? {}) as AnyRecord;
  const paths = document.paths as AnyRecord | undefined;
  if (paths === undefined) throw new Error('OpenAPI document has no paths.');
  const actual: ExpectedOperation[] = [];
  for (const [path, methodsValue] of Object.entries(paths)) {
    const methods = methodsValue as AnyRecord;
    for (const [method, raw] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      const operation = resolve(raw, templates);
      const operationId = requireString(operation.operationId, `${method.toUpperCase()} ${path} operationId`);
      const safety = (operation['x-safety'] ?? {}) as AnyRecord;
      const parameters = resolveParameters(operation, document);
      actual.push({
        operationId,
        method,
        path,
        pathParams: parameters.filter((parameter) => parameter.in === 'path').map((parameter) => parameter.name).sort(),
        csrf: safety.csrf === 'required',
        idempotency: safety.idempotency === 'required',
        ifMatch: safety.ifMatch === 'required',
      });
      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        const headers = new Map(parameters.filter((parameter) => parameter.in === 'header').map((parameter) => [parameter.name, parameter.required === true]));
        if (headers.get('X-CSRF-Token') !== true) throw new Error(`${operationId} must require X-CSRF-Token.`);
        if (safety.idempotency === 'required' && headers.get('Idempotency-Key') !== true) throw new Error(`${operationId} must require Idempotency-Key.`);
        if (safety.ifMatch === 'required' && headers.get('If-Match') !== true) throw new Error(`${operationId} must require If-Match.`);
        const responses = operation.responses as AnyRecord | undefined;
        if (responses?.['403'] === undefined) throw new Error(`${operationId} must declare 403.`);
        if ((safety.idempotency === 'required' || safety.ifMatch === 'required') && responses?.['428'] === undefined) throw new Error(`${operationId} must declare 428.`);
        if (safety.idempotency !== 'required' && safety.ifMatch !== 'required' && responses?.['428'] !== undefined) throw new Error(`${operationId} must not declare unreachable 428.`);
      }
      const shape = EXPECTED_CONTRACT_SHAPES[operationId];
      if (shape !== undefined) assertContractShape(operationId, operation, parameters, document, shape);
      assertFrozenResponseHeaders(operationId, operation, document);
    }
  }
  const expected = [...EXPECTED_OPERATION_MANIFEST].sort(compare);
  const observed = actual.sort(compare);
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    throw new Error(`OpenAPI operation/safety manifest mismatch. Expected ${expected.length}, observed ${observed.length}.\\nExpected: ${JSON.stringify(expected)}\\nObserved: ${JSON.stringify(observed)}`);
  }
}

function assertFrozenResponseHeaders(operationId: string, operation: AnyRecord, document: AnyRecord): void {
  const responses = isRecord(operation.responses) ? operation.responses : {};
  for (const [status, expected] of Object.entries(expectedRequiredResponseHeaders(operationId, responses))) {
    const response = resolveComponent(responses[status], document, 'responses');
    const actual = isRecord(response?.headers) ? Object.entries(response.headers).filter(([, header]) => isRecord(header) && header['x-required'] === true).map(([name]) => name) : [];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${operationId} required response header mismatch: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(actual)}.`);
  }
}

function expectedRequiredResponseHeaders(operationId: string, responses: AnyRecord): Readonly<Record<string, readonly string[]>> {
  const expected: Record<string, readonly string[]> = {};
  if (responses['200'] !== undefined && ['getCsrfToken', 'getCurrentSession', 'getCommandStatus'].includes(operationId)) expected['200'] = ['Cache-Control'];
  if (responses['201'] !== undefined) expected['201'] = operationId === 'createSession' ? ['Cache-Control'] : ['Location'];
  if (responses['202'] !== undefined) expected['202'] = ['Retry-After', 'Cache-Control', 'Content-Location'];
  return expected;
}

function assertContractShape(operationId: string, operation: AnyRecord, parameters: Array<{ name: string; in: string; required?: boolean }>, document: AnyRecord, expected: ExpectedContractShape): void {
  if (expected.queryParams !== undefined) {
    const actual = parameters.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name).sort();
    if (JSON.stringify(actual) !== JSON.stringify([...expected.queryParams].sort())) throw new Error(`${operationId} query contract mismatch: expected ${JSON.stringify(expected.queryParams)}, observed ${JSON.stringify(actual)}.`);
  }
  if (expected.requestSchema !== undefined) {
    const requestBody = resolveComponent(operation.requestBody, document, 'requestBodies');
    const content = isRecord(requestBody?.content) ? requestBody.content['application/json'] : undefined;
    const schema = isRecord(content) && isRecord(content.schema) ? schemaComponentName(content.schema) : undefined;
    if (schema !== expected.requestSchema) throw new Error(`${operationId} request schema mismatch: expected ${expected.requestSchema}, observed ${String(schema)}.`);
  }
  if (expected.responseSchemas !== undefined) {
    const responses = isRecord(operation.responses) ? operation.responses : {};
    const actual = Object.fromEntries(Object.entries(responses).filter(([status]) => /^2\d\d$/.test(status)).map(([status, value]) => {
      const response = resolveComponent(value, document, 'responses');
      const content = isRecord(response?.content) ? response.content['application/json'] ?? response.content['application/problem+json'] : undefined;
      const schema = isRecord(content) && isRecord(content.schema) ? schemaComponentName(content.schema) : null;
      return [status, schema];
    }));
    if (JSON.stringify(actual) !== JSON.stringify(expected.responseSchemas)) throw new Error(`${operationId} response schema mismatch: expected ${JSON.stringify(expected.responseSchemas)}, observed ${JSON.stringify(actual)}.`);
  }
  if (expected.requiredResponseHeaders !== undefined) {
    const responses = isRecord(operation.responses) ? operation.responses : {};
    const actual = Object.fromEntries(Object.entries(responses).filter(([status]) => expected.requiredResponseHeaders?.[status] !== undefined).map(([status, value]) => {
      const response = resolveComponent(value, document, 'responses');
      const headers = isRecord(response?.headers) ? Object.entries(response.headers).filter(([, header]) => isRecord(header) && header['x-required'] === true).map(([name]) => name) : [];
      return [status, headers];
    }));
    if (JSON.stringify(actual) !== JSON.stringify(expected.requiredResponseHeaders)) throw new Error(`${operationId} required response header mismatch: expected ${JSON.stringify(expected.requiredResponseHeaders)}, observed ${JSON.stringify(actual)}.`);
  }
}

function compare(left: ExpectedOperation, right: ExpectedOperation): number {
  return left.operationId.localeCompare(right.operationId);
}

function resolve(value: unknown, templates: AnyRecord): AnyRecord {
  if (!isRecord(value)) throw new Error('Operation must be an object.');
  const ref = value['$ref'];
  if (typeof ref !== 'string') return value;
  const name = ref.split('/').at(-1);
  if (name === undefined || !isRecord(templates[name])) throw new Error(`Unknown operation template ${ref}.`);
  return { ...resolve(templates[name], templates), ...value };
}

function resolveParameters(operation: AnyRecord, document: AnyRecord): Array<{ name: string; in: string; required?: boolean }> {
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  const components = isRecord(document.components) && isRecord(document.components.parameters) ? document.components.parameters : {};
  return parameters.map((value) => {
    if (!isRecord(value)) throw new Error('Parameter must be an object.');
    const ref = value['$ref'];
    const resolved = typeof ref === 'string' ? components[ref.split('/').at(-1) ?? ''] : value;
    if (!isRecord(resolved)) throw new Error(`Unknown parameter ${String(ref)}.`);
    return { name: requireString(resolved.name, 'parameter name'), in: requireString(resolved.in, 'parameter location'), required: resolved.required === true };
  });
}

function resolveComponent(value: unknown, document: AnyRecord, component: string): AnyRecord | undefined {
  if (!isRecord(value)) return undefined;
  const ref = value['$ref'];
  if (typeof ref !== 'string') return value;
  const name = ref.split('/').at(-1);
  const components = isRecord(document.components) && isRecord(document.components[component]) ? document.components[component] : {};
  const resolved = name === undefined ? undefined : components[name];
  return isRecord(resolved) ? resolved : undefined;
}

function schemaComponentName(value: AnyRecord): string | undefined {
  const ref = value['$ref'];
  const prefix = '#/components/schemas/';
  return typeof ref === 'string' && ref.startsWith(prefix) ? ref.slice(prefix.length) : undefined;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string.`);
  return value;
}
function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
