import { ContractApiClient, type ClientCallInput, type ContractApiClientOptions } from './client.js';

export const operations = {
  "getCsrfToken": {
    "method": "GET",
    "path": "/auth/csrf"
  },
  "createSession": {
    "method": "POST",
    "path": "/auth/sessions"
  },
  "getCurrentSession": {
    "method": "GET",
    "path": "/auth/sessions/current"
  },
  "deleteCurrentSession": {
    "method": "DELETE",
    "path": "/auth/sessions/current"
  },
  "getCommandStatus": {
    "method": "GET",
    "path": "/commands/status"
  },
  "getUser": {
    "method": "GET",
    "path": "/users/{id}"
  },
  "createUser": {
    "method": "POST",
    "path": "/organizations/{id}/users"
  },
  "updateUserRoleBindings": {
    "method": "PUT",
    "path": "/users/{id}/role-bindings"
  },
  "updateUserDataScopeGrants": {
    "method": "PUT",
    "path": "/users/{id}/data-scope-grants"
  },
  "disableUser": {
    "method": "POST",
    "path": "/users/{id}/disable"
  },
  "listCustomers": {
    "method": "GET",
    "path": "/customers"
  },
  "createCustomer": {
    "method": "POST",
    "path": "/customers"
  },
  "getCustomer": {
    "method": "GET",
    "path": "/customers/{id}"
  },
  "updateCustomer": {
    "method": "PATCH",
    "path": "/customers/{id}"
  },
  "submitCustomerApproval": {
    "method": "POST",
    "path": "/customers/{id}/submit-approval"
  },
  "approveCustomer": {
    "method": "POST",
    "path": "/customers/{id}/approve"
  },
  "rejectCustomer": {
    "method": "POST",
    "path": "/customers/{id}/reject"
  },
  "reassignCustomer": {
    "method": "POST",
    "path": "/customers/{id}/reassign"
  },
  "listProducts": {
    "method": "GET",
    "path": "/products"
  },
  "createProduct": {
    "method": "POST",
    "path": "/products"
  },
  "getProduct": {
    "method": "GET",
    "path": "/products/{id}"
  },
  "updateProduct": {
    "method": "PATCH",
    "path": "/products/{id}"
  },
  "listSkus": {
    "method": "GET",
    "path": "/skus"
  },
  "createSku": {
    "method": "POST",
    "path": "/skus"
  },
  "getSku": {
    "method": "GET",
    "path": "/skus/{id}"
  },
  "updateSku": {
    "method": "PATCH",
    "path": "/skus/{id}"
  },
  "listOrders": {
    "method": "GET",
    "path": "/orders"
  },
  "createOrder": {
    "method": "POST",
    "path": "/orders"
  },
  "getOrder": {
    "method": "GET",
    "path": "/orders/{id}"
  },
  "updateOrder": {
    "method": "PATCH",
    "path": "/orders/{id}"
  },
  "transitionOrder": {
    "method": "POST",
    "path": "/orders/{id}/transitions"
  },
  "listInventoryBalances": {
    "method": "GET",
    "path": "/inventory/balances"
  },
  "listInventoryMovements": {
    "method": "GET",
    "path": "/inventory/movements"
  },
  "listInventoryReservations": {
    "method": "GET",
    "path": "/inventory/reservations"
  },
  "createInventoryReservation": {
    "method": "POST",
    "path": "/inventory/reservations"
  },
  "getInventory": {
    "method": "GET",
    "path": "/inventory/reservations/{id}"
  },
  "releaseInventoryReservation": {
    "method": "POST",
    "path": "/inventory/reservations/{id}/release"
  },
  "listInventoryObservations": {
    "method": "GET",
    "path": "/inventory/observations"
  },
  "createInventoryObservation": {
    "method": "POST",
    "path": "/inventory/observations"
  },
  "getInventoryOperation": {
    "method": "GET",
    "path": "/inventory/operations/{id}"
  },
  "createInitialReceipt": {
    "method": "POST",
    "path": "/inventory/initial-receipts"
  },
  "createInventoryReceipt": {
    "method": "POST",
    "path": "/inventory/receipts"
  },
  "createInventoryAdjustment": {
    "method": "POST",
    "path": "/inventory/adjustments"
  },
  "issueInventory": {
    "method": "POST",
    "path": "/inventory/issues"
  },
  "reverseInventoryOperation": {
    "method": "POST",
    "path": "/inventory/operations/{operationId}/reverse"
  },
  "listPayments": {
    "method": "GET",
    "path": "/payments"
  },
  "createPayment": {
    "method": "POST",
    "path": "/payments"
  },
  "getPayment": {
    "method": "GET",
    "path": "/payments/{id}"
  },
  "attachPaymentProof": {
    "method": "POST",
    "path": "/payments/{id}/proofs"
  },
  "submitPaymentReview": {
    "method": "POST",
    "path": "/payments/{id}/submit-review"
  },
  "reviewPayment": {
    "method": "POST",
    "path": "/payments/{id}/review"
  },
  "reversePayment": {
    "method": "POST",
    "path": "/payments/{id}/reverse"
  },
  "getFile": {
    "method": "GET",
    "path": "/files/{id}"
  },
  "createUploadIntent": {
    "method": "POST",
    "path": "/files/upload-intents"
  },
  "completeUpload": {
    "method": "POST",
    "path": "/files/{id}/complete"
  },
  "createDownloadIntent": {
    "method": "POST",
    "path": "/files/{id}/download-intents"
  },
  "listDocuments": {
    "method": "GET",
    "path": "/orders/{orderId}/documents"
  },
  "createDocument": {
    "method": "POST",
    "path": "/orders/{orderId}/documents"
  },
  "getDocument": {
    "method": "GET",
    "path": "/documents/{id}"
  },
  "updateDocument": {
    "method": "PATCH",
    "path": "/documents/{id}"
  },
  "createDocumentVersion": {
    "method": "POST",
    "path": "/documents/{id}/versions"
  },
  "submitDocument": {
    "method": "POST",
    "path": "/documents/{id}/submit"
  },
  "approveDocument": {
    "method": "POST",
    "path": "/documents/{id}/approve"
  },
  "rejectDocument": {
    "method": "POST",
    "path": "/documents/{id}/reject"
  },
  "finalizeDocument": {
    "method": "POST",
    "path": "/documents/{id}/finalize"
  },
  "issueDocument": {
    "method": "POST",
    "path": "/documents/{id}/issue"
  },
  "voidDocument": {
    "method": "POST",
    "path": "/documents/{id}/void"
  },
  "listTasks": {
    "method": "GET",
    "path": "/tasks"
  },
  "createTask": {
    "method": "POST",
    "path": "/tasks"
  },
  "getTask": {
    "method": "GET",
    "path": "/tasks/{id}"
  },
  "completeTask": {
    "method": "POST",
    "path": "/tasks/{id}/complete"
  },
  "listAuditEvents": {
    "method": "GET",
    "path": "/audit-events"
  }
} as const;
export type OperationId = keyof typeof operations;

export class GeneratedApiClient extends ContractApiClient {
  constructor(options: ContractApiClientOptions = {}) {
    super(options);
  }

  call<TResponse>(operationId: OperationId, input: ClientCallInput = {}): Promise<TResponse> {
    return super.execute<TResponse>(operations[operationId], input);
  }
}
