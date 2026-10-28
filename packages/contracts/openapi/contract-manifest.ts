export interface ExpectedOperation {
  operationId: string;
  method: string;
  path: string;
  pathParams: readonly string[];
  csrf: boolean;
  idempotency: boolean;
  ifMatch: boolean;
}

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
        if (responses?.['403'] === undefined || responses['428'] === undefined) throw new Error(`${operationId} must declare 403 and 428.`);
      }
    }
  }
  const expected = [...EXPECTED_OPERATION_MANIFEST].sort(compare);
  const observed = actual.sort(compare);
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    throw new Error(`OpenAPI operation/safety manifest mismatch. Expected ${expected.length}, observed ${observed.length}.\\nExpected: ${JSON.stringify(expected)}\\nObserved: ${JSON.stringify(observed)}`);
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

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string.`);
  return value;
}
function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
