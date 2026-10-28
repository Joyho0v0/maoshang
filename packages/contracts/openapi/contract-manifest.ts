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
  readonly queryDefaults?: Readonly<Record<string, string | number | boolean>>;
  readonly requestSchema?: string;
  readonly responseSchemas?: Readonly<Record<string, string | null>>;
  readonly responseHeaders?: Readonly<Record<string, readonly string[]>>;
  readonly headerSchemas?: Readonly<Record<string, Readonly<Record<string, string | Readonly<Record<string, unknown>>>>>>;
  readonly requiredResponseHeaders?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Consumer-facing contract expectations are intentionally kept separate from
 * the OpenAPI document. The safety manifest above freezes every operation;
 * this second manifest freezes the high-risk query/body/response shapes that
 * must not drift while templates are refactored.
 */
const PAGE_QUERY = ['page[after]', 'page[size]', 'sort', 'filter'] as const;
const PAGE_DEFAULTS = { sort: '-updatedAt,-id' } as const;
const ASYNC_HEADERS = { '202': ['Retry-After', 'Cache-Control', 'Content-Location'] } as const;
const PROBLEM_HEADERS = { '403': 'CsrfFailedProblem', '409': 'Problem', '428': 'PreconditionRequiredProblem' } as const;
const REQUEST_ID = 'Uuid';
const ETAG = { type: 'string', pattern: '^"v[1-9][0-9]*"$' } as const;
const HREF = 'Href';
const RETRY_AFTER = { type: 'string' } as const;
const NO_STORE = { type: 'string', const: 'no-store' } as const;
const IDEMPOTENT_REPLAY = { type: 'string', enum: ['true'] } as const;
const RESOURCE_HEADERS = ['X-Request-ID', 'ETag'] as const;
const LIST_HEADERS = ['X-Request-ID', 'Cache-Control'] as const;
const ASYNC_RESPONSE_HEADERS = ['X-Request-ID', 'Retry-After', 'Cache-Control', 'Content-Location'] as const;
const COMMON_PROBLEM_STATUSES = ['400', '401', '429', '500', '502', '503'] as const;
const COMMON_PROBLEM_RESPONSE_SCHEMAS = Object.fromEntries(COMMON_PROBLEM_STATUSES.map((status) => [status, 'Problem'])) as Readonly<Record<string, string>>;
const COMMON_PROBLEM_RESPONSE_HEADERS = Object.fromEntries(COMMON_PROBLEM_STATUSES.map((status) => [status, ['X-Request-ID'] as const])) as Readonly<Record<string, readonly string[]>>;
const COMMON_PROBLEM_HEADER_SCHEMAS = Object.fromEntries(COMMON_PROBLEM_STATUSES.map((status) => [status, { 'X-Request-ID': REQUEST_ID }])) as Readonly<Record<string, Readonly<Record<string, string>>>>;

function listHeaders(schema: string): ExpectedContractShape {
  return { queryParams: PAGE_QUERY, queryDefaults: PAGE_DEFAULTS, responseSchemas: { '200': schema }, responseHeaders: { '200': LIST_HEADERS }, headerSchemas: { '200': { 'X-Request-ID': REQUEST_ID, 'Cache-Control': { type: 'string' } } } };
}
function responseShapes(status: string, schema: string, includeAsync: boolean, includeCreated: boolean): Pick<ExpectedContractShape, 'responseSchemas' | 'responseHeaders' | 'headerSchemas' | 'requiredResponseHeaders'> {
  const responseSchemas: Record<string, string> = { [status]: schema, ...includeAsync ? { '202': 'CommandStatusInProgress' } : {}, ...PROBLEM_HEADERS };
  const responseHeaders: Record<string, readonly string[]> = {
    [status]: includeCreated ? ['X-Request-ID', 'ETag', 'Location'] : RESOURCE_HEADERS,
    ...includeAsync ? { '202': ASYNC_RESPONSE_HEADERS } : {},
    '403': [],
    '409': ['X-Request-ID'],
    '428': [],
  };
  const headerSchemas: Record<string, Readonly<Record<string, string | Readonly<Record<string, unknown>>>> > = {
    [status]: includeCreated ? { 'X-Request-ID': REQUEST_ID, ETag: ETAG, Location: HREF } : { 'X-Request-ID': REQUEST_ID, ETag: ETAG },
    ...includeAsync ? { '202': { 'X-Request-ID': REQUEST_ID, 'Retry-After': RETRY_AFTER, 'Cache-Control': NO_STORE, 'Content-Location': HREF } } : {},
    '403': {},
    '409': { 'X-Request-ID': REQUEST_ID },
    '428': {},
  };
  return { responseSchemas, responseHeaders, headerSchemas, requiredResponseHeaders: includeAsync ? { ...(includeCreated ? { [status]: ['Location'] } : {}), ...ASYNC_HEADERS } : includeCreated ? { [status]: ['Location'] } : {} };
}

