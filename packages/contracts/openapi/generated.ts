export interface paths {
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCsrfToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/sessions/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCurrentSession"];
        put?: never;
        post?: never;
        delete: operations["deleteCurrentSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/commands/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCommandStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizations/{id}/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/role-bindings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["updateUserRoleBindings"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/data-scope-grants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["updateUserDataScopeGrants"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["disableUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listCustomers"];
        put?: never;
        post: operations["createCustomer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCustomer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateCustomer"];
        trace?: never;
    };
    "/customers/{id}/submit-approval": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitCustomerApproval"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["approveCustomer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rejectCustomer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}/reassign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reassignCustomer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listProducts"];
        put?: never;
        post: operations["createProduct"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getProduct"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateProduct"];
        trace?: never;
    };
    "/skus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listSkus"];
        put?: never;
        post: operations["createSku"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/skus/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSku"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateSku"];
        trace?: never;
    };
    "/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listOrders"];
        put?: never;
        post: operations["createOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getOrder"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateOrder"];
        trace?: never;
    };
    "/orders/{id}/transitions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["transitionOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/balances": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInventoryBalances"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/movements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInventoryMovements"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/reservations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInventoryReservations"];
        put?: never;
        post: operations["createInventoryReservation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/reservations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getInventory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/reservations/{id}/release": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["releaseInventoryReservation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listInventoryObservations"];
        put?: never;
        post: operations["createInventoryObservation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/operations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getInventoryOperation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/initial-receipts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createInitialReceipt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/receipts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createInventoryReceipt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/adjustments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createInventoryAdjustment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["issueInventory"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/inventory/operations/{operationId}/reverse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reverseInventoryOperation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listPayments"];
        put?: never;
        post: operations["createPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPayment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{id}/proofs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["attachPaymentProof"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{id}/submit-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitPaymentReview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{id}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reviewPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payments/{id}/reverse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reversePayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/upload-intents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createUploadIntent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["completeUpload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{id}/download-intents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createDownloadIntent"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listDocuments"];
        put?: never;
        post: operations["createDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDocument"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateDocument"];
        trace?: never;
    };
    "/documents/{id}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createDocumentVersion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["submitDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["approveDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rejectDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}/finalize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["finalizeDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}/issue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["issueDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/documents/{id}/void": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["voidDocument"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listTasks"];
        put?: never;
        post: operations["createTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTask"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["completeTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listAuditEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** Format: uuid */
        Uuid: string;
        DecimalString: string;
        JsonObject: {
            [key: string]: unknown;
        };
        Money: {
            amount: components["schemas"]["DecimalString"];
            currency: string;
        };
        Quantity: {
            value: components["schemas"]["DecimalString"];
            unit: string;
        };
        ResourceMeta: {
            id: components["schemas"]["Uuid"];
            organizationId: components["schemas"]["Uuid"];
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        Resource: {
            id: components["schemas"]["Uuid"];
            version: number;
            href?: string;
            data?: components["schemas"]["JsonObject"];
        } & {
            [key: string]: unknown;
        };
        Capability: string;
        SessionRequest: {
            /** @enum {string} */
            provider: "LOCAL_PASSWORD" | "OIDC_SSO";
            username?: string;
            password?: string;
            authorizationCode?: string;
        };
        Session: {
            user: components["schemas"]["Resource"];
            capabilities: components["schemas"]["Capability"][];
            scopeSummary: components["schemas"]["JsonObject"];
            csrfToken: string;
            authzVersion?: number;
            sessionEpoch?: number;
        };
        CsrfToken: {
            csrfToken: string;
            /** Format: date-time */
            expiresAt: string;
        };
        ProblemViolation: {
            field: string;
            code: string;
            message: string;
        } & {
            [key: string]: unknown;
        };
        VersionConflictMeta: {
            currentVersion: number;
            currentEtag: string;
            resourceHref: string;
        };
        InventoryShortage: {
            skuId: components["schemas"]["Uuid"];
            requested: components["schemas"]["DecimalString"];
            available: components["schemas"]["DecimalString"];
            unit: string;
        };
        InventoryInsufficientMeta: {
            shortages: components["schemas"]["InventoryShortage"][];
        };
        ReversalViolation: {
            skuId: components["schemas"]["Uuid"];
            locationId: components["schemas"]["Uuid"];
            onHand: components["schemas"]["DecimalString"];
            reserved: components["schemas"]["DecimalString"];
            delta: components["schemas"]["DecimalString"];
            unit: string;
        };
        ReversalInvariantMeta: {
            violations: components["schemas"]["ReversalViolation"][];
        };
        CustomerApprovalConflictMeta: {
            customerId: components["schemas"]["Uuid"];
            /** @enum {string} */
            currentCustomerStatus: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "INACTIVE";
            currentApprovalAttemptId?: components["schemas"]["Uuid"];
            currentVersion: number;
        };
        Problem: {
            /** Format: uri */
            type: string;
            title: string;
            status: number;
            detail?: string;
            /** Format: uri-reference */
            instance?: string;
            code: string;
            requestId: components["schemas"]["Uuid"];
            traceId?: string;
            retryable: boolean;
            violations?: components["schemas"]["ProblemViolation"][];
            meta?: {
                [key: string]: unknown;
            };
        } & {
            [key: string]: unknown;
        };
        CsrfFailedProblem: components["schemas"]["Problem"] & {
            /** @constant */
            status?: 403;
            /** @constant */
            code?: "CSRF_FAILED";
            meta?: {
                /** @constant */
                refreshHref: "/api/v1/auth/csrf";
            };
        };
        PreconditionRequiredProblem: components["schemas"]["Problem"] & {
            /** @constant */
            status?: 428;
            /** @constant */
            code?: "PRECONDITION_REQUIRED";
        };
        CommandNotFoundProblem: components["schemas"]["Problem"] & {
            /** @constant */
            status?: 404;
            /** @constant */
            code?: "COMMAND_NOT_FOUND";
        };
        TypedProblemMeta: components["schemas"]["VersionConflictMeta"] | components["schemas"]["InventoryInsufficientMeta"] | components["schemas"]["ReversalInvariantMeta"] | components["schemas"]["CustomerApprovalConflictMeta"];
        CommandStatusBase: {
            commandId: components["schemas"]["Uuid"];
            operationId: string;
            state: string;
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            completedAt: string | null;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            httpStatus: number | null;
            resource: Record<string, never> | null;
            resultHref: string | null;
            problem: components["schemas"]["Problem"] | null;
        };
        CommandStatusInProgress: components["schemas"]["CommandStatusBase"] & {
            /** @constant */
            state: "IN_PROGRESS";
            retryAfterMs: number;
            /** @constant */
            completedAt?: unknown;
            /** @constant */
            httpStatus?: unknown;
            /** @constant */
            resource?: unknown;
            /** @constant */
            resultHref?: unknown;
            /** @constant */
            problem?: unknown;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            state: "IN_PROGRESS";
        };
        CommandStatusRecovery: components["schemas"]["CommandStatusBase"] & {
            /** @constant */
            state?: "RECOVERY_REQUIRED";
            /** @constant */
            retryAfterMs?: 0;
            /** @constant */
            completedAt?: unknown;
            /** @constant */
            httpStatus?: unknown;
            /** @constant */
            resource?: unknown;
            /** @constant */
            resultHref?: unknown;
            /** @constant */
            problem?: unknown;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            state: "RECOVERY_REQUIRED";
        };
        CommandStatusSucceeded: components["schemas"]["CommandStatusBase"] & {
            /** @constant */
            state?: "SUCCEEDED";
            /** Format: date-time */
            completedAt: string;
            httpStatus: number;
            /** @constant */
            problem?: unknown;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            state: "SUCCEEDED";
        };
        CommandStatusFailed: components["schemas"]["CommandStatusBase"] & {
            /** @constant */
            state?: "FAILED";
            /** Format: date-time */
            completedAt: string;
            httpStatus: number;
            problem: components["schemas"]["Problem"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            state: "FAILED";
        };
        CommandStatus: components["schemas"]["CommandStatusInProgress"] | components["schemas"]["CommandStatusRecovery"] | components["schemas"]["CommandStatusSucceeded"] | components["schemas"]["CommandStatusFailed"];
        CustomerApprovalSummary: {
            /** @enum {string} */
            latestOutcome: "PENDING" | "APPROVED" | "REJECTED";
            attemptId: components["schemas"]["Uuid"];
            attemptNo: number;
            reason?: string;
            /** Format: date-time */
            decidedAt?: string;
            decidedBy?: components["schemas"]["Uuid"];
            canResubmit: boolean;
        };
        Customer: components["schemas"]["ResourceMeta"] & {
            /** @enum {string} */
            status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "INACTIVE";
            ownerUserId?: components["schemas"]["Uuid"];
            businessGroupId?: components["schemas"]["Uuid"];
            contacts?: components["schemas"]["JsonObject"][];
            approvalSummary?: components["schemas"]["CustomerApprovalSummary"];
            capabilities: components["schemas"]["Capability"][];
        };
        InventoryOperation: components["schemas"]["ResourceMeta"] & {
            /** @enum {string} */
            operationType: "INITIAL_RECEIPT" | "RECEIPT" | "ADJUSTMENT" | "ISSUE" | "REVERSAL";
            /** @enum {string} */
            status: "DRAFT" | "POSTED" | "REVERSED" | "CANCELLED";
            reversalOperationId?: components["schemas"]["Uuid"];
            reversalHref?: string;
            lines: components["schemas"]["JsonObject"][];
        };
        Href: string;
    };
    responses: {
        /** @description A resource or command result. */
        Resource: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Resource"];
            };
        };
        /** @description Customer resource. */
        Customer: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Customer"];
            };
        };
        /** @description Session resource. */
        Session: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Session"];
            };
        };
        /** @description Session-bound CSRF token. */
        CsrfToken: {
            headers: {
                "Cache-Control"?: "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["CsrfToken"];
            };
        };
        /** @description Authoritative idempotent command state. */
        CommandStatus: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Retry-After"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["CommandStatus"];
            };
        };
        /** @description Inventory operation resource. */
        InventoryOperation: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryOperation"];
            };
        };
        /** @description RFC 9457 problem response. */
        Problem: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description CSRF is missing or invalid before side effects. */
        CsrfFailed: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["CsrfFailedProblem"];
            };
        };
        /** @description A required If-Match or Idempotency-Key header is missing. */
        PreconditionRequired: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["PreconditionRequiredProblem"];
            };
        };
        /** @description Command is not visible to this actor. */
        CommandNotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["CommandNotFoundProblem"];
            };
        };
    };
    parameters: {
        ResourceId: components["schemas"]["Uuid"];
        OperationId: components["schemas"]["Uuid"];
        CsrfHeader: string;
        IdempotencyHeader: string;
        IfMatchHeader: string;
        RequestIdHeader: components["schemas"]["Uuid"];
        CommandOperationHeader: string;
    };
    requestBodies: {
        JsonObject: {
            content: {
                "application/json": components["schemas"]["JsonObject"];
            };
        };
        SessionRequest: {
            content: {
                "application/json": components["schemas"]["SessionRequest"];
            };
        };
    };
    headers: {
        /** @description Correlation identifier. */
        RequestId: components["schemas"]["Uuid"];
        /** @description Strong aggregate version tag. */
        ETag: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getCsrfToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["CsrfToken"];
        };
    };
    createSession: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["SessionRequest"];
        responses: {
            201: components["responses"]["Session"];
            401: components["responses"]["Problem"];
            403: components["responses"]["CsrfFailed"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getCurrentSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Session"];
            401: components["responses"]["Problem"];
        };
    };
    deleteCurrentSession: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Session deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Problem"];
            403: components["responses"]["CsrfFailed"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getCommandStatus: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "X-Command-Operation": components["parameters"]["CommandOperationHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["CommandStatus"];
            404: components["responses"]["CommandNotFound"];
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    createUser: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "X-Request-ID"?: components["parameters"]["RequestIdHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    updateUserRoleBindings: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    updateUserDataScopeGrants: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    disableUser: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listCustomers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createCustomer: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "X-Request-ID"?: components["parameters"]["RequestIdHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Customer"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Customer"];
            404: components["responses"]["Problem"];
        };
    };
    updateCustomer: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    submitCustomerApproval: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    approveCustomer: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    rejectCustomer: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    reassignCustomer: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listProducts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createProduct: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    updateProduct: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listSkus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createSku: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getSku: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    updateSku: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listOrders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createOrder: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    updateOrder: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    transitionOrder: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listInventoryBalances: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    listInventoryMovements: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    listInventoryReservations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createInventoryReservation: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getInventory: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    releaseInventoryReservation: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listInventoryObservations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createInventoryObservation: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getInventoryOperation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["InventoryOperation"];
            404: components["responses"]["Problem"];
        };
    };
    createInitialReceipt: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    createInventoryReceipt: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    createInventoryAdjustment: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    issueInventory: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    reverseInventoryOperation: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                operationId: components["parameters"]["OperationId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["InventoryOperation"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listPayments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createPayment: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getPayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    attachPaymentProof: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    submitPaymentReview: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    reviewPayment: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    reversePayment: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    createUploadIntent: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    completeUpload: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    createDownloadIntent: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: components["responses"]["Resource"];
            403: components["responses"]["CsrfFailed"];
            404: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listDocuments: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: components["schemas"]["Uuid"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getDocument: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    updateDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    createDocumentVersion: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    submitDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    approveDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    rejectDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    finalizeDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    issueDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    voidDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listTasks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
    createTask: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            201: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    getTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
            404: components["responses"]["Problem"];
        };
    };
    completeTask: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                id: components["parameters"]["ResourceId"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["JsonObject"];
        responses: {
            200: components["responses"]["Resource"];
            202: components["responses"]["CommandStatus"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listAuditEvents: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["Resource"];
        };
    };
}
