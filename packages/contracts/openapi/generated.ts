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
        /** @description Nested extension object only; never used as a top-level request or response DTO. */
        JsonObject: {
            [key: string]: unknown;
        };
        /** @enum {string} */
        ResourceType: "USER" | "ORGANIZATION" | "CUSTOMER" | "PRODUCT" | "SKU" | "ORDER" | "PAYMENT" | "FILE" | "DOCUMENT" | "TASK" | "INVENTORY_OPERATION" | "INVENTORY_RESERVATION";
        ResourcePayload: {
            resourceType: components["schemas"]["ResourceType"];
            name?: string;
            description?: string;
            status?: string;
            lines?: components["schemas"]["JsonObject"][];
            metadata?: {
                [key: string]: unknown;
            };
        };
        ResourceCreateRequest: {
            resourceType: components["schemas"]["ResourceType"];
            name: string;
            description?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        ResourceUpdateRequest: {
            name?: string;
            description?: string;
            status?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        ResourceCommandRequest: {
            action: string;
            reason?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        ProductCreateRequest: components["schemas"]["ResourceCreateRequest"];
        SkuCreateRequest: components["schemas"]["ResourceCreateRequest"];
        OrderCreateRequest: components["schemas"]["ResourceCreateRequest"];
        InventoryReservationCreateRequest: components["schemas"]["ResourceCreateRequest"];
        InventoryObservationCreateRequest: components["schemas"]["ResourceCreateRequest"];
        InventoryOperationCreateRequest: components["schemas"]["ResourceCreateRequest"];
        PaymentCreateRequest: components["schemas"]["ResourceCreateRequest"];
        FileCreateRequest: components["schemas"]["ResourceCreateRequest"];
        TaskCreateRequest: components["schemas"]["ResourceCreateRequest"];
        ProductUpdateRequest: components["schemas"]["ResourceUpdateRequest"];
        SkuUpdateRequest: components["schemas"]["ResourceUpdateRequest"];
        OrderUpdateRequest: components["schemas"]["ResourceUpdateRequest"];
        DocumentUpdateRequest: components["schemas"]["ResourceUpdateRequest"];
        OrderCommandRequest: components["schemas"]["ResourceCommandRequest"];
        InventoryCommandRequestTyped: components["schemas"]["ResourceCommandRequest"];
        PaymentCommandRequest: components["schemas"]["ResourceCommandRequest"];
        DocumentCommandRequest: components["schemas"]["ResourceCommandRequest"];
        TaskCommandRequest: components["schemas"]["ResourceCommandRequest"];
        FileCommandRequest: components["schemas"]["ResourceCommandRequest"];
        UserCreateRequest: {
            username: string;
            role: string;
            organizationId?: components["schemas"]["Uuid"];
        };
        RoleBindingsUpdateRequest: {
            bindings: string[];
        };
        DataScopeUpdateRequest: {
            grants: {
                scope: string;
            }[];
        };
        CustomerCreateRequest: {
            name: string;
            ownerUserId: components["schemas"]["Uuid"];
            businessGroupId?: components["schemas"]["Uuid"];
            contacts?: components["schemas"]["JsonObject"][];
        };
        CustomerUpdateRequest: {
            name?: string;
            ownerUserId?: components["schemas"]["Uuid"];
            businessGroupId?: components["schemas"]["Uuid"];
            contacts?: components["schemas"]["JsonObject"][];
        };
        CustomerCommandRequest: {
            /** @enum {string} */
            action: "SUBMIT_APPROVAL" | "APPROVE" | "REJECT" | "REASSIGN";
            reason?: string;
            assigneeUserId?: components["schemas"]["Uuid"];
        };
        InventoryCommandRequest: {
            /** @enum {string} */
            operationType: "INITIAL_RECEIPT" | "RECEIPT" | "ADJUSTMENT" | "ISSUE" | "REVERSAL";
            lines: {
                skuId: components["schemas"]["Uuid"];
                quantity: components["schemas"]["DecimalString"];
                unit?: string;
            }[];
        };
        DocumentCreateRequest: {
            title: string;
            documentType: string;
            fileId?: components["schemas"]["Uuid"];
            metadata?: {
                [key: string]: unknown;
            };
        };
        PageMeta: {
            nextCursor: string | null;
            hasNext: boolean;
        };
        PageResource: {
            data: components["schemas"]["Resource"][];
            page: components["schemas"]["PageMeta"];
        };
        DomainResource: {
            id: components["schemas"]["Uuid"];
            organizationId: components["schemas"]["Uuid"];
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            name?: string;
            status?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        Product: components["schemas"]["DomainResource"];
        Sku: components["schemas"]["DomainResource"];
        Order: components["schemas"]["DomainResource"];
        Payment: components["schemas"]["DomainResource"];
        File: components["schemas"]["DomainResource"];
        Document: components["schemas"]["DomainResource"];
        Task: components["schemas"]["DomainResource"];
        InventoryReservation: components["schemas"]["DomainResource"];
        InventoryBalance: components["schemas"]["DomainResource"];
        InventoryMovement: components["schemas"]["DomainResource"];
        InventoryObservation: components["schemas"]["DomainResource"];
        AuditEvent: components["schemas"]["DomainResource"];
        CustomerPage: {
            data: components["schemas"]["Customer"][];
            page: components["schemas"]["PageMeta"];
        };
        ProductPage: {
            data: components["schemas"]["Product"][];
            page: components["schemas"]["PageMeta"];
        };
        SkuPage: {
            data: components["schemas"]["Sku"][];
            page: components["schemas"]["PageMeta"];
        };
        OrderPage: {
            data: components["schemas"]["Order"][];
            page: components["schemas"]["PageMeta"];
        };
        InventoryPage: {
            data: components["schemas"]["DomainResource"][];
            page: components["schemas"]["PageMeta"];
        };
        InventoryBalancePage: {
            data: components["schemas"]["InventoryBalance"][];
            page: components["schemas"]["PageMeta"];
        };
        InventoryMovementPage: {
            data: components["schemas"]["InventoryMovement"][];
            page: components["schemas"]["PageMeta"];
        };
        InventoryReservationPage: {
            data: components["schemas"]["InventoryReservation"][];
            page: components["schemas"]["PageMeta"];
        };
        InventoryObservationPage: {
            data: components["schemas"]["InventoryObservation"][];
            page: components["schemas"]["PageMeta"];
        };
        PaymentPage: {
            data: components["schemas"]["Payment"][];
            page: components["schemas"]["PageMeta"];
        };
        DocumentPage: {
            data: components["schemas"]["Document"][];
            page: components["schemas"]["PageMeta"];
        };
        TaskPage: {
            data: components["schemas"]["Task"][];
            page: components["schemas"]["PageMeta"];
        };
        AuditEventPage: {
            data: components["schemas"]["AuditEvent"][];
            page: components["schemas"]["PageMeta"];
        };
        User: {
            id: components["schemas"]["Uuid"];
            organizationId: components["schemas"]["Uuid"];
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            username: string;
            role: string;
            /** @enum {string} */
            status: "ACTIVE" | "DISABLED";
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
            href: components["schemas"]["Href"];
            data: components["schemas"]["ResourcePayload"];
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
        CsrfFailedMeta: {
            /** @constant */
            refreshHref: "/api/v1/auth/csrf";
        };
        IdempotencyKeyReusedMeta: {
            operationId: string;
            commandStatusHref: components["schemas"]["Href"];
        };
        StateConflictMeta: {
            resourceType: string;
            resourceId: components["schemas"]["Uuid"];
            currentState: string;
        };
        FileNotReadyMeta: {
            fileId: components["schemas"]["Uuid"];
            state: string;
            statusHref: components["schemas"]["Href"];
        };
        OperationAlreadyReversedMeta: {
            operationId: components["schemas"]["Uuid"];
            reversalOperationId: components["schemas"]["Uuid"];
            reversalHref: components["schemas"]["Href"];
        };
        ReversalNotAllowedMeta: {
            operationId: components["schemas"]["Uuid"];
            operationType: string;
            currentStatus: string;
        };
        ValidationMeta: {
            violations: components["schemas"]["ProblemViolation"][];
        };
        ProblemFields: {
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
            meta?: components["schemas"]["TypedProblemMeta"];
        };
        ProblemGeneric: components["schemas"]["ProblemFields"] & {
            code?: unknown;
            meta?: null;
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "ProblemGeneric";
        };
        ProblemValidationFailed: components["schemas"]["ProblemFields"] & {
            /** @enum {unknown} */
            status?: 400 | 422;
            /** @constant */
            code?: "VALIDATION_FAILED";
            meta: components["schemas"]["ValidationMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "VALIDATION_FAILED";
        };
        ProblemVersionConflict: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "VERSION_CONFLICT";
            meta: components["schemas"]["VersionConflictMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "VERSION_CONFLICT";
        };
        ProblemStateConflict: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "STATE_CONFLICT";
            meta: components["schemas"]["StateConflictMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "STATE_CONFLICT";
        };
        ProblemIdempotencyKeyReused: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "IDEMPOTENCY_KEY_REUSED";
            meta: components["schemas"]["IdempotencyKeyReusedMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "IDEMPOTENCY_KEY_REUSED";
        };
        ProblemInventoryInsufficient: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "INVENTORY_INSUFFICIENT";
            meta: components["schemas"]["InventoryInsufficientMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "INVENTORY_INSUFFICIENT";
        };
        ProblemFileNotReady: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "FILE_NOT_READY";
            meta: components["schemas"]["FileNotReadyMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "FILE_NOT_READY";
        };
        ProblemAlreadyReversed: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "OPERATION_ALREADY_REVERSED";
            meta: components["schemas"]["OperationAlreadyReversedMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "OPERATION_ALREADY_REVERSED";
        };
        ProblemReversalInvariant: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "REVERSAL_WOULD_VIOLATE_INVARIANT";
            meta: components["schemas"]["ReversalInvariantMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "REVERSAL_WOULD_VIOLATE_INVARIANT";
        };
        ProblemReversalNotAllowed: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "REVERSAL_NOT_ALLOWED";
            meta: components["schemas"]["ReversalNotAllowedMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "REVERSAL_NOT_ALLOWED";
        };
        ProblemCustomerApprovalConflict: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 409;
            /** @constant */
            code?: "CUSTOMER_APPROVAL_STATE_CONFLICT";
            meta: components["schemas"]["CustomerApprovalConflictMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "CUSTOMER_APPROVAL_STATE_CONFLICT";
        };
        ProblemCsrfFailed: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 403;
            /** @constant */
            code?: "CSRF_FAILED";
            meta: components["schemas"]["CsrfFailedMeta"];
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            code: "CSRF_FAILED";
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
            meta?: components["schemas"]["TypedProblemMeta"] | null;
        } & (components["schemas"]["ProblemGeneric"] | components["schemas"]["ProblemValidationFailed"] | components["schemas"]["ProblemVersionConflict"] | components["schemas"]["ProblemStateConflict"] | components["schemas"]["ProblemIdempotencyKeyReused"] | components["schemas"]["ProblemInventoryInsufficient"] | components["schemas"]["ProblemFileNotReady"] | components["schemas"]["ProblemAlreadyReversed"] | components["schemas"]["ProblemReversalInvariant"] | components["schemas"]["ProblemReversalNotAllowed"] | components["schemas"]["ProblemCustomerApprovalConflict"] | components["schemas"]["ProblemCsrfFailed"]);
        CsrfFailedProblem: components["schemas"]["ProblemCsrfFailed"];
        PreconditionRequiredProblem: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 428;
            /** @constant */
            code?: "PRECONDITION_REQUIRED";
            meta?: null;
        };
        CommandNotFoundProblem: components["schemas"]["ProblemFields"] & {
            /** @constant */
            status?: 404;
            /** @constant */
            code?: "COMMAND_NOT_FOUND";
            meta?: null;
        };
        TypedProblemMeta: components["schemas"]["VersionConflictMeta"] | components["schemas"]["InventoryInsufficientMeta"] | components["schemas"]["ReversalInvariantMeta"] | components["schemas"]["CustomerApprovalConflictMeta"] | components["schemas"]["CsrfFailedMeta"] | components["schemas"]["IdempotencyKeyReusedMeta"] | components["schemas"]["StateConflictMeta"] | components["schemas"]["FileNotReadyMeta"] | components["schemas"]["OperationAlreadyReversedMeta"] | components["schemas"]["ReversalNotAllowedMeta"] | components["schemas"]["ValidationMeta"];
        ResourceReference: {
            type: components["schemas"]["ResourceType"];
            id: components["schemas"]["Uuid"];
            version?: number;
            href: components["schemas"]["Href"];
        };
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
            resource: components["schemas"]["ResourceReference"] | null;
            resultHref: string | null;
            problem: components["schemas"]["Problem"] | null;
            attemptCount: number;
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
            resource: components["schemas"]["ResourceReference"];
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
        Customer: {
            id: components["schemas"]["Uuid"];
            organizationId: components["schemas"]["Uuid"];
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** @enum {string} */
            status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "INACTIVE";
            ownerUserId?: components["schemas"]["Uuid"];
            businessGroupId?: components["schemas"]["Uuid"];
            contacts?: components["schemas"]["JsonObject"][];
            approvalSummary?: components["schemas"]["CustomerApprovalSummary"];
            capabilities: components["schemas"]["Capability"][];
        };
        InventoryOperation: {
            id: components["schemas"]["Uuid"];
            organizationId: components["schemas"]["Uuid"];
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
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
        /** @description A typed resource envelope. */
        Resource: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Resource"];
            };
        };
        /** @description A newly created typed resource envelope. */
        CreatedResource: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Resource"];
            };
        };
        /** @description Newly created product. */
        CreatedProduct: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Product"];
            };
        };
        /** @description Newly created SKU. */
        CreatedSku: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Sku"];
            };
        };
        /** @description Newly created order. */
        CreatedOrder: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Order"];
            };
        };
        /** @description Newly created inventory reservation. */
        CreatedInventoryReservation: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryReservation"];
            };
        };
        /** @description Newly created inventory observation. */
        CreatedInventoryObservation: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryObservation"];
            };
        };
        /** @description Newly created payment. */
        CreatedPayment: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Payment"];
            };
        };
        /** @description Newly created file resource. */
        CreatedFile: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["File"];
            };
        };
        /** @description Newly created document. */
        CreatedDocument: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Document"];
            };
        };
        /** @description Newly created task. */
        CreatedTask: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Task"];
            };
        };
        /** @description Cursor-paginated typed resources. */
        PageResource: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PageResource"];
            };
        };
        /** @description Cursor-paginated customers. */
        CustomerPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["CustomerPage"];
            };
        };
        /** @description Cursor-paginated products. */
        ProductPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ProductPage"];
            };
        };
        /** @description Cursor-paginated SKUs. */
        SkuPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["SkuPage"];
            };
        };
        /** @description Cursor-paginated orders. */
        OrderPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["OrderPage"];
            };
        };
        /** @description Cursor-paginated inventory resources. */
        InventoryPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryPage"];
            };
        };
        /** @description Cursor-paginated inventory balances. */
        InventoryBalancePage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryBalancePage"];
            };
        };
        /** @description Cursor-paginated inventory movements. */
        InventoryMovementPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryMovementPage"];
            };
        };
        /** @description Cursor-paginated inventory reservations. */
        InventoryReservationPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryReservationPage"];
            };
        };
        /** @description Cursor-paginated inventory observations. */
        InventoryObservationPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryObservationPage"];
            };
        };
        /** @description Cursor-paginated payments. */
        PaymentPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["PaymentPage"];
            };
        };
        /** @description Cursor-paginated documents. */
        DocumentPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["DocumentPage"];
            };
        };
        /** @description Cursor-paginated tasks. */
        TaskPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["TaskPage"];
            };
        };
        /** @description Cursor-paginated audit events. */
        AuditEventPage: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Cache-Control"?: string;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["AuditEventPage"];
            };
        };
        /** @description User resource. */
        User: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["User"];
            };
        };
        /** @description Newly created user resource. */
        CreatedUser: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["User"];
            };
        };
        /** @description Product resource. */
        Product: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Product"];
            };
        };
        /** @description SKU resource. */
        Sku: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Sku"];
            };
        };
        /** @description Order resource. */
        Order: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Order"];
            };
        };
        /** @description Inventory reservation resource. */
        InventoryReservation: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["InventoryReservation"];
            };
        };
        /** @description Payment resource. */
        Payment: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Payment"];
            };
        };
        /** @description File resource. */
        File: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["File"];
            };
        };
        /** @description Document resource. */
        Document: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Document"];
            };
        };
        /** @description Task resource. */
        Task: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Task"];
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
        /** @description Newly created customer resource. */
        CreatedCustomer: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
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
                "Cache-Control"?: "no-store";
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
        /** @description Authoritative terminal/current command state. */
        CommandStatus: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Retry-After"?: string;
                "Cache-Control"?: "no-store";
                "Idempotent-Replay": components["headers"]["IdempotentReplay"];
                "Content-Location": components["headers"]["ContentLocation"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["CommandStatus"];
            };
        };
        /** @description Command accepted and still in progress. */
        CommandStatusInProgress: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                "Retry-After"?: string;
                "Cache-Control"?: "no-store";
                "Content-Location": components["headers"]["ContentLocation"];
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["CommandStatusInProgress"];
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
        /** @description Newly created inventory operation resource. */
        CreatedInventoryOperation: {
            headers: {
                "X-Request-ID": components["headers"]["RequestId"];
                ETag: components["headers"]["ETag"];
                Location: components["headers"]["Location"];
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
        PageAfter: string;
        PageSize: number;
        Sort: string;
        Filter: string;
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
        UserCreateRequest: {
            content: {
                "application/json": components["schemas"]["UserCreateRequest"];
            };
        };
        RoleBindingsUpdateRequest: {
            content: {
                "application/json": components["schemas"]["RoleBindingsUpdateRequest"];
            };
        };
        DataScopeUpdateRequest: {
            content: {
                "application/json": components["schemas"]["DataScopeUpdateRequest"];
            };
        };
        CustomerCreateRequest: {
            content: {
                "application/json": components["schemas"]["CustomerCreateRequest"];
            };
        };
        CustomerUpdateRequest: {
            content: {
                "application/json": components["schemas"]["CustomerUpdateRequest"];
            };
        };
        CustomerCommandRequest: {
            content: {
                "application/json": components["schemas"]["CustomerCommandRequest"];
            };
        };
        InventoryCommandRequest: {
            content: {
                "application/json": components["schemas"]["InventoryCommandRequest"];
            };
        };
        ResourceCreateRequest: {
            content: {
                "application/json": components["schemas"]["ResourceCreateRequest"];
            };
        };
        ResourceUpdateRequest: {
            content: {
                "application/json": components["schemas"]["ResourceUpdateRequest"];
            };
        };
        ResourceCommandRequest: {
            content: {
                "application/json": components["schemas"]["ResourceCommandRequest"];
            };
        };
        ProductCreateRequest: {
            content: {
                "application/json": components["schemas"]["ProductCreateRequest"];
            };
        };
        SkuCreateRequest: {
            content: {
                "application/json": components["schemas"]["SkuCreateRequest"];
            };
        };
        OrderCreateRequest: {
            content: {
                "application/json": components["schemas"]["OrderCreateRequest"];
            };
        };
        InventoryReservationCreateRequest: {
            content: {
                "application/json": components["schemas"]["InventoryReservationCreateRequest"];
            };
        };
        InventoryObservationCreateRequest: {
            content: {
                "application/json": components["schemas"]["InventoryObservationCreateRequest"];
            };
        };
        InventoryOperationCreateRequest: {
            content: {
                "application/json": components["schemas"]["InventoryOperationCreateRequest"];
            };
        };
        PaymentCreateRequest: {
            content: {
                "application/json": components["schemas"]["PaymentCreateRequest"];
            };
        };
        FileCreateRequest: {
            content: {
                "application/json": components["schemas"]["FileCreateRequest"];
            };
        };
        TaskCreateRequest: {
            content: {
                "application/json": components["schemas"]["TaskCreateRequest"];
            };
        };
        ProductUpdateRequest: {
            content: {
                "application/json": components["schemas"]["ProductUpdateRequest"];
            };
        };
        SkuUpdateRequest: {
            content: {
                "application/json": components["schemas"]["SkuUpdateRequest"];
            };
        };
        OrderUpdateRequest: {
            content: {
                "application/json": components["schemas"]["OrderUpdateRequest"];
            };
        };
        DocumentUpdateRequest: {
            content: {
                "application/json": components["schemas"]["DocumentUpdateRequest"];
            };
        };
        OrderCommandRequest: {
            content: {
                "application/json": components["schemas"]["OrderCommandRequest"];
            };
        };
        InventoryCommandRequestTyped: {
            content: {
                "application/json": components["schemas"]["InventoryCommandRequestTyped"];
            };
        };
        PaymentCommandRequest: {
            content: {
                "application/json": components["schemas"]["PaymentCommandRequest"];
            };
        };
        DocumentCommandRequest: {
            content: {
                "application/json": components["schemas"]["DocumentCommandRequest"];
            };
        };
        TaskCommandRequest: {
            content: {
                "application/json": components["schemas"]["TaskCommandRequest"];
            };
        };
        FileCommandRequest: {
            content: {
                "application/json": components["schemas"]["FileCommandRequest"];
            };
        };
        DocumentCreateRequest: {
            content: {
                "application/json": components["schemas"]["DocumentCreateRequest"];
            };
        };
    };
    headers: {
        /** @description Correlation identifier. */
        RequestId: components["schemas"]["Uuid"];
        /** @description Strong aggregate version tag. */
        ETag: string;
        /** @description Created resource location. */
        Location: components["schemas"]["Href"];
        /** @description Command status location. */
        ContentLocation: components["schemas"]["Href"];
        /** @description Indicates a terminal result replay. */
        IdempotentReplay: "true";
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
            200: components["responses"]["User"];
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
        requestBody: components["requestBodies"]["UserCreateRequest"];
        responses: {
            201: components["responses"]["CreatedUser"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["RoleBindingsUpdateRequest"];
        responses: {
            200: components["responses"]["User"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DataScopeUpdateRequest"];
        responses: {
            200: components["responses"]["User"];
            202: components["responses"]["CommandStatusInProgress"];
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
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listCustomers: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["CustomerPage"];
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
        requestBody: components["requestBodies"]["CustomerCreateRequest"];
        responses: {
            201: components["responses"]["CreatedCustomer"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["CustomerUpdateRequest"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["CustomerCommandRequest"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["CustomerCommandRequest"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["CustomerCommandRequest"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["CustomerCommandRequest"];
        responses: {
            200: components["responses"]["Customer"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listProducts: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["ProductPage"];
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
        requestBody: components["requestBodies"]["ProductCreateRequest"];
        responses: {
            201: components["responses"]["CreatedProduct"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["Product"];
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
        requestBody: components["requestBodies"]["ProductUpdateRequest"];
        responses: {
            200: components["responses"]["Product"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listSkus: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["SkuPage"];
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
        requestBody: components["requestBodies"]["SkuCreateRequest"];
        responses: {
            201: components["responses"]["CreatedSku"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["Sku"];
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
        requestBody: components["requestBodies"]["SkuUpdateRequest"];
        responses: {
            200: components["responses"]["Sku"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listOrders: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["OrderPage"];
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
        requestBody: components["requestBodies"]["OrderCreateRequest"];
        responses: {
            201: components["responses"]["CreatedOrder"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["Order"];
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
        requestBody: components["requestBodies"]["OrderUpdateRequest"];
        responses: {
            200: components["responses"]["Order"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["OrderCommandRequest"];
        responses: {
            200: components["responses"]["Order"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listInventoryBalances: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["InventoryBalancePage"];
        };
    };
    listInventoryMovements: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["InventoryMovementPage"];
        };
    };
    listInventoryReservations: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["InventoryReservationPage"];
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
        requestBody: components["requestBodies"]["InventoryReservationCreateRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryReservation"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["InventoryReservation"];
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
        requestBody: components["requestBodies"]["InventoryCommandRequestTyped"];
        responses: {
            200: components["responses"]["InventoryOperation"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listInventoryObservations: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["InventoryObservationPage"];
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
        requestBody: components["requestBodies"]["InventoryObservationCreateRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryObservation"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["InventoryOperationCreateRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryOperation"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["InventoryOperationCreateRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryOperation"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["InventoryOperationCreateRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryOperation"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["InventoryOperationCreateRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryOperation"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["InventoryCommandRequest"];
        responses: {
            201: components["responses"]["CreatedInventoryOperation"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listPayments: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["PaymentPage"];
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
        requestBody: components["requestBodies"]["PaymentCreateRequest"];
        responses: {
            201: components["responses"]["CreatedPayment"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["Payment"];
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
        requestBody: components["requestBodies"]["PaymentCommandRequest"];
        responses: {
            200: components["responses"]["Payment"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["PaymentCommandRequest"];
        responses: {
            200: components["responses"]["Payment"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["PaymentCommandRequest"];
        responses: {
            200: components["responses"]["Payment"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["PaymentCommandRequest"];
        responses: {
            200: components["responses"]["Payment"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["File"];
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
        requestBody: components["requestBodies"]["FileCreateRequest"];
        responses: {
            201: components["responses"]["CreatedFile"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["FileCommandRequest"];
        responses: {
            200: components["responses"]["File"];
            202: components["responses"]["CommandStatusInProgress"];
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
            201: components["responses"]["CreatedFile"];
            403: components["responses"]["CsrfFailed"];
            404: components["responses"]["Problem"];
        };
    };
    listDocuments: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path: {
                orderId: components["schemas"]["Uuid"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["DocumentPage"];
        };
    };
    createDocument: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": components["parameters"]["CsrfHeader"];
                "Idempotency-Key": components["parameters"]["IdempotencyHeader"];
                "If-Match": components["parameters"]["IfMatchHeader"];
            };
            path: {
                orderId: components["schemas"]["Uuid"];
            };
            cookie?: never;
        };
        requestBody: components["requestBodies"]["DocumentCreateRequest"];
        responses: {
            201: components["responses"]["CreatedDocument"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["Document"];
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
        requestBody: components["requestBodies"]["DocumentUpdateRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
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
        requestBody: components["requestBodies"]["DocumentCommandRequest"];
        responses: {
            200: components["responses"]["Document"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listTasks: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["TaskPage"];
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
        requestBody: components["requestBodies"]["TaskCreateRequest"];
        responses: {
            201: components["responses"]["CreatedTask"];
            202: components["responses"]["CommandStatusInProgress"];
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
            200: components["responses"]["Task"];
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
        requestBody: components["requestBodies"]["TaskCommandRequest"];
        responses: {
            200: components["responses"]["Task"];
            202: components["responses"]["CommandStatusInProgress"];
            403: components["responses"]["CsrfFailed"];
            409: components["responses"]["Problem"];
            428: components["responses"]["PreconditionRequired"];
        };
    };
    listAuditEvents: {
        parameters: {
            query?: {
                "page[after]"?: components["parameters"]["PageAfter"];
                "page[size]"?: components["parameters"]["PageSize"];
                sort?: components["parameters"]["Sort"];
                filter?: components["parameters"]["Filter"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: components["responses"]["AuditEventPage"];
        };
    };
}