function listShape(schema: string): ExpectedContractShape {
  return listHeaders(schema);
}
function getShape(schema: string): ExpectedContractShape {
  return { responseSchemas: { '200': schema, '404': 'Problem' }, responseHeaders: { '200': RESOURCE_HEADERS, '404': ['X-Request-ID'] }, headerSchemas: { '200': { 'X-Request-ID': REQUEST_ID, ETag: ETAG }, '404': { 'X-Request-ID': REQUEST_ID } } };
}
function createShape(schema: string, requestSchema: string): ExpectedContractShape {
  return { requestSchema, ...responseShapes('201', schema, true, true) };
}
function updateShape(schema: string, requestSchema: string): ExpectedContractShape {
  return { requestSchema, ...responseShapes('200', schema, true, false) };
}
function commandShape(schema: string, requestSchema: string): ExpectedContractShape {
  return updateShape(schema, requestSchema);
}

export const EXPECTED_CONTRACT_SHAPES: Readonly<Record<string, ExpectedContractShape>> = {
  getCsrfToken: { responseSchemas: { '200': 'CsrfToken' }, responseHeaders: { '200': ['Cache-Control'] }, headerSchemas: { '200': { 'Cache-Control': NO_STORE } }, requiredResponseHeaders: { '200': ['Cache-Control'] } },
  createSession: { requestSchema: 'SessionRequest', responseSchemas: { '201': 'Session', '400': 'Problem', '401': 'Problem', '403': 'CsrfFailedProblem', '503': 'Problem' }, responseHeaders: { '201': ['X-Request-ID', 'Cache-Control'], '400': ['X-Request-ID'], '401': ['X-Request-ID'], '403': [], '503': ['X-Request-ID'] }, headerSchemas: { '201': { 'X-Request-ID': REQUEST_ID, 'Cache-Control': NO_STORE }, '400': { 'X-Request-ID': REQUEST_ID }, '401': { 'X-Request-ID': REQUEST_ID }, '403': {}, '503': { 'X-Request-ID': REQUEST_ID } }, requiredResponseHeaders: { '201': ['Cache-Control'] } },
  getCurrentSession: { responseSchemas: { '200': 'Session', '401': 'Problem' }, responseHeaders: { '200': ['X-Request-ID', 'Cache-Control'], '401': ['X-Request-ID'] }, headerSchemas: { '200': { 'X-Request-ID': REQUEST_ID, 'Cache-Control': NO_STORE }, '401': { 'X-Request-ID': REQUEST_ID } }, requiredResponseHeaders: { '200': ['Cache-Control'] } },
  deleteCurrentSession: { responseSchemas: { '204': null, '401': 'Problem', '403': 'CsrfFailedProblem' }, responseHeaders: { '204': [], '401': ['X-Request-ID'], '403': [] }, headerSchemas: { '204': {}, '401': { 'X-Request-ID': REQUEST_ID }, '403': {} } },
  getCommandStatus: { responseSchemas: { '200': 'CommandStatus', '400': 'Problem', '401': 'Problem', '404': 'CommandNotFoundProblem' }, responseHeaders: { '200': ['X-Request-ID', 'Retry-After', 'Cache-Control', 'Idempotent-Replay', 'Content-Location'], '400': ['X-Request-ID'], '401': ['X-Request-ID'], '404': [] }, headerSchemas: { '200': { 'X-Request-ID': REQUEST_ID, 'Retry-After': RETRY_AFTER, 'Cache-Control': NO_STORE, 'Idempotent-Replay': IDEMPOTENT_REPLAY, 'Content-Location': HREF }, '400': { 'X-Request-ID': REQUEST_ID }, '401': { 'X-Request-ID': REQUEST_ID }, '404': {} }, requiredResponseHeaders: { '200': ['Cache-Control'] } },
  getUser: getShape('User'),
  createUser: createShape('User', 'UserCreateRequest'),
  updateUserRoleBindings: updateShape('User', 'RoleBindingsUpdateRequest'),
  updateUserDataScopeGrants: updateShape('User', 'DataScopeUpdateRequest'),
  disableUser: { responseSchemas: { '202': 'CommandStatusInProgress', ...PROBLEM_HEADERS }, responseHeaders: { '202': ASYNC_RESPONSE_HEADERS, '403': [], '409': ['X-Request-ID'], '428': [] }, headerSchemas: { '202': { 'X-Request-ID': REQUEST_ID, 'Retry-After': RETRY_AFTER, 'Cache-Control': NO_STORE, 'Content-Location': HREF }, '403': {}, '409': { 'X-Request-ID': REQUEST_ID }, '428': {} }, requiredResponseHeaders: ASYNC_HEADERS },
  listCustomers: listShape('CustomerPage'),
  createCustomer: createShape('Customer', 'CustomerCreateRequest'),
  getCustomer: getShape('Customer'),
  updateCustomer: updateShape('Customer', 'CustomerUpdateRequest'),
  submitCustomerApproval: commandShape('Customer', 'CustomerCommandRequest'),
  approveCustomer: commandShape('Customer', 'CustomerCommandRequest'),
  rejectCustomer: commandShape('Customer', 'CustomerCommandRequest'),
  reassignCustomer: commandShape('Customer', 'CustomerCommandRequest'),
  listProducts: listShape('ProductPage'),
  createProduct: createShape('Product', 'ProductCreateRequest'),
  getProduct: getShape('Product'),
  updateProduct: updateShape('Product', 'ProductUpdateRequest'),
  listSkus: listShape('SkuPage'),
  createSku: createShape('Sku', 'SkuCreateRequest'),
  getSku: getShape('Sku'),
  updateSku: updateShape('Sku', 'SkuUpdateRequest'),
  listOrders: listShape('OrderPage'),
  createOrder: createShape('Order', 'OrderCreateRequest'),
  getOrder: getShape('Order'),
  updateOrder: updateShape('Order', 'OrderUpdateRequest'),
  transitionOrder: commandShape('Order', 'OrderCommandRequest'),
  listInventoryBalances: listShape('InventoryBalancePage'),
  listInventoryMovements: listShape('InventoryMovementPage'),
  listInventoryReservations: listShape('InventoryReservationPage'),
  createInventoryReservation: createShape('InventoryReservation', 'InventoryReservationCreateRequest'),
  getInventory: getShape('InventoryReservation'),
  releaseInventoryReservation: commandShape('InventoryOperation', 'InventoryCommandRequestTyped'),
  listInventoryObservations: listShape('InventoryObservationPage'),
  createInventoryObservation: createShape('InventoryObservation', 'InventoryObservationCreateRequest'),
  getInventoryOperation: getShape('InventoryOperation'),
  createInitialReceipt: createShape('InventoryOperation', 'InventoryOperationCreateRequest'),
  createInventoryReceipt: createShape('InventoryOperation', 'InventoryOperationCreateRequest'),
  createInventoryAdjustment: createShape('InventoryOperation', 'InventoryOperationCreateRequest'),
  issueInventory: createShape('InventoryOperation', 'InventoryOperationCreateRequest'),
  reverseInventoryOperation: createShape('InventoryOperation', 'InventoryCommandRequest'),
  listPayments: listShape('PaymentPage'),
  createPayment: createShape('Payment', 'PaymentCreateRequest'),
  getPayment: getShape('Payment'),
  attachPaymentProof: commandShape('Payment', 'PaymentCommandRequest'),
  submitPaymentReview: commandShape('Payment', 'PaymentCommandRequest'),
  reviewPayment: commandShape('Payment', 'PaymentCommandRequest'),
  reversePayment: commandShape('Payment', 'PaymentCommandRequest'),
  getFile: getShape('File'),
  createUploadIntent: createShape('File', 'FileCreateRequest'),
  completeUpload: commandShape('File', 'FileCommandRequest'),
  createDownloadIntent: { responseSchemas: { '201': 'File', '403': 'CsrfFailedProblem', '404': 'Problem' }, responseHeaders: { '201': ['X-Request-ID', 'ETag', 'Location'], '403': [], '404': ['X-Request-ID'] }, headerSchemas: { '201': { 'X-Request-ID': REQUEST_ID, ETag: ETAG, Location: HREF }, '403': {}, '404': { 'X-Request-ID': REQUEST_ID } }, requiredResponseHeaders: { '201': ['Location'] } },
  listDocuments: listShape('DocumentPage'),
  createDocument: createShape('Document', 'DocumentCreateRequest'),
  getDocument: getShape('Document'),
  updateDocument: updateShape('Document', 'DocumentUpdateRequest'),
  createDocumentVersion: commandShape('Document', 'DocumentCommandRequest'),
  submitDocument: commandShape('Document', 'DocumentCommandRequest'),
  approveDocument: commandShape('Document', 'DocumentCommandRequest'),
  rejectDocument: commandShape('Document', 'DocumentCommandRequest'),
  finalizeDocument: commandShape('Document', 'DocumentCommandRequest'),
  issueDocument: commandShape('Document', 'DocumentCommandRequest'),
  voidDocument: commandShape('Document', 'DocumentCommandRequest'),
  listTasks: listShape('TaskPage'),
  createTask: createShape('Task', 'TaskCreateRequest'),
  getTask: getShape('Task'),
  completeTask: commandShape('Task', 'TaskCommandRequest'),
  listAuditEvents: listShape('AuditEventPage'),
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

function assertContractShape(operationId: string, operation: AnyRecord, parameters: Array<{ name: string; in: string; required?: boolean; schema?: AnyRecord }>, document: AnyRecord, expected: ExpectedContractShape): void {
  if (expected.queryParams !== undefined) {
    const actual = parameters.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name).sort();
    if (JSON.stringify(actual) !== JSON.stringify([...expected.queryParams].sort())) throw new Error(`${operationId} query contract mismatch: expected ${JSON.stringify(expected.queryParams)}, observed ${JSON.stringify(actual)}.`);
  }
  if (expected.queryDefaults !== undefined) {
    for (const [name, defaultValue] of Object.entries(expected.queryDefaults)) {
      const parameter = parameters.find((candidate) => candidate.in === 'query' && candidate.name === name);
      const schema = parameter?.schema;
      if (schema?.default !== defaultValue) throw new Error(`${operationId} query default mismatch for ${name}: expected ${String(defaultValue)}, observed ${String(schema?.default)}.`);
    }
  }
  if (expected.requestSchema !== undefined) {
    const requestBody = resolveComponent(operation.requestBody, document, 'requestBodies');
    const content = isRecord(requestBody?.content) ? requestBody.content['application/json'] : undefined;
    const schema = isRecord(content) && isRecord(content.schema) ? schemaComponentName(content.schema) : undefined;
    if (schema !== expected.requestSchema) throw new Error(`${operationId} request schema mismatch: expected ${expected.requestSchema}, observed ${String(schema)}.`);
  }
  if (expected.responseSchemas !== undefined) {
    const responses = isRecord(operation.responses) ? operation.responses : {};
    const actual = Object.fromEntries(Object.entries(responses).map(([status, value]) => {
      const response = resolveComponent(value, document, 'responses');
      const content = isRecord(response?.content) ? response.content['application/json'] ?? response.content['application/problem+json'] : undefined;
      const schema = isRecord(content) && isRecord(content.schema) ? schemaComponentName(content.schema) : null;
      return [status, schema];
    }));
    const expectedResponseSchemas = { ...COMMON_PROBLEM_RESPONSE_SCHEMAS, ...expected.responseSchemas };
    if (JSON.stringify(actual) !== JSON.stringify(expectedResponseSchemas)) throw new Error(`${operationId} response schema mismatch: expected ${JSON.stringify(expectedResponseSchemas)}, observed ${JSON.stringify(actual)}.`);
  }
  if (expected.responseHeaders !== undefined) {
    const responses = isRecord(operation.responses) ? operation.responses : {};
    const actual = Object.fromEntries(Object.entries(responses).map(([status, value]) => {
      const response = resolveComponent(value, document, 'responses');
      const headers = isRecord(response?.headers) ? Object.keys(response.headers) : [];
      return [status, headers];
    }));
    const normalizedActual = Object.fromEntries(Object.entries(actual).map(([status, headers]) => [status, [...headers].sort()]));
    const normalizedExpected = Object.fromEntries(Object.entries({ ...COMMON_PROBLEM_RESPONSE_HEADERS, ...expected.responseHeaders }).map(([status, headers]) => [status, [...headers].sort()]));
    if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) throw new Error(`${operationId} response header shape mismatch: expected ${JSON.stringify(normalizedExpected)}, observed ${JSON.stringify(normalizedActual)}.`);
  }
  if (expected.headerSchemas !== undefined) {
    const responses = isRecord(operation.responses) ? operation.responses : {};
    const actual = Object.fromEntries(Object.entries(responses).map(([status, value]) => {
      const response = resolveComponent(value, document, 'responses');
      const headers = isRecord(response?.headers) ? Object.fromEntries(Object.entries(response.headers).map(([name, value]) => {
        const header = resolveComponent(value, document, 'headers');
        const schema = isRecord(header?.schema) ? header.schema : undefined;
        return [name, schemaComponentName(schema ?? {}) ?? schema];
      })) : {};
      return [status, headers];
    }));
    const expectedHeaderSchemas = { ...COMMON_PROBLEM_HEADER_SCHEMAS, ...expected.headerSchemas };
    if (JSON.stringify(actual) !== JSON.stringify(expectedHeaderSchemas)) throw new Error(`${operationId} response header schema mismatch: expected ${JSON.stringify(expectedHeaderSchemas)}, observed ${JSON.stringify(actual)}.`);
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

function resolveParameters(operation: AnyRecord, document: AnyRecord): Array<{ name: string; in: string; required?: boolean; schema?: AnyRecord }> {
  const parameters = Array.isArray(operation.parameters) ? operation.parameters : [];
  const components = isRecord(document.components) && isRecord(document.components.parameters) ? document.components.parameters : {};
  return parameters.map((value) => {
    if (!isRecord(value)) throw new Error('Parameter must be an object.');
    const ref = value['$ref'];
    const resolved = typeof ref === 'string' ? components[ref.split('/').at(-1) ?? ''] : value;
    if (!isRecord(resolved)) throw new Error(`Unknown parameter ${String(ref)}.`);
    return { name: requireString(resolved.name, 'parameter name'), in: requireString(resolved.in, 'parameter location'), required: resolved.required === true, ...(isRecord(resolved.schema) ? { schema: resolved.schema } : {}) };
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
