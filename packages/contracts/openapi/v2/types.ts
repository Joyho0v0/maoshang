export interface paths {
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCsrfTokenV2"];
        put?: never;
        post?: never;
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
        get: operations["getCurrentSessionV2"];
        put?: never;
        post?: never;
        delete?: never;
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
        get: operations["getCommandStatusV2"];
        put?: never;
        post?: never;
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
        /** @description Product list uses a single status filter and a resource-specific sort union. Other single-column sorts append the same-direction id tie-breaker; string comparisons use COLLATE "C". */
        get: operations["listProductsV2"];
        put?: never;
        post: operations["createProductV2"];
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
            path: {
                id: string;
            };
            cookie?: never;
        };
        get: operations["getProductV2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateProductV2"];
        trace?: never;
    };
    "/skus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description SKU list uses a single status filter and a resource-specific sort union. Other single-column sorts append the same-direction id tie-breaker; string comparisons use COLLATE "C". */
        get: operations["listSkusV2"];
        put?: never;
        post: operations["createSkuV2"];
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
            path: {
                id: string;
            };
            cookie?: never;
        };
        get: operations["getSkuV2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateSkuV2"];
        trace?: never;
    };
    "/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Order list uses a single status filter and a resource-specific sort union. Other single-column sorts append the same-direction id tie-breaker; string comparisons use COLLATE "C". */
        get: operations["listOrdersV2"];
        put?: never;
        post: operations["createOrderV2"];
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
            path: {
                id: string;
            };
            cookie?: never;
        };
        get: operations["getOrderV2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description Complete replacement edit. Only DRAFT orders at INITIAL_CONTACT, QUOTING, or QUOTE_FOLLOW_UP may be edited. Existing line IDs omitted from the replacement are removed; new lines use lineId null. */
        patch: operations["updateOrderV2"];
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
        /** @description Adjacent stage advance or terminal cancellation. CANCEL preserves the last stage and overrides status to CANCELLED. */
        post: operations["transitionOrderV2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{fileId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Files-owned status/read support surface. This is not a download endpoint. */
        get: operations["getFileStatusV2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/files/{fileId}/download-intents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Files-owned short-lived download intent. Upload and complete-upload remain v1 operations. */
        post: operations["createFileDownloadIntentV2"];
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
        Currency: string;
        /** Format: date-time */
        DateTime: string;
        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
        DecimalQuantity: string;
        /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
        DecimalThreshold: string;
        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
        DecimalAmount: string;
        /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
        DecimalRate: string;
        RiskBufferBps: number;
        /** @enum {string} */
        StandardizationMode: "STRICT" | "SIMPLE" | "NONE";
        /** @enum {string} */
        TrackingMode: "NONE" | "LOT" | "SERIAL";
        /** @enum {string} */
        ProductStatus: "ACTIVE" | "INACTIVE";
        /** @enum {string} */
        SkuStatus: "ACTIVE" | "INACTIVE";
        /** @enum {string} */
        OrderStatus: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
        /** @enum {string} */
        OrderStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
        CsrfToken: {
            csrfToken: string;
            /** Format: date-time */
            expiresAt: string;
        };
        Session: {
            /** Format: uuid */
            userId: string;
            /** Format: uuid */
            organizationId: string;
            /** Format: date-time */
            expiresAt: string;
        };
        ProductCreateRequestV2: {
            name: string;
            productCode: string;
            unit: string;
            description?: string;
            /** Format: uuid */
            categoryId?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        ProductUpdateRequestV2: {
            name?: string;
            unit?: string;
            description?: string;
            /** Format: uuid */
            categoryId?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        SkuCreateRequestV2: {
            /** Format: uuid */
            productId: string;
            skuCode: string;
            name: string;
            unit: string;
            /** @description Optional; defaults to unit when omitted. */
            baseUnit?: string;
            /**
             * @description Optional; defaults to NONE when omitted.
             * @enum {string}
             */
            trackingMode?: "NONE" | "LOT" | "SERIAL";
            /**
             * @description Required policy; no default and never inferred from trackingMode.
             * @enum {string}
             */
            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
            /** @description Optional; defaults to DecimalString 0 when omitted. */
            lowStockThreshold?: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        SkuUpdateRequestV2: {
            name?: string;
            unit?: string;
            baseUnit?: string;
            /** @enum {string} */
            trackingMode?: "NONE" | "LOT" | "SERIAL";
            /** @enum {string} */
            standardizationMode?: "STRICT" | "SIMPLE" | "NONE";
            /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
            lowStockThreshold?: string;
            metadata?: {
                [key: string]: unknown;
            };
            pricePolicy?: {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                action: "CREATE";
                currency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                unitPrice: string;
                /** Format: date-time */
                validFrom: string;
                validTo: string | null;
                isPrimary: boolean;
                riskBufferBps: number;
            } | {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                action: "REPLACE";
                /** Format: uuid */
                policyId: string;
                version: number;
                currency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                unitPrice: string;
                /** Format: date-time */
                validFrom: string;
                validTo: string | null;
                isPrimary: boolean;
                riskBufferBps: number;
            } | {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                action: "END";
                /** Format: uuid */
                policyId: string;
                version: number;
                /** Format: date-time */
                validTo: string;
            };
        };
        PricePolicyCreateV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "CREATE";
            currency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            unitPrice: string;
            /** Format: date-time */
            validFrom: string;
            validTo: string | null;
            isPrimary: boolean;
            riskBufferBps: number;
        };
        PricePolicyReplaceV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "REPLACE";
            /** Format: uuid */
            policyId: string;
            version: number;
            currency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            unitPrice: string;
            /** Format: date-time */
            validFrom: string;
            validTo: string | null;
            isPrimary: boolean;
            riskBufferBps: number;
        };
        PricePolicyEndV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "END";
            /** Format: uuid */
            policyId: string;
            version: number;
            /** Format: date-time */
            validTo: string;
        };
        PricePolicyMutationV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "CREATE";
            currency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            unitPrice: string;
            /** Format: date-time */
            validFrom: string;
            validTo: string | null;
            isPrimary: boolean;
            riskBufferBps: number;
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "REPLACE";
            /** Format: uuid */
            policyId: string;
            version: number;
            currency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            unitPrice: string;
            /** Format: date-time */
            validFrom: string;
            validTo: string | null;
            isPrimary: boolean;
            riskBufferBps: number;
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "END";
            /** Format: uuid */
            policyId: string;
            version: number;
            /** Format: date-time */
            validTo: string;
        };
        PricePolicyV2: {
            /** Format: uuid */
            policyId: string;
            version: number;
            /** @enum {string} */
            lifecycle: "ACTIVE" | "ENDED";
            currency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            unitPrice: string;
            /** Format: date-time */
            validFrom: string;
            validTo: string | null;
            isPrimary: boolean;
            riskBufferBps: number;
        };
        OrderStandardLineRequestV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "STANDARD";
            /** Format: uuid */
            skuId: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** Format: uuid */
            imageFileId?: string;
        };
        OrderNonStandardLineRequestV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "NON_STANDARD";
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            quotedUnitPrice: string;
            /** @enum {string} */
            standardizationMode: "SIMPLE" | "NONE";
            /** Format: uuid */
            imageFileId?: string;
        };
        OrderLineRequestV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "STANDARD";
            /** Format: uuid */
            skuId: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** Format: uuid */
            imageFileId?: string;
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "NON_STANDARD";
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            quotedUnitPrice: string;
            /** @enum {string} */
            standardizationMode: "SIMPLE" | "NONE";
            /** Format: uuid */
            imageFileId?: string;
        };
        OrderCreateRequestV2: {
            /** Format: uuid */
            customerId: string;
            orderNo: string;
            currency: string;
            lines: ({
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                itemKind: "STANDARD";
                /** Format: uuid */
                skuId: string;
                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                quantity: string;
                /** Format: uuid */
                imageFileId?: string;
            } | {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                itemKind: "NON_STANDARD";
                name: string;
                unit: string;
                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                quantity: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                quotedUnitPrice: string;
                /** @enum {string} */
                standardizationMode: "SIMPLE" | "NONE";
                /** Format: uuid */
                imageFileId?: string;
            })[];
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** @description Complete replacement when lines is present. metadata is a complete public-metadata replacement; omitted properties are unchanged. */
        OrderUpdateRequestV2: {
            metadata?: {
                [key: string]: unknown;
            };
            lines?: ({
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                itemKind: "STANDARD";
                lineId: string | null;
                /** Format: uuid */
                skuId: string;
                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                quantity: string;
                imageFileId: string | null;
            } | {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                itemKind: "NON_STANDARD";
                lineId: string | null;
                name: string;
                unit: string;
                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                quantity: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                quotedUnitPrice: string;
                /** @enum {string} */
                standardizationMode: "SIMPLE" | "NONE";
                imageFileId: string | null;
            })[];
        };
        OrderTransitionRequestV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "ADVANCE";
            /** @enum {string} */
            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
            reason?: string;
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "CANCEL";
            reason?: string;
        };
        OrderAdvanceActionV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "ADVANCE";
            /** @enum {string} */
            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
            reason?: string;
        };
        OrderCancelActionV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "CANCEL";
            reason?: string;
        };
        OrderStandardLineReplacementV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "STANDARD";
            lineId: string | null;
            /** Format: uuid */
            skuId: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            imageFileId: string | null;
        };
        OrderNonStandardLineReplacementV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "NON_STANDARD";
            lineId: string | null;
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            quotedUnitPrice: string;
            /** @enum {string} */
            standardizationMode: "SIMPLE" | "NONE";
            imageFileId: string | null;
        };
        OrderLineReplacementV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "STANDARD";
            lineId: string | null;
            /** Format: uuid */
            skuId: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            imageFileId: string | null;
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "NON_STANDARD";
            lineId: string | null;
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            quotedUnitPrice: string;
            /** @enum {string} */
            standardizationMode: "SIMPLE" | "NONE";
            imageFileId: string | null;
        };
        PriceSnapshotV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            sourceKind: "CATALOG_POLICY";
            sourceCurrency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            sourceUnitPrice: string;
            /** Format: date-time */
            capturedAt: string;
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            sourceKind: "MANUAL_QUOTE";
            sourceCurrency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            sourceUnitPrice: string;
            /** Format: date-time */
            capturedAt: string;
        };
        PriceSnapshotCatalogPolicyV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            sourceKind: "CATALOG_POLICY";
            sourceCurrency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            sourceUnitPrice: string;
            /** Format: date-time */
            capturedAt: string;
        };
        PriceSnapshotManualQuoteV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            sourceKind: "MANUAL_QUOTE";
            sourceCurrency: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            sourceUnitPrice: string;
            /** Format: date-time */
            capturedAt: string;
        };
        FxSnapshotV2: null | {
            baseCurrency: string;
            quoteCurrency: string;
            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
            rawMarketRate: string;
            riskBufferBps: number;
            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
            effectiveRate: string;
            source: string;
            /** Format: date-time */
            capturedAt: string;
        };
        OrderStandardLineV2: {
            /** Format: uuid */
            lineId: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "STANDARD";
            /** Format: uuid */
            skuId: string;
            /** @enum {string} */
            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            effectiveUnitPrice: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            lineAmount: string;
            currency: string;
            priceSnapshot: {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                sourceKind: "CATALOG_POLICY";
                sourceCurrency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                sourceUnitPrice: string;
                /** Format: date-time */
                capturedAt: string;
            };
            fxSnapshot: null | {
                baseCurrency: string;
                quoteCurrency: string;
                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                rawMarketRate: string;
                riskBufferBps: number;
                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                effectiveRate: string;
                source: string;
                /** Format: date-time */
                capturedAt: string;
            };
            imageFileId: string | null;
        };
        OrderNonStandardLineV2: {
            /** Format: uuid */
            lineId: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "NON_STANDARD";
            /** @enum {string} */
            standardizationMode: "SIMPLE" | "NONE";
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            effectiveUnitPrice: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            lineAmount: string;
            currency: string;
            priceSnapshot: {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                sourceKind: "MANUAL_QUOTE";
                sourceCurrency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                sourceUnitPrice: string;
                /** Format: date-time */
                capturedAt: string;
            };
            fxSnapshot: null;
            imageFileId: string | null;
        };
        OrderLineV2: {
            /** Format: uuid */
            lineId: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "STANDARD";
            /** Format: uuid */
            skuId: string;
            /** @enum {string} */
            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            effectiveUnitPrice: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            lineAmount: string;
            currency: string;
            priceSnapshot: {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                sourceKind: "CATALOG_POLICY";
                sourceCurrency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                sourceUnitPrice: string;
                /** Format: date-time */
                capturedAt: string;
            };
            fxSnapshot: null | {
                baseCurrency: string;
                quoteCurrency: string;
                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                rawMarketRate: string;
                riskBufferBps: number;
                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                effectiveRate: string;
                source: string;
                /** Format: date-time */
                capturedAt: string;
            };
            imageFileId: string | null;
        } | {
            /** Format: uuid */
            lineId: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            itemKind: "NON_STANDARD";
            /** @enum {string} */
            standardizationMode: "SIMPLE" | "NONE";
            name: string;
            unit: string;
            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
            quantity: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            effectiveUnitPrice: string;
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            lineAmount: string;
            currency: string;
            priceSnapshot: {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                sourceKind: "MANUAL_QUOTE";
                sourceCurrency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                sourceUnitPrice: string;
                /** Format: date-time */
                capturedAt: string;
            };
            fxSnapshot: null;
            imageFileId: string | null;
        };
        ProductV2: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            organizationId: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            productCode: string;
            name: string;
            unit: string;
            description?: string;
            categoryId?: string | null;
            /** @enum {string} */
            status: "ACTIVE" | "INACTIVE";
            metadata?: {
                [key: string]: unknown;
            };
        };
        SkuV2: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            organizationId: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: uuid */
            productId: string;
            skuCode: string;
            name: string;
            unit: string;
            baseUnit: string;
            /** @enum {string} */
            trackingMode: "NONE" | "LOT" | "SERIAL";
            standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
            /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
            lowStockThreshold: string;
            /** @enum {string} */
            status: "ACTIVE" | "INACTIVE";
            pricePolicies: {
                /** Format: uuid */
                policyId: string;
                version: number;
                /** @enum {string} */
                lifecycle: "ACTIVE" | "ENDED";
                currency: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                unitPrice: string;
                /** Format: date-time */
                validFrom: string;
                validTo: string | null;
                isPrimary: boolean;
                riskBufferBps: number;
            }[];
            metadata?: {
                [key: string]: unknown;
            };
        };
        /** @description status is the stage projection except CANCELLED, which overrides while retaining the last stage. Terminal statuses have empty allowedTransitions. */
        OrderV2: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            organizationId: string;
            version: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            /** Format: uuid */
            customerId: string;
            orderNo: string;
            currency: string;
            /** @enum {string} */
            status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
            /** @enum {string} */
            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
            lines: ({
                /** Format: uuid */
                lineId: string;
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                itemKind: "STANDARD";
                /** Format: uuid */
                skuId: string;
                /** @enum {string} */
                standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                name: string;
                unit: string;
                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                quantity: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                effectiveUnitPrice: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                lineAmount: string;
                currency: string;
                priceSnapshot: {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    sourceKind: "CATALOG_POLICY";
                    sourceCurrency: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    sourceUnitPrice: string;
                    /** Format: date-time */
                    capturedAt: string;
                };
                fxSnapshot: null | {
                    baseCurrency: string;
                    quoteCurrency: string;
                    /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                    rawMarketRate: string;
                    riskBufferBps: number;
                    /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                    effectiveRate: string;
                    source: string;
                    /** Format: date-time */
                    capturedAt: string;
                };
                imageFileId: string | null;
            } | {
                /** Format: uuid */
                lineId: string;
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                itemKind: "NON_STANDARD";
                /** @enum {string} */
                standardizationMode: "SIMPLE" | "NONE";
                name: string;
                unit: string;
                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                quantity: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                effectiveUnitPrice: string;
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                lineAmount: string;
                currency: string;
                priceSnapshot: {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    sourceKind: "MANUAL_QUOTE";
                    sourceCurrency: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    sourceUnitPrice: string;
                    /** Format: date-time */
                    capturedAt: string;
                };
                fxSnapshot: null;
                imageFileId: string | null;
            })[];
            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
            totalAmount: string;
            allowedTransitions: ({
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                action: "ADVANCE";
                /** @enum {string} */
                toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
            } | {
                /**
                 * @description discriminator enum property added by openapi-typescript
                 * @enum {string}
                 */
                action: "CANCEL";
            })[];
            capabilities: ("order.update" | "order.transition")[];
            metadata?: {
                [key: string]: unknown;
            };
        } & ({
            /** @constant */
            status: "DRAFT";
            /** @enum {unknown} */
            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
        } | {
            /** @constant */
            status: "CONFIRMED";
            /** @enum {unknown} */
            stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
        } | {
            /** @constant */
            status: "FULFILLED";
            /** @constant */
            stage: "CLOSED";
        } | {
            /** @constant */
            status: "CANCELLED";
            /** @enum {unknown} */
            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
        });
        OrderStatusStageProjectionV2: {
            /** @constant */
            status: "DRAFT";
            /** @enum {unknown} */
            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
        } | {
            /** @constant */
            status: "CONFIRMED";
            /** @enum {unknown} */
            stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
        } | {
            /** @constant */
            status: "FULFILLED";
            /** @constant */
            stage: "CLOSED";
        } | {
            /** @constant */
            status: "CANCELLED";
            /** @enum {unknown} */
            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
        };
        /** @enum {string} */
        OrderCapabilityV2: "order.update" | "order.transition";
        AllowedAdvanceTransitionV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "ADVANCE";
            /** @enum {string} */
            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
        };
        AllowedCancelTransitionV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "CANCEL";
        };
        AllowedTransitionV2: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "ADVANCE";
            /** @enum {string} */
            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
        } | {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            action: "CANCEL";
        };
        PageMeta: {
            nextCursor: string | null;
            hasNext: boolean;
        };
        /** @description Opaque signed cursor. Payload binds version, operation, resource, organization, scopeFingerprint, authzVersion, normalized sort/filters, pageSize and lastTuple. */
        CursorV2: string;
        /** @enum {string} */
        ProductSortV2: "name" | "-name" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
        /** @enum {string} */
        SkuSortV2: "skuCode" | "-skuCode" | "name" | "-name" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
        /** @enum {string} */
        OrderSortV2: "orderNo" | "-orderNo" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
        ProductPage: {
            data: {
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                organizationId: string;
                version: number;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                productCode: string;
                name: string;
                unit: string;
                description?: string;
                categoryId?: string | null;
                /** @enum {string} */
                status: "ACTIVE" | "INACTIVE";
                metadata?: {
                    [key: string]: unknown;
                };
            }[];
            page: {
                nextCursor: string | null;
                hasNext: boolean;
            };
        };
        SkuPage: {
            data: {
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                organizationId: string;
                version: number;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                /** Format: uuid */
                productId: string;
                skuCode: string;
                name: string;
                unit: string;
                baseUnit: string;
                /** @enum {string} */
                trackingMode: "NONE" | "LOT" | "SERIAL";
                standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                lowStockThreshold: string;
                /** @enum {string} */
                status: "ACTIVE" | "INACTIVE";
                pricePolicies: {
                    /** Format: uuid */
                    policyId: string;
                    version: number;
                    /** @enum {string} */
                    lifecycle: "ACTIVE" | "ENDED";
                    currency: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    unitPrice: string;
                    /** Format: date-time */
                    validFrom: string;
                    validTo: string | null;
                    isPrimary: boolean;
                    riskBufferBps: number;
                }[];
                metadata?: {
                    [key: string]: unknown;
                };
            }[];
            page: {
                nextCursor: string | null;
                hasNext: boolean;
            };
        };
        OrderPage: {
            data: ({
                /** Format: uuid */
                id: string;
                /** Format: uuid */
                organizationId: string;
                version: number;
                /** Format: date-time */
                createdAt: string;
                /** Format: date-time */
                updatedAt: string;
                /** Format: uuid */
                customerId: string;
                orderNo: string;
                currency: string;
                /** @enum {string} */
                status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                /** @enum {string} */
                stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                lines: ({
                    /** Format: uuid */
                    lineId: string;
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    itemKind: "STANDARD";
                    /** Format: uuid */
                    skuId: string;
                    /** @enum {string} */
                    standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                    name: string;
                    unit: string;
                    /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                    quantity: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    effectiveUnitPrice: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    lineAmount: string;
                    currency: string;
                    priceSnapshot: {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        sourceKind: "CATALOG_POLICY";
                        sourceCurrency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        sourceUnitPrice: string;
                        /** Format: date-time */
                        capturedAt: string;
                    };
                    fxSnapshot: null | {
                        baseCurrency: string;
                        quoteCurrency: string;
                        /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                        rawMarketRate: string;
                        riskBufferBps: number;
                        /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                        effectiveRate: string;
                        source: string;
                        /** Format: date-time */
                        capturedAt: string;
                    };
                    imageFileId: string | null;
                } | {
                    /** Format: uuid */
                    lineId: string;
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    itemKind: "NON_STANDARD";
                    /** @enum {string} */
                    standardizationMode: "SIMPLE" | "NONE";
                    name: string;
                    unit: string;
                    /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                    quantity: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    effectiveUnitPrice: string;
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    lineAmount: string;
                    currency: string;
                    priceSnapshot: {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        sourceKind: "MANUAL_QUOTE";
                        sourceCurrency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        sourceUnitPrice: string;
                        /** Format: date-time */
                        capturedAt: string;
                    };
                    fxSnapshot: null;
                    imageFileId: string | null;
                })[];
                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                totalAmount: string;
                allowedTransitions: ({
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    action: "ADVANCE";
                    /** @enum {string} */
                    toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                } | {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    action: "CANCEL";
                })[];
                capabilities: ("order.update" | "order.transition")[];
                metadata?: {
                    [key: string]: unknown;
                };
            } & ({
                /** @constant */
                status: "DRAFT";
                /** @enum {unknown} */
                stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
            } | {
                /** @constant */
                status: "CONFIRMED";
                /** @enum {unknown} */
                stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
            } | {
                /** @constant */
                status: "FULFILLED";
                /** @constant */
                stage: "CLOSED";
            } | {
                /** @constant */
                status: "CANCELLED";
                /** @enum {unknown} */
                stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
            }))[];
            page: {
                nextCursor: string | null;
                hasNext: boolean;
            };
        };
        FileStatusV2: {
            /** Format: uuid */
            id: string;
            version: number;
            /** @enum {string} */
            status: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "AVAILABLE" | "REJECTED" | "QUARANTINED";
            /** Format: date-time */
            updatedAt: string;
            href: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        FileHrefV2: string;
        FileDownloadIntentFileV2: {
            /** Format: uuid */
            id: string;
            version: number;
            /** @constant */
            status: "AVAILABLE";
            /** Format: date-time */
            updatedAt: string;
            metadata?: {
                [key: string]: unknown;
            };
        };
        DownloadTransferV2: {
            /** @constant */
            kind: "HTTP_GET";
            /** @constant */
            method: "GET";
            /** Format: uri */
            locator: string;
            /** Format: date-time */
            expiresAt: string;
            headers: {
                [key: string]: string;
            };
        };
        FileDownloadIntentV2: {
            file: {
                /** Format: uuid */
                id: string;
                version: number;
                /** @constant */
                status: "AVAILABLE";
                /** Format: date-time */
                updatedAt: string;
                metadata?: {
                    [key: string]: unknown;
                };
            };
            href: string;
            transfer: {
                /** @constant */
                kind: "HTTP_GET";
                /** @constant */
                method: "GET";
                /** Format: uri */
                locator: string;
                /** Format: date-time */
                expiresAt: string;
                headers: {
                    [key: string]: string;
                };
            };
        };
        CommandStatusCommonV2: {
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        };
        CommandResourceV2: {
            /** @enum {string} */
            resourceType: "PRODUCT" | "SKU" | "ORDER";
            /** Format: uuid */
            resourceId: string;
            href: string;
        };
        CommandStatusInProgressV2: {
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "IN_PROGRESS";
            retryAfterMs: number;
            completedAt: null;
            httpStatus: null;
            resource: null;
            resultHref: null;
            problem: null;
        };
        CommandStatusRecoveryV2: {
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "RECOVERY_REQUIRED";
            /** @constant */
            retryAfterMs: 0;
            completedAt: null;
            httpStatus: null;
            resource: null;
            resultHref: null;
            problem: null;
        };
        CommandStatusSucceededV2: {
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "SUCCEEDED";
            /** @constant */
            retryAfterMs?: 0;
            /** Format: date-time */
            completedAt: string;
            httpStatus: number;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            };
            resultHref: string | null;
            problem: null;
        };
        CommandStatusFailedV2: {
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "FAILED";
            /** @constant */
            retryAfterMs?: 0;
            /** Format: date-time */
            completedAt: string;
            resource: null;
            resultHref: null;
        } & ({
            /** @constant */
            httpStatus: 400;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            };
        } | {
            /** @constant */
            httpStatus: 401;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            });
        } | {
            /** @constant */
            httpStatus: 403;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            });
        } | {
            /** @constant */
            httpStatus: 404;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            });
        } | {
            /** @constant */
            httpStatus: 409;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            });
        } | {
            /** @constant */
            httpStatus: 428;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            };
        } | {
            /** @constant */
            httpStatus: 429;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            };
        } | {
            /** @constant */
            httpStatus: 500;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            };
        });
        CommandStatus: ({
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "IN_PROGRESS";
            retryAfterMs: number;
            completedAt: null;
            httpStatus: null;
            resource: null;
            resultHref: null;
            problem: null;
        }) | ({
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "SUCCEEDED";
            /** @constant */
            retryAfterMs?: 0;
            /** Format: date-time */
            completedAt: string;
            httpStatus: number;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            };
            resultHref: string | null;
            problem: null;
        }) | ({
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "FAILED";
            /** @constant */
            retryAfterMs?: 0;
            /** Format: date-time */
            completedAt: string;
            resource: null;
            resultHref: null;
        } & ({
            /** @constant */
            httpStatus: 400;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            };
        } | {
            /** @constant */
            httpStatus: 401;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            });
        } | {
            /** @constant */
            httpStatus: 403;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            });
        } | {
            /** @constant */
            httpStatus: 404;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            });
        } | {
            /** @constant */
            httpStatus: 409;
            problem: ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            });
        } | {
            /** @constant */
            httpStatus: 428;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            };
        } | {
            /** @constant */
            httpStatus: 429;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            };
        } | {
            /** @constant */
            httpStatus: 500;
            problem: {
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            };
        })) | ({
            /** Format: uuid */
            commandId: string;
            operationId: string;
            /** @enum {string} */
            state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
            /** Format: date-time */
            startedAt: string;
            /** Format: date-time */
            expiresAt: string;
            retryAfterMs: number;
            completedAt: string | null;
            httpStatus: number | null;
            resource: {
                /** @enum {string} */
                resourceType: "PRODUCT" | "SKU" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                href: string;
            } | null;
            resultHref: string | null;
            problem: (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 400;
                /** @constant */
                code: "VALIDATION_FAILED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VALIDATION";
                    violations: {
                        field: string;
                        code: string;
                        message: string;
                    }[];
                };
            }) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "AUTHENTICATION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 401;
                /** @constant */
                code: "SESSION_EXPIRED";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "PERMISSION_DENIED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 403;
                /** @constant */
                code: "CSRF_FAILED";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "CSRF";
                    /** @constant */
                    refreshHref: "/api/v2/auth/csrf";
                };
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "RESOURCE_NOT_FOUND";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 404;
                /** @constant */
                code: "COMMAND_NOT_FOUND";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "STATE_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "STATE_CONFLICT";
                    /** @enum {string} */
                    resourceType: "SKU" | "FILE" | "ORDER";
                    /** Format: uuid */
                    resourceId: string;
                    currentState: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "VERSION_CONFLICT";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "VERSION_CONFLICT";
                    currentVersion: number;
                    currentEtag: string;
                    resourceHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "IDEMPOTENCY_KEY_REUSED";
                /** @constant */
                retryable: false;
                meta: {
                    /** @constant */
                    kind: "IDEMPOTENCY";
                    operationId: string;
                    /** @constant */
                    commandStatusHref: "/api/v2/commands/status";
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "FILE_NOT_READY";
                /** @constant */
                retryable: true;
                meta: {
                    /** @constant */
                    kind: "FILE_NOT_READY";
                    /** Format: uuid */
                    fileId: string;
                    /** @enum {string} */
                    state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                    statusHref: string;
                };
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 409;
                /** @constant */
                code: "DUPLICATE_BUSINESS_KEY";
                /** @constant */
                retryable: false;
            })) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 428;
                /** @constant */
                code: "PRECONDITION_REQUIRED";
                /** @constant */
                retryable: false;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 429;
                /** @constant */
                code: "RATE_LIMITED";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: false;
            })) | (({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 500;
                /** @constant */
                code: "INTERNAL_ERROR";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 502;
                /** @constant */
                code: "DEPENDENCY_FAILURE";
                /** @constant */
                retryable: true;
            }) | ({
                type: string;
                title: string;
                status: number;
                detail?: string;
                instance?: string;
                code: string;
                /** Format: uuid */
                requestId: string;
                retryable: boolean;
            } & {
                /** @constant */
                status: 503;
                /** @constant */
                code: "DEPENDENCY_UNAVAILABLE";
                /** @constant */
                retryable: true;
            })) | null;
        } & {
            /** @constant */
            state: "RECOVERY_REQUIRED";
            /** @constant */
            retryAfterMs: 0;
            completedAt: null;
            httpStatus: null;
            resource: null;
            resultHref: null;
            problem: null;
        });
        ProblemViolation: {
            field: string;
            code: string;
            message: string;
        };
        ValidationMeta: {
            /** @constant */
            kind: "VALIDATION";
            violations: {
                field: string;
                code: string;
                message: string;
            }[];
        };
        IdempotencyMeta: {
            /** @constant */
            kind: "IDEMPOTENCY";
            operationId: string;
            /** @constant */
            commandStatusHref: "/api/v2/commands/status";
        };
        StateConflictMeta: {
            /** @constant */
            kind: "STATE_CONFLICT";
            /** @enum {string} */
            resourceType: "SKU" | "FILE" | "ORDER";
            /** Format: uuid */
            resourceId: string;
            currentState: string;
        };
        VersionConflictMeta: {
            /** @constant */
            kind: "VERSION_CONFLICT";
            currentVersion: number;
            currentEtag: string;
            resourceHref: string;
        };
        FileNotReadyMeta: {
            /** @constant */
            kind: "FILE_NOT_READY";
            /** Format: uuid */
            fileId: string;
            /** @enum {string} */
            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
            statusHref: string;
        };
        CsrfFailedMeta: {
            /** @constant */
            kind: "CSRF";
            /** @constant */
            refreshHref: "/api/v2/auth/csrf";
        };
        ProblemCommon: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        };
        Problem400: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 400;
            /** @constant */
            code: "VALIDATION_FAILED";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "VALIDATION";
                violations: {
                    field: string;
                    code: string;
                    message: string;
                }[];
            };
        };
        Problem401: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 401;
            /** @constant */
            code: "AUTHENTICATION_REQUIRED";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 401;
            /** @constant */
            code: "SESSION_EXPIRED";
            /** @constant */
            retryable: false;
        });
        Problem403: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 403;
            /** @constant */
            code: "PERMISSION_DENIED";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 403;
            /** @constant */
            code: "CSRF_FAILED";
            /** @constant */
            retryable: true;
            meta: {
                /** @constant */
                kind: "CSRF";
                /** @constant */
                refreshHref: "/api/v2/auth/csrf";
            };
        });
        Problem404: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 404;
            /** @constant */
            code: "RESOURCE_NOT_FOUND";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 404;
            /** @constant */
            code: "COMMAND_NOT_FOUND";
            /** @constant */
            retryable: false;
        });
        Problem409: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "STATE_CONFLICT";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "STATE_CONFLICT";
                /** @enum {string} */
                resourceType: "SKU" | "FILE" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                currentState: string;
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "VERSION_CONFLICT";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "VERSION_CONFLICT";
                currentVersion: number;
                currentEtag: string;
                resourceHref: string;
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "IDEMPOTENCY_KEY_REUSED";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "IDEMPOTENCY";
                operationId: string;
                /** @constant */
                commandStatusHref: "/api/v2/commands/status";
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "FILE_NOT_READY";
            /** @constant */
            retryable: true;
            meta: {
                /** @constant */
                kind: "FILE_NOT_READY";
                /** Format: uuid */
                fileId: string;
                /** @enum {string} */
                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                statusHref: string;
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "DUPLICATE_BUSINESS_KEY";
            /** @constant */
            retryable: false;
        });
        Problem428: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 428;
            /** @constant */
            code: "PRECONDITION_REQUIRED";
            /** @constant */
            retryable: false;
        };
        Problem429: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 429;
            /** @constant */
            code: "RATE_LIMITED";
            /** @constant */
            retryable: true;
        };
        Problem500: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 500;
            /** @constant */
            code: "INTERNAL_ERROR";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 500;
            /** @constant */
            code: "INTERNAL_ERROR";
            /** @constant */
            retryable: true;
        });
        ProblemInternalTerminal: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 500;
            /** @constant */
            code: "INTERNAL_ERROR";
            /** @constant */
            retryable: false;
        };
        ProblemInternalRecoverable: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 500;
            /** @constant */
            code: "INTERNAL_ERROR";
            /** @constant */
            retryable: true;
        };
        Problem502: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 502;
            /** @constant */
            code: "DEPENDENCY_FAILURE";
            /** @constant */
            retryable: true;
        };
        Problem503: {
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 503;
            /** @constant */
            code: "DEPENDENCY_UNAVAILABLE";
            /** @constant */
            retryable: true;
        };
        ProblemTerminal: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 400;
            /** @constant */
            code: "VALIDATION_FAILED";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "VALIDATION";
                violations: {
                    field: string;
                    code: string;
                    message: string;
                }[];
            };
        }) | (({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 401;
            /** @constant */
            code: "AUTHENTICATION_REQUIRED";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 401;
            /** @constant */
            code: "SESSION_EXPIRED";
            /** @constant */
            retryable: false;
        })) | (({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 403;
            /** @constant */
            code: "PERMISSION_DENIED";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 403;
            /** @constant */
            code: "CSRF_FAILED";
            /** @constant */
            retryable: true;
            meta: {
                /** @constant */
                kind: "CSRF";
                /** @constant */
                refreshHref: "/api/v2/auth/csrf";
            };
        })) | (({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 404;
            /** @constant */
            code: "RESOURCE_NOT_FOUND";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 404;
            /** @constant */
            code: "COMMAND_NOT_FOUND";
            /** @constant */
            retryable: false;
        })) | (({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "STATE_CONFLICT";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "STATE_CONFLICT";
                /** @enum {string} */
                resourceType: "SKU" | "FILE" | "ORDER";
                /** Format: uuid */
                resourceId: string;
                currentState: string;
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "VERSION_CONFLICT";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "VERSION_CONFLICT";
                currentVersion: number;
                currentEtag: string;
                resourceHref: string;
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "IDEMPOTENCY_KEY_REUSED";
            /** @constant */
            retryable: false;
            meta: {
                /** @constant */
                kind: "IDEMPOTENCY";
                operationId: string;
                /** @constant */
                commandStatusHref: "/api/v2/commands/status";
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "FILE_NOT_READY";
            /** @constant */
            retryable: true;
            meta: {
                /** @constant */
                kind: "FILE_NOT_READY";
                /** Format: uuid */
                fileId: string;
                /** @enum {string} */
                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                statusHref: string;
            };
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 409;
            /** @constant */
            code: "DUPLICATE_BUSINESS_KEY";
            /** @constant */
            retryable: false;
        })) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 428;
            /** @constant */
            code: "PRECONDITION_REQUIRED";
            /** @constant */
            retryable: false;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 429;
            /** @constant */
            code: "RATE_LIMITED";
            /** @constant */
            retryable: true;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 500;
            /** @constant */
            code: "INTERNAL_ERROR";
            /** @constant */
            retryable: false;
        });
        ProblemRecoverable: ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 500;
            /** @constant */
            code: "INTERNAL_ERROR";
            /** @constant */
            retryable: true;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 502;
            /** @constant */
            code: "DEPENDENCY_FAILURE";
            /** @constant */
            retryable: true;
        }) | ({
            type: string;
            title: string;
            status: number;
            detail?: string;
            instance?: string;
            code: string;
            /** Format: uuid */
            requestId: string;
            retryable: boolean;
        } & {
            /** @constant */
            status: 503;
            /** @constant */
            code: "DEPENDENCY_UNAVAILABLE";
            /** @constant */
            retryable: true;
        });
    };
    responses: {
        /** @description CSRF token */
        CsrfToken: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    csrfToken: string;
                    /** Format: date-time */
                    expiresAt: string;
                };
            };
        };
        /** @description Current session */
        Session: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    userId: string;
                    /** Format: uuid */
                    organizationId: string;
                    /** Format: date-time */
                    expiresAt: string;
                };
            };
        };
        /** @description Product page */
        ProductPage: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    data: {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        productCode: string;
                        name: string;
                        unit: string;
                        description?: string;
                        categoryId?: string | null;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        metadata?: {
                            [key: string]: unknown;
                        };
                    }[];
                    page: {
                        nextCursor: string | null;
                        hasNext: boolean;
                    };
                };
            };
        };
        /** @description SKU page */
        SkuPage: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    data: {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        productId: string;
                        skuCode: string;
                        name: string;
                        unit: string;
                        baseUnit: string;
                        /** @enum {string} */
                        trackingMode: "NONE" | "LOT" | "SERIAL";
                        standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                        /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                        lowStockThreshold: string;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        pricePolicies: {
                            /** Format: uuid */
                            policyId: string;
                            version: number;
                            /** @enum {string} */
                            lifecycle: "ACTIVE" | "ENDED";
                            currency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            unitPrice: string;
                            /** Format: date-time */
                            validFrom: string;
                            validTo: string | null;
                            isPrimary: boolean;
                            riskBufferBps: number;
                        }[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    }[];
                    page: {
                        nextCursor: string | null;
                        hasNext: boolean;
                    };
                };
            };
        };
        /** @description Order page */
        OrderPage: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    data: ({
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        customerId: string;
                        orderNo: string;
                        currency: string;
                        /** @enum {string} */
                        status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                        /** @enum {string} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        lines: ({
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "STANDARD";
                            /** Format: uuid */
                            skuId: string;
                            /** @enum {string} */
                            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "CATALOG_POLICY";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null | {
                                baseCurrency: string;
                                quoteCurrency: string;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                rawMarketRate: string;
                                riskBufferBps: number;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                effectiveRate: string;
                                source: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            imageFileId: string | null;
                        } | {
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "NON_STANDARD";
                            /** @enum {string} */
                            standardizationMode: "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "MANUAL_QUOTE";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null;
                            imageFileId: string | null;
                        })[];
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        totalAmount: string;
                        allowedTransitions: ({
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "ADVANCE";
                            /** @enum {string} */
                            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        } | {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "CANCEL";
                        })[];
                        capabilities: ("order.update" | "order.transition")[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    } & ({
                        /** @constant */
                        status: "DRAFT";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                    } | {
                        /** @constant */
                        status: "CONFIRMED";
                        /** @enum {unknown} */
                        stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    } | {
                        /** @constant */
                        status: "FULFILLED";
                        /** @constant */
                        stage: "CLOSED";
                    } | {
                        /** @constant */
                        status: "CANCELLED";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    }))[];
                    page: {
                        nextCursor: string | null;
                        hasNext: boolean;
                    };
                };
            };
        };
        /** @description Product read */
        Product: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    productCode: string;
                    name: string;
                    unit: string;
                    description?: string;
                    categoryId?: string | null;
                    /** @enum {string} */
                    status: "ACTIVE" | "INACTIVE";
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description Updated product */
        ProductUpdated: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    productCode: string;
                    name: string;
                    unit: string;
                    description?: string;
                    categoryId?: string | null;
                    /** @enum {string} */
                    status: "ACTIVE" | "INACTIVE";
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description Created product */
        ProductCreated: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                Location: string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    productCode: string;
                    name: string;
                    unit: string;
                    description?: string;
                    categoryId?: string | null;
                    /** @enum {string} */
                    status: "ACTIVE" | "INACTIVE";
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description SKU read */
        Sku: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    /** Format: uuid */
                    productId: string;
                    skuCode: string;
                    name: string;
                    unit: string;
                    baseUnit: string;
                    /** @enum {string} */
                    trackingMode: "NONE" | "LOT" | "SERIAL";
                    standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                    /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                    lowStockThreshold: string;
                    /** @enum {string} */
                    status: "ACTIVE" | "INACTIVE";
                    pricePolicies: {
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        /** @enum {string} */
                        lifecycle: "ACTIVE" | "ENDED";
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    }[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description Updated SKU */
        SkuUpdated: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    /** Format: uuid */
                    productId: string;
                    skuCode: string;
                    name: string;
                    unit: string;
                    baseUnit: string;
                    /** @enum {string} */
                    trackingMode: "NONE" | "LOT" | "SERIAL";
                    standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                    /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                    lowStockThreshold: string;
                    /** @enum {string} */
                    status: "ACTIVE" | "INACTIVE";
                    pricePolicies: {
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        /** @enum {string} */
                        lifecycle: "ACTIVE" | "ENDED";
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    }[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description Created SKU */
        SkuCreated: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                Location: string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    /** Format: uuid */
                    productId: string;
                    skuCode: string;
                    name: string;
                    unit: string;
                    baseUnit: string;
                    /** @enum {string} */
                    trackingMode: "NONE" | "LOT" | "SERIAL";
                    standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                    /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                    lowStockThreshold: string;
                    /** @enum {string} */
                    status: "ACTIVE" | "INACTIVE";
                    pricePolicies: {
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        /** @enum {string} */
                        lifecycle: "ACTIVE" | "ENDED";
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    }[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description Order read */
        Order: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    /** Format: uuid */
                    customerId: string;
                    orderNo: string;
                    currency: string;
                    /** @enum {string} */
                    status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                    /** @enum {string} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    lines: ({
                        /** Format: uuid */
                        lineId: string;
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        /** Format: uuid */
                        skuId: string;
                        /** @enum {string} */
                        standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        effectiveUnitPrice: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        lineAmount: string;
                        currency: string;
                        priceSnapshot: {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            sourceKind: "CATALOG_POLICY";
                            sourceCurrency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            sourceUnitPrice: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        fxSnapshot: null | {
                            baseCurrency: string;
                            quoteCurrency: string;
                            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                            rawMarketRate: string;
                            riskBufferBps: number;
                            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                            effectiveRate: string;
                            source: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        imageFileId: string | null;
                    } | {
                        /** Format: uuid */
                        lineId: string;
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        effectiveUnitPrice: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        lineAmount: string;
                        currency: string;
                        priceSnapshot: {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            sourceKind: "MANUAL_QUOTE";
                            sourceCurrency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            sourceUnitPrice: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        fxSnapshot: null;
                        imageFileId: string | null;
                    })[];
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    totalAmount: string;
                    allowedTransitions: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "ADVANCE";
                        /** @enum {string} */
                        toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "CANCEL";
                    })[];
                    capabilities: ("order.update" | "order.transition")[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                } & ({
                    /** @constant */
                    status: "DRAFT";
                    /** @enum {unknown} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                } | {
                    /** @constant */
                    status: "CONFIRMED";
                    /** @enum {unknown} */
                    stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                } | {
                    /** @constant */
                    status: "FULFILLED";
                    /** @constant */
                    stage: "CLOSED";
                } | {
                    /** @constant */
                    status: "CANCELLED";
                    /** @enum {unknown} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                });
            };
        };
        /** @description Updated order */
        OrderUpdated: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    /** Format: uuid */
                    customerId: string;
                    orderNo: string;
                    currency: string;
                    /** @enum {string} */
                    status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                    /** @enum {string} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    lines: ({
                        /** Format: uuid */
                        lineId: string;
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        /** Format: uuid */
                        skuId: string;
                        /** @enum {string} */
                        standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        effectiveUnitPrice: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        lineAmount: string;
                        currency: string;
                        priceSnapshot: {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            sourceKind: "CATALOG_POLICY";
                            sourceCurrency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            sourceUnitPrice: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        fxSnapshot: null | {
                            baseCurrency: string;
                            quoteCurrency: string;
                            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                            rawMarketRate: string;
                            riskBufferBps: number;
                            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                            effectiveRate: string;
                            source: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        imageFileId: string | null;
                    } | {
                        /** Format: uuid */
                        lineId: string;
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        effectiveUnitPrice: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        lineAmount: string;
                        currency: string;
                        priceSnapshot: {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            sourceKind: "MANUAL_QUOTE";
                            sourceCurrency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            sourceUnitPrice: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        fxSnapshot: null;
                        imageFileId: string | null;
                    })[];
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    totalAmount: string;
                    allowedTransitions: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "ADVANCE";
                        /** @enum {string} */
                        toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "CANCEL";
                    })[];
                    capabilities: ("order.update" | "order.transition")[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                } & ({
                    /** @constant */
                    status: "DRAFT";
                    /** @enum {unknown} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                } | {
                    /** @constant */
                    status: "CONFIRMED";
                    /** @enum {unknown} */
                    stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                } | {
                    /** @constant */
                    status: "FULFILLED";
                    /** @constant */
                    stage: "CLOSED";
                } | {
                    /** @constant */
                    status: "CANCELLED";
                    /** @enum {unknown} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                });
            };
        };
        /** @description Created order */
        OrderCreated: {
            headers: {
                "X-Request-ID": string;
                ETag: string;
                Location: string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    /** Format: uuid */
                    organizationId: string;
                    version: number;
                    /** Format: date-time */
                    createdAt: string;
                    /** Format: date-time */
                    updatedAt: string;
                    /** Format: uuid */
                    customerId: string;
                    orderNo: string;
                    currency: string;
                    /** @enum {string} */
                    status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                    /** @enum {string} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    lines: ({
                        /** Format: uuid */
                        lineId: string;
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        /** Format: uuid */
                        skuId: string;
                        /** @enum {string} */
                        standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        effectiveUnitPrice: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        lineAmount: string;
                        currency: string;
                        priceSnapshot: {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            sourceKind: "CATALOG_POLICY";
                            sourceCurrency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            sourceUnitPrice: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        fxSnapshot: null | {
                            baseCurrency: string;
                            quoteCurrency: string;
                            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                            rawMarketRate: string;
                            riskBufferBps: number;
                            /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                            effectiveRate: string;
                            source: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        imageFileId: string | null;
                    } | {
                        /** Format: uuid */
                        lineId: string;
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        effectiveUnitPrice: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        lineAmount: string;
                        currency: string;
                        priceSnapshot: {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            sourceKind: "MANUAL_QUOTE";
                            sourceCurrency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            sourceUnitPrice: string;
                            /** Format: date-time */
                            capturedAt: string;
                        };
                        fxSnapshot: null;
                        imageFileId: string | null;
                    })[];
                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                    totalAmount: string;
                    allowedTransitions: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "ADVANCE";
                        /** @enum {string} */
                        toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "CANCEL";
                    })[];
                    capabilities: ("order.update" | "order.transition")[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                } & ({
                    /** @constant */
                    status: "DRAFT";
                    /** @enum {unknown} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                } | {
                    /** @constant */
                    status: "CONFIRMED";
                    /** @enum {unknown} */
                    stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                } | {
                    /** @constant */
                    status: "FULFILLED";
                    /** @constant */
                    stage: "CLOSED";
                } | {
                    /** @constant */
                    status: "CANCELLED";
                    /** @enum {unknown} */
                    stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                });
            };
        };
        /** @description Files-owned file status */
        FileStatus: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    id: string;
                    version: number;
                    /** @enum {string} */
                    status: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "AVAILABLE" | "REJECTED" | "QUARANTINED";
                    /** Format: date-time */
                    updatedAt: string;
                    href: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        /** @description Short-lived Files-owned download intent */
        FileDownloadIntent: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    file: {
                        /** Format: uuid */
                        id: string;
                        version: number;
                        /** @constant */
                        status: "AVAILABLE";
                        /** Format: date-time */
                        updatedAt: string;
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                    href: string;
                    transfer: {
                        /** @constant */
                        kind: "HTTP_GET";
                        /** @constant */
                        method: "GET";
                        /** Format: uri */
                        locator: string;
                        /** Format: date-time */
                        expiresAt: string;
                        headers: {
                            [key: string]: string;
                        };
                    };
                };
            };
        };
        /** @description Command status; Content-Location is required and Retry-After is required for IN_PROGRESS or RECOVERY_REQUIRED body state */
        CommandStatus: {
            headers: {
                "X-Request-ID": string;
                "Content-Location": "/api/v2/commands/status";
                "Cache-Control": "no-store";
                "Retry-After": string;
                [name: string]: unknown;
            };
            content: {
                "application/json": ({
                    /** Format: uuid */
                    commandId: string;
                    operationId: string;
                    /** @enum {string} */
                    state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                    /** Format: date-time */
                    startedAt: string;
                    /** Format: date-time */
                    expiresAt: string;
                    retryAfterMs: number;
                    completedAt: string | null;
                    httpStatus: number | null;
                    resource: {
                        /** @enum {string} */
                        resourceType: "PRODUCT" | "SKU" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        href: string;
                    } | null;
                    resultHref: string | null;
                    problem: (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    }) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    })) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    })) | null;
                } & {
                    /** @constant */
                    state: "IN_PROGRESS";
                    retryAfterMs: number;
                    completedAt: null;
                    httpStatus: null;
                    resource: null;
                    resultHref: null;
                    problem: null;
                }) | ({
                    /** Format: uuid */
                    commandId: string;
                    operationId: string;
                    /** @enum {string} */
                    state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                    /** Format: date-time */
                    startedAt: string;
                    /** Format: date-time */
                    expiresAt: string;
                    retryAfterMs: number;
                    completedAt: string | null;
                    httpStatus: number | null;
                    resource: {
                        /** @enum {string} */
                        resourceType: "PRODUCT" | "SKU" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        href: string;
                    } | null;
                    resultHref: string | null;
                    problem: (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    }) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    })) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    })) | null;
                } & {
                    /** @constant */
                    state: "SUCCEEDED";
                    /** @constant */
                    retryAfterMs?: 0;
                    /** Format: date-time */
                    completedAt: string;
                    httpStatus: number;
                    resource: {
                        /** @enum {string} */
                        resourceType: "PRODUCT" | "SKU" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        href: string;
                    };
                    resultHref: string | null;
                    problem: null;
                }) | ({
                    /** Format: uuid */
                    commandId: string;
                    operationId: string;
                    /** @enum {string} */
                    state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                    /** Format: date-time */
                    startedAt: string;
                    /** Format: date-time */
                    expiresAt: string;
                    retryAfterMs: number;
                    completedAt: string | null;
                    httpStatus: number | null;
                    resource: {
                        /** @enum {string} */
                        resourceType: "PRODUCT" | "SKU" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        href: string;
                    } | null;
                    resultHref: string | null;
                    problem: (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    }) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    })) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    })) | null;
                } & {
                    /** @constant */
                    state: "FAILED";
                    /** @constant */
                    retryAfterMs?: 0;
                    /** Format: date-time */
                    completedAt: string;
                    resource: null;
                    resultHref: null;
                } & ({
                    /** @constant */
                    httpStatus: 400;
                    problem: {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                } | {
                    /** @constant */
                    httpStatus: 401;
                    problem: ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                } | {
                    /** @constant */
                    httpStatus: 403;
                    problem: ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                } | {
                    /** @constant */
                    httpStatus: 404;
                    problem: ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                } | {
                    /** @constant */
                    httpStatus: 409;
                    problem: ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                } | {
                    /** @constant */
                    httpStatus: 428;
                    problem: {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                } | {
                    /** @constant */
                    httpStatus: 429;
                    problem: {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                } | {
                    /** @constant */
                    httpStatus: 500;
                    problem: {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    };
                })) | ({
                    /** Format: uuid */
                    commandId: string;
                    operationId: string;
                    /** @enum {string} */
                    state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                    /** Format: date-time */
                    startedAt: string;
                    /** Format: date-time */
                    expiresAt: string;
                    retryAfterMs: number;
                    completedAt: string | null;
                    httpStatus: number | null;
                    resource: {
                        /** @enum {string} */
                        resourceType: "PRODUCT" | "SKU" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        href: string;
                    } | null;
                    resultHref: string | null;
                    problem: (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    }) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    })) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    })) | null;
                } & {
                    /** @constant */
                    state: "RECOVERY_REQUIRED";
                    /** @constant */
                    retryAfterMs: 0;
                    completedAt: null;
                    httpStatus: null;
                    resource: null;
                    resultHref: null;
                    problem: null;
                });
            };
        };
        /** @description Command accepted */
        CommandStatusInProgress: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Content-Location": "/api/v2/commands/status";
                "Retry-After": string;
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** Format: uuid */
                    commandId: string;
                    operationId: string;
                    /** @enum {string} */
                    state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                    /** Format: date-time */
                    startedAt: string;
                    /** Format: date-time */
                    expiresAt: string;
                    retryAfterMs: number;
                    completedAt: string | null;
                    httpStatus: number | null;
                    resource: {
                        /** @enum {string} */
                        resourceType: "PRODUCT" | "SKU" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        href: string;
                    } | null;
                    resultHref: string | null;
                    problem: (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    }) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    })) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    })) | (({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    })) | null;
                } & {
                    /** @constant */
                    state: "IN_PROGRESS";
                    retryAfterMs: number;
                    completedAt: null;
                    httpStatus: null;
                    resource: null;
                    resultHref: null;
                    problem: null;
                };
            };
        };
        /** @description Validation problem */
        Problem400: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 400;
                    /** @constant */
                    code: "VALIDATION_FAILED";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "VALIDATION";
                        violations: {
                            field: string;
                            code: string;
                            message: string;
                        }[];
                    };
                };
            };
        };
        /** @description Authentication problem */
        Problem401: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 401;
                    /** @constant */
                    code: "AUTHENTICATION_REQUIRED";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 401;
                    /** @constant */
                    code: "SESSION_EXPIRED";
                    /** @constant */
                    retryable: false;
                });
            };
        };
        /** @description Authorization or CSRF problem */
        Problem403: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 403;
                    /** @constant */
                    code: "PERMISSION_DENIED";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 403;
                    /** @constant */
                    code: "CSRF_FAILED";
                    /** @constant */
                    retryable: true;
                    meta: {
                        /** @constant */
                        kind: "CSRF";
                        /** @constant */
                        refreshHref: "/api/v2/auth/csrf";
                    };
                });
            };
        };
        /** @description Hidden resource problem */
        Problem404: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 404;
                    /** @constant */
                    code: "RESOURCE_NOT_FOUND";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 404;
                    /** @constant */
                    code: "COMMAND_NOT_FOUND";
                    /** @constant */
                    retryable: false;
                });
            };
        };
        /** @description Conflict problem */
        Problem409: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "STATE_CONFLICT";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "STATE_CONFLICT";
                        /** @enum {string} */
                        resourceType: "SKU" | "FILE" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        currentState: string;
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "VERSION_CONFLICT";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "VERSION_CONFLICT";
                        currentVersion: number;
                        currentEtag: string;
                        resourceHref: string;
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "IDEMPOTENCY_KEY_REUSED";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "IDEMPOTENCY";
                        operationId: string;
                        /** @constant */
                        commandStatusHref: "/api/v2/commands/status";
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "FILE_NOT_READY";
                    /** @constant */
                    retryable: true;
                    meta: {
                        /** @constant */
                        kind: "FILE_NOT_READY";
                        /** Format: uuid */
                        fileId: string;
                        /** @enum {string} */
                        state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                        statusHref: string;
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "DUPLICATE_BUSINESS_KEY";
                    /** @constant */
                    retryable: false;
                });
            };
        };
        /** @description Missing required precondition */
        Problem428: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 428;
                    /** @constant */
                    code: "PRECONDITION_REQUIRED";
                    /** @constant */
                    retryable: false;
                };
            };
        };
        /** @description Rate limit problem; read and idempotency-exempt responses never replay */
        Problem429: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Retry-After": string;
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 429;
                    /** @constant */
                    code: "RATE_LIMITED";
                    /** @constant */
                    retryable: true;
                };
            };
        };
        /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
        Problem429Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Retry-After": string;
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 429;
                    /** @constant */
                    code: "RATE_LIMITED";
                    /** @constant */
                    retryable: true;
                };
            };
        };
        /** @description Internal problem for read/exempt operations; recoverable branches never replay */
        Problem500: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 500;
                    /** @constant */
                    code: "INTERNAL_ERROR";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 500;
                    /** @constant */
                    code: "INTERNAL_ERROR";
                    /** @constant */
                    retryable: true;
                });
            };
        };
        /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
        Problem500Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 500;
                    /** @constant */
                    code: "INTERNAL_ERROR";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 500;
                    /** @constant */
                    code: "INTERNAL_ERROR";
                    /** @constant */
                    retryable: true;
                });
            };
        };
        /** @description Recoverable dependency failure */
        Problem502: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 502;
                    /** @constant */
                    code: "DEPENDENCY_FAILURE";
                    /** @constant */
                    retryable: true;
                };
            };
        };
        /** @description Recoverable dependency unavailable */
        Problem503: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 503;
                    /** @constant */
                    code: "DEPENDENCY_UNAVAILABLE";
                    /** @constant */
                    retryable: true;
                };
            };
        };
        /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
        Problem400Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 400;
                    /** @constant */
                    code: "VALIDATION_FAILED";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "VALIDATION";
                        violations: {
                            field: string;
                            code: string;
                            message: string;
                        }[];
                    };
                };
            };
        };
        /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
        Problem401Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 401;
                    /** @constant */
                    code: "AUTHENTICATION_REQUIRED";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 401;
                    /** @constant */
                    code: "SESSION_EXPIRED";
                    /** @constant */
                    retryable: false;
                });
            };
        };
        /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
        Problem403Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 403;
                    /** @constant */
                    code: "PERMISSION_DENIED";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 403;
                    /** @constant */
                    code: "CSRF_FAILED";
                    /** @constant */
                    retryable: true;
                    meta: {
                        /** @constant */
                        kind: "CSRF";
                        /** @constant */
                        refreshHref: "/api/v2/auth/csrf";
                    };
                });
            };
        };
        /** @description Terminal mutation hidden-resource problem; Idempotent-Replay is emitted only on a replay */
        Problem404Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 404;
                    /** @constant */
                    code: "RESOURCE_NOT_FOUND";
                    /** @constant */
                    retryable: false;
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 404;
                    /** @constant */
                    code: "COMMAND_NOT_FOUND";
                    /** @constant */
                    retryable: false;
                });
            };
        };
        /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
        Problem409Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "STATE_CONFLICT";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "STATE_CONFLICT";
                        /** @enum {string} */
                        resourceType: "SKU" | "FILE" | "ORDER";
                        /** Format: uuid */
                        resourceId: string;
                        currentState: string;
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "VERSION_CONFLICT";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "VERSION_CONFLICT";
                        currentVersion: number;
                        currentEtag: string;
                        resourceHref: string;
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "IDEMPOTENCY_KEY_REUSED";
                    /** @constant */
                    retryable: false;
                    meta: {
                        /** @constant */
                        kind: "IDEMPOTENCY";
                        operationId: string;
                        /** @constant */
                        commandStatusHref: "/api/v2/commands/status";
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "FILE_NOT_READY";
                    /** @constant */
                    retryable: true;
                    meta: {
                        /** @constant */
                        kind: "FILE_NOT_READY";
                        /** Format: uuid */
                        fileId: string;
                        /** @enum {string} */
                        state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                        statusHref: string;
                    };
                }) | ({
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 409;
                    /** @constant */
                    code: "DUPLICATE_BUSINESS_KEY";
                    /** @constant */
                    retryable: false;
                });
            };
        };
        /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
        Problem428Mutation: {
            headers: {
                "X-Request-ID": string;
                "Cache-Control": "no-store";
                "Idempotent-Replay"?: "true";
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": {
                    type: string;
                    title: string;
                    status: number;
                    detail?: string;
                    instance?: string;
                    code: string;
                    /** Format: uuid */
                    requestId: string;
                    retryable: boolean;
                } & {
                    /** @constant */
                    status: 428;
                    /** @constant */
                    code: "PRECONDITION_REQUIRED";
                    /** @constant */
                    retryable: false;
                };
            };
        };
    };
    parameters: {
        ResourceId: string;
        OrderId: string;
        FileId: string;
        CsrfHeader: string;
        IdempotencyHeader: string;
        IfMatchHeader: string;
        RequestIdHeader: string;
        CommandOperationHeader: string;
        PageAfter: string;
        PageSize: number;
        ProductSort: "name" | "-name" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
        SkuSort: "skuCode" | "-skuCode" | "name" | "-name" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
        OrderSort: "orderNo" | "-orderNo" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
        ProductStatusFilter: "ACTIVE" | "INACTIVE";
        SkuStatusFilter: "ACTIVE" | "INACTIVE";
        OrderStatusFilter: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
    };
    requestBodies: {
        ProductCreateRequestV2: {
            content: {
                "application/json": {
                    name: string;
                    productCode: string;
                    unit: string;
                    description?: string;
                    /** Format: uuid */
                    categoryId?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        ProductUpdateRequestV2: {
            content: {
                "application/json": {
                    name?: string;
                    unit?: string;
                    description?: string;
                    /** Format: uuid */
                    categoryId?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        SkuCreateRequestV2: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    productId: string;
                    skuCode: string;
                    name: string;
                    unit: string;
                    /** @description Optional; defaults to unit when omitted. */
                    baseUnit?: string;
                    /**
                     * @description Optional; defaults to NONE when omitted.
                     * @enum {string}
                     */
                    trackingMode?: "NONE" | "LOT" | "SERIAL";
                    /**
                     * @description Required policy; no default and never inferred from trackingMode.
                     * @enum {string}
                     */
                    standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                    /** @description Optional; defaults to DecimalString 0 when omitted. */
                    lowStockThreshold?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        SkuUpdateRequestV2: {
            content: {
                "application/json": {
                    name?: string;
                    unit?: string;
                    baseUnit?: string;
                    /** @enum {string} */
                    trackingMode?: "NONE" | "LOT" | "SERIAL";
                    /** @enum {string} */
                    standardizationMode?: "STRICT" | "SIMPLE" | "NONE";
                    /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                    lowStockThreshold?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                    pricePolicy?: {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "CREATE";
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "REPLACE";
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "END";
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        /** Format: date-time */
                        validTo: string;
                    };
                };
            };
        };
        OrderCreateRequestV2: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    customerId: string;
                    orderNo: string;
                    currency: string;
                    lines: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        /** Format: uuid */
                        skuId: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** Format: uuid */
                        imageFileId?: string;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        quotedUnitPrice: string;
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        /** Format: uuid */
                        imageFileId?: string;
                    })[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        OrderUpdateRequestV2: {
            content: {
                "application/json": {
                    metadata?: {
                        [key: string]: unknown;
                    };
                    lines?: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        lineId: string | null;
                        /** Format: uuid */
                        skuId: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        imageFileId: string | null;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        lineId: string | null;
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        quotedUnitPrice: string;
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        imageFileId: string | null;
                    })[];
                };
            };
        };
        OrderTransitionRequestV2: {
            content: {
                "application/json": {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    action: "ADVANCE";
                    /** @enum {string} */
                    toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    reason?: string;
                } | {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    action: "CANCEL";
                    reason?: string;
                };
            };
        };
    };
    headers: {
        RequestId: string;
        ETag: string;
        Location: string;
        ContentLocation: string;
        CommandStatusContentLocation: "/api/v2/commands/status";
        CacheControl: "no-store";
        IdempotentReplay: "true";
        RetryAfter: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getCsrfTokenV2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description CSRF token */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        csrfToken: string;
                        /** Format: date-time */
                        expiresAt: string;
                    };
                };
            };
            /** @description Validation problem */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    getCurrentSessionV2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current session */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        userId: string;
                        /** Format: uuid */
                        organizationId: string;
                        /** Format: date-time */
                        expiresAt: string;
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    getCommandStatusV2: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
                "X-Command-Operation": string;
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Command status; Content-Location is required and Retry-After is required for IN_PROGRESS or RECOVERY_REQUIRED body state */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Content-Location": "/api/v2/commands/status";
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": ({
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    }) | ({
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "SUCCEEDED";
                        /** @constant */
                        retryAfterMs?: 0;
                        /** Format: date-time */
                        completedAt: string;
                        httpStatus: number;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        };
                        resultHref: string | null;
                        problem: null;
                    }) | ({
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "FAILED";
                        /** @constant */
                        retryAfterMs?: 0;
                        /** Format: date-time */
                        completedAt: string;
                        resource: null;
                        resultHref: null;
                    } & ({
                        /** @constant */
                        httpStatus: 400;
                        problem: {
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        };
                    } | {
                        /** @constant */
                        httpStatus: 401;
                        problem: ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        });
                    } | {
                        /** @constant */
                        httpStatus: 403;
                        problem: ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        });
                    } | {
                        /** @constant */
                        httpStatus: 404;
                        problem: ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        });
                    } | {
                        /** @constant */
                        httpStatus: 409;
                        problem: ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        });
                    } | {
                        /** @constant */
                        httpStatus: 428;
                        problem: {
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        };
                    } | {
                        /** @constant */
                        httpStatus: 429;
                        problem: {
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        };
                    } | {
                        /** @constant */
                        httpStatus: 500;
                        problem: {
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        };
                    })) | ({
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "RECOVERY_REQUIRED";
                        /** @constant */
                        retryAfterMs: 0;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    });
                };
            };
            /** @description Validation problem */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Hidden resource problem */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    listProductsV2: {
        parameters: {
            query?: {
                "page[after]"?: string;
                "page[size]"?: number;
                "filter[status]"?: "ACTIVE" | "INACTIVE";
                sort?: "name" | "-name" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
            };
            header?: {
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Product page */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            /** Format: uuid */
                            id: string;
                            /** Format: uuid */
                            organizationId: string;
                            version: number;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: date-time */
                            updatedAt: string;
                            productCode: string;
                            name: string;
                            unit: string;
                            description?: string;
                            categoryId?: string | null;
                            /** @enum {string} */
                            status: "ACTIVE" | "INACTIVE";
                            metadata?: {
                                [key: string]: unknown;
                            };
                        }[];
                        page: {
                            nextCursor: string | null;
                            hasNext: boolean;
                        };
                    };
                };
            };
            /** @description Validation problem */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    createProductV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    productCode: string;
                    unit: string;
                    description?: string;
                    /** Format: uuid */
                    categoryId?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Created product */
            201: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    Location: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        productCode: string;
                        name: string;
                        unit: string;
                        description?: string;
                        categoryId?: string | null;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    getProductV2: {
        parameters: {
            query?: never;
            header?: {
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Product read */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        productCode: string;
                        name: string;
                        unit: string;
                        description?: string;
                        categoryId?: string | null;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Hidden resource problem */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    updateProductV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "If-Match": string;
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    unit?: string;
                    description?: string;
                    /** Format: uuid */
                    categoryId?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Updated product */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        productCode: string;
                        name: string;
                        unit: string;
                        description?: string;
                        categoryId?: string | null;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation hidden-resource problem; Idempotent-Replay is emitted only on a replay */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    listSkusV2: {
        parameters: {
            query?: {
                "page[after]"?: string;
                "page[size]"?: number;
                "filter[status]"?: "ACTIVE" | "INACTIVE";
                sort?: "skuCode" | "-skuCode" | "name" | "-name" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
            };
            header?: {
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description SKU page */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            /** Format: uuid */
                            id: string;
                            /** Format: uuid */
                            organizationId: string;
                            version: number;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: date-time */
                            updatedAt: string;
                            /** Format: uuid */
                            productId: string;
                            skuCode: string;
                            name: string;
                            unit: string;
                            baseUnit: string;
                            /** @enum {string} */
                            trackingMode: "NONE" | "LOT" | "SERIAL";
                            standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                            /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                            lowStockThreshold: string;
                            /** @enum {string} */
                            status: "ACTIVE" | "INACTIVE";
                            pricePolicies: {
                                /** Format: uuid */
                                policyId: string;
                                version: number;
                                /** @enum {string} */
                                lifecycle: "ACTIVE" | "ENDED";
                                currency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                unitPrice: string;
                                /** Format: date-time */
                                validFrom: string;
                                validTo: string | null;
                                isPrimary: boolean;
                                riskBufferBps: number;
                            }[];
                            metadata?: {
                                [key: string]: unknown;
                            };
                        }[];
                        page: {
                            nextCursor: string | null;
                            hasNext: boolean;
                        };
                    };
                };
            };
            /** @description Validation problem */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    createSkuV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    productId: string;
                    skuCode: string;
                    name: string;
                    unit: string;
                    /** @description Optional; defaults to unit when omitted. */
                    baseUnit?: string;
                    /**
                     * @description Optional; defaults to NONE when omitted.
                     * @enum {string}
                     */
                    trackingMode?: "NONE" | "LOT" | "SERIAL";
                    /**
                     * @description Required policy; no default and never inferred from trackingMode.
                     * @enum {string}
                     */
                    standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                    /** @description Optional; defaults to DecimalString 0 when omitted. */
                    lowStockThreshold?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Created SKU */
            201: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    Location: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        productId: string;
                        skuCode: string;
                        name: string;
                        unit: string;
                        baseUnit: string;
                        /** @enum {string} */
                        trackingMode: "NONE" | "LOT" | "SERIAL";
                        standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                        /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                        lowStockThreshold: string;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        pricePolicies: {
                            /** Format: uuid */
                            policyId: string;
                            version: number;
                            /** @enum {string} */
                            lifecycle: "ACTIVE" | "ENDED";
                            currency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            unitPrice: string;
                            /** Format: date-time */
                            validFrom: string;
                            validTo: string | null;
                            isPrimary: boolean;
                            riskBufferBps: number;
                        }[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    getSkuV2: {
        parameters: {
            query?: never;
            header?: {
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description SKU read */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        productId: string;
                        skuCode: string;
                        name: string;
                        unit: string;
                        baseUnit: string;
                        /** @enum {string} */
                        trackingMode: "NONE" | "LOT" | "SERIAL";
                        standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                        /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                        lowStockThreshold: string;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        pricePolicies: {
                            /** Format: uuid */
                            policyId: string;
                            version: number;
                            /** @enum {string} */
                            lifecycle: "ACTIVE" | "ENDED";
                            currency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            unitPrice: string;
                            /** Format: date-time */
                            validFrom: string;
                            validTo: string | null;
                            isPrimary: boolean;
                            riskBufferBps: number;
                        }[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Hidden resource problem */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    updateSkuV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "If-Match": string;
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    unit?: string;
                    baseUnit?: string;
                    /** @enum {string} */
                    trackingMode?: "NONE" | "LOT" | "SERIAL";
                    /** @enum {string} */
                    standardizationMode?: "STRICT" | "SIMPLE" | "NONE";
                    /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                    lowStockThreshold?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                    pricePolicy?: {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "CREATE";
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "REPLACE";
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        currency: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        unitPrice: string;
                        /** Format: date-time */
                        validFrom: string;
                        validTo: string | null;
                        isPrimary: boolean;
                        riskBufferBps: number;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        action: "END";
                        /** Format: uuid */
                        policyId: string;
                        version: number;
                        /** Format: date-time */
                        validTo: string;
                    };
                };
            };
        };
        responses: {
            /** @description Updated SKU */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        productId: string;
                        skuCode: string;
                        name: string;
                        unit: string;
                        baseUnit: string;
                        /** @enum {string} */
                        trackingMode: "NONE" | "LOT" | "SERIAL";
                        standardizationMode: ("STRICT" | "SIMPLE" | "NONE") | null;
                        /** @description Non-negative numeric(18,6): at most 12 integer and 6 fractional digits */
                        lowStockThreshold: string;
                        /** @enum {string} */
                        status: "ACTIVE" | "INACTIVE";
                        pricePolicies: {
                            /** Format: uuid */
                            policyId: string;
                            version: number;
                            /** @enum {string} */
                            lifecycle: "ACTIVE" | "ENDED";
                            currency: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            unitPrice: string;
                            /** Format: date-time */
                            validFrom: string;
                            validTo: string | null;
                            isPrimary: boolean;
                            riskBufferBps: number;
                        }[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation hidden-resource problem; Idempotent-Replay is emitted only on a replay */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    listOrdersV2: {
        parameters: {
            query?: {
                "page[after]"?: string;
                "page[size]"?: number;
                "filter[status]"?: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                sort?: "orderNo" | "-orderNo" | "status" | "-status" | "id" | "-id" | "createdAt" | "-createdAt" | "updatedAt" | "-updatedAt" | "-updatedAt,-id";
            };
            header?: {
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Order page */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: ({
                            /** Format: uuid */
                            id: string;
                            /** Format: uuid */
                            organizationId: string;
                            version: number;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: date-time */
                            updatedAt: string;
                            /** Format: uuid */
                            customerId: string;
                            orderNo: string;
                            currency: string;
                            /** @enum {string} */
                            status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                            /** @enum {string} */
                            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                            lines: ({
                                /** Format: uuid */
                                lineId: string;
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                itemKind: "STANDARD";
                                /** Format: uuid */
                                skuId: string;
                                /** @enum {string} */
                                standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                                name: string;
                                unit: string;
                                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                                quantity: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                effectiveUnitPrice: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                lineAmount: string;
                                currency: string;
                                priceSnapshot: {
                                    /**
                                     * @description discriminator enum property added by openapi-typescript
                                     * @enum {string}
                                     */
                                    sourceKind: "CATALOG_POLICY";
                                    sourceCurrency: string;
                                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                    sourceUnitPrice: string;
                                    /** Format: date-time */
                                    capturedAt: string;
                                };
                                fxSnapshot: null | {
                                    baseCurrency: string;
                                    quoteCurrency: string;
                                    /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                    rawMarketRate: string;
                                    riskBufferBps: number;
                                    /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                    effectiveRate: string;
                                    source: string;
                                    /** Format: date-time */
                                    capturedAt: string;
                                };
                                imageFileId: string | null;
                            } | {
                                /** Format: uuid */
                                lineId: string;
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                itemKind: "NON_STANDARD";
                                /** @enum {string} */
                                standardizationMode: "SIMPLE" | "NONE";
                                name: string;
                                unit: string;
                                /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                                quantity: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                effectiveUnitPrice: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                lineAmount: string;
                                currency: string;
                                priceSnapshot: {
                                    /**
                                     * @description discriminator enum property added by openapi-typescript
                                     * @enum {string}
                                     */
                                    sourceKind: "MANUAL_QUOTE";
                                    sourceCurrency: string;
                                    /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                    sourceUnitPrice: string;
                                    /** Format: date-time */
                                    capturedAt: string;
                                };
                                fxSnapshot: null;
                                imageFileId: string | null;
                            })[];
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            totalAmount: string;
                            allowedTransitions: ({
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                action: "ADVANCE";
                                /** @enum {string} */
                                toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                            } | {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                action: "CANCEL";
                            })[];
                            capabilities: ("order.update" | "order.transition")[];
                            metadata?: {
                                [key: string]: unknown;
                            };
                        } & ({
                            /** @constant */
                            status: "DRAFT";
                            /** @enum {unknown} */
                            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                        } | {
                            /** @constant */
                            status: "CONFIRMED";
                            /** @enum {unknown} */
                            stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                        } | {
                            /** @constant */
                            status: "FULFILLED";
                            /** @constant */
                            stage: "CLOSED";
                        } | {
                            /** @constant */
                            status: "CANCELLED";
                            /** @enum {unknown} */
                            stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                        }))[];
                        page: {
                            nextCursor: string | null;
                            hasNext: boolean;
                        };
                    };
                };
            };
            /** @description Validation problem */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    createOrderV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "X-Request-ID"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    customerId: string;
                    orderNo: string;
                    currency: string;
                    lines: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        /** Format: uuid */
                        skuId: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** Format: uuid */
                        imageFileId?: string;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        quotedUnitPrice: string;
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        /** Format: uuid */
                        imageFileId?: string;
                    })[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Created order */
            201: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    Location: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        customerId: string;
                        orderNo: string;
                        currency: string;
                        /** @enum {string} */
                        status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                        /** @enum {string} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        lines: ({
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "STANDARD";
                            /** Format: uuid */
                            skuId: string;
                            /** @enum {string} */
                            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "CATALOG_POLICY";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null | {
                                baseCurrency: string;
                                quoteCurrency: string;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                rawMarketRate: string;
                                riskBufferBps: number;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                effectiveRate: string;
                                source: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            imageFileId: string | null;
                        } | {
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "NON_STANDARD";
                            /** @enum {string} */
                            standardizationMode: "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "MANUAL_QUOTE";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null;
                            imageFileId: string | null;
                        })[];
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        totalAmount: string;
                        allowedTransitions: ({
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "ADVANCE";
                            /** @enum {string} */
                            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        } | {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "CANCEL";
                        })[];
                        capabilities: ("order.update" | "order.transition")[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    } & ({
                        /** @constant */
                        status: "DRAFT";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                    } | {
                        /** @constant */
                        status: "CONFIRMED";
                        /** @enum {unknown} */
                        stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    } | {
                        /** @constant */
                        status: "FULFILLED";
                        /** @constant */
                        stage: "CLOSED";
                    } | {
                        /** @constant */
                        status: "CANCELLED";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    });
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation hidden-resource problem; Idempotent-Replay is emitted only on a replay */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    getOrderV2: {
        parameters: {
            query?: never;
            header?: {
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Order read */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        customerId: string;
                        orderNo: string;
                        currency: string;
                        /** @enum {string} */
                        status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                        /** @enum {string} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        lines: ({
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "STANDARD";
                            /** Format: uuid */
                            skuId: string;
                            /** @enum {string} */
                            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "CATALOG_POLICY";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null | {
                                baseCurrency: string;
                                quoteCurrency: string;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                rawMarketRate: string;
                                riskBufferBps: number;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                effectiveRate: string;
                                source: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            imageFileId: string | null;
                        } | {
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "NON_STANDARD";
                            /** @enum {string} */
                            standardizationMode: "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "MANUAL_QUOTE";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null;
                            imageFileId: string | null;
                        })[];
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        totalAmount: string;
                        allowedTransitions: ({
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "ADVANCE";
                            /** @enum {string} */
                            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        } | {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "CANCEL";
                        })[];
                        capabilities: ("order.update" | "order.transition")[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    } & ({
                        /** @constant */
                        status: "DRAFT";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                    } | {
                        /** @constant */
                        status: "CONFIRMED";
                        /** @enum {unknown} */
                        stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    } | {
                        /** @constant */
                        status: "FULFILLED";
                        /** @constant */
                        stage: "CLOSED";
                    } | {
                        /** @constant */
                        status: "CANCELLED";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    });
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Hidden resource problem */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    updateOrderV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "If-Match": string;
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    metadata?: {
                        [key: string]: unknown;
                    };
                    lines?: ({
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "STANDARD";
                        lineId: string | null;
                        /** Format: uuid */
                        skuId: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        imageFileId: string | null;
                    } | {
                        /**
                         * @description discriminator enum property added by openapi-typescript
                         * @enum {string}
                         */
                        itemKind: "NON_STANDARD";
                        lineId: string | null;
                        name: string;
                        unit: string;
                        /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                        quantity: string;
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        quotedUnitPrice: string;
                        /** @enum {string} */
                        standardizationMode: "SIMPLE" | "NONE";
                        imageFileId: string | null;
                    })[];
                };
            };
        };
        responses: {
            /** @description Updated order */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        customerId: string;
                        orderNo: string;
                        currency: string;
                        /** @enum {string} */
                        status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                        /** @enum {string} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        lines: ({
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "STANDARD";
                            /** Format: uuid */
                            skuId: string;
                            /** @enum {string} */
                            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "CATALOG_POLICY";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null | {
                                baseCurrency: string;
                                quoteCurrency: string;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                rawMarketRate: string;
                                riskBufferBps: number;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                effectiveRate: string;
                                source: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            imageFileId: string | null;
                        } | {
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "NON_STANDARD";
                            /** @enum {string} */
                            standardizationMode: "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "MANUAL_QUOTE";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null;
                            imageFileId: string | null;
                        })[];
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        totalAmount: string;
                        allowedTransitions: ({
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "ADVANCE";
                            /** @enum {string} */
                            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        } | {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "CANCEL";
                        })[];
                        capabilities: ("order.update" | "order.transition")[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    } & ({
                        /** @constant */
                        status: "DRAFT";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                    } | {
                        /** @constant */
                        status: "CONFIRMED";
                        /** @enum {unknown} */
                        stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    } | {
                        /** @constant */
                        status: "FULFILLED";
                        /** @constant */
                        stage: "CLOSED";
                    } | {
                        /** @constant */
                        status: "CANCELLED";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    });
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation hidden-resource problem; Idempotent-Replay is emitted only on a replay */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    transitionOrderV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "Idempotency-Key": string;
                "If-Match": string;
                "X-Request-ID"?: string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    action: "ADVANCE";
                    /** @enum {string} */
                    toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                    reason?: string;
                } | {
                    /**
                     * @description discriminator enum property added by openapi-typescript
                     * @enum {string}
                     */
                    action: "CANCEL";
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Updated order */
            200: {
                headers: {
                    "X-Request-ID": string;
                    ETag: string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        organizationId: string;
                        version: number;
                        /** Format: date-time */
                        createdAt: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        customerId: string;
                        orderNo: string;
                        currency: string;
                        /** @enum {string} */
                        status: "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";
                        /** @enum {string} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        lines: ({
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "STANDARD";
                            /** Format: uuid */
                            skuId: string;
                            /** @enum {string} */
                            standardizationMode: "STRICT" | "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "CATALOG_POLICY";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null | {
                                baseCurrency: string;
                                quoteCurrency: string;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                rawMarketRate: string;
                                riskBufferBps: number;
                                /** @description Positive numeric(24,12): at most 12 integer and 12 fractional digits */
                                effectiveRate: string;
                                source: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            imageFileId: string | null;
                        } | {
                            /** Format: uuid */
                            lineId: string;
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            itemKind: "NON_STANDARD";
                            /** @enum {string} */
                            standardizationMode: "SIMPLE" | "NONE";
                            name: string;
                            unit: string;
                            /** @description Positive numeric(18,6): at most 12 integer and 6 fractional digits */
                            quantity: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            effectiveUnitPrice: string;
                            /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                            lineAmount: string;
                            currency: string;
                            priceSnapshot: {
                                /**
                                 * @description discriminator enum property added by openapi-typescript
                                 * @enum {string}
                                 */
                                sourceKind: "MANUAL_QUOTE";
                                sourceCurrency: string;
                                /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                                sourceUnitPrice: string;
                                /** Format: date-time */
                                capturedAt: string;
                            };
                            fxSnapshot: null;
                            imageFileId: string | null;
                        })[];
                        /** @description Non-negative numeric(19,4): at most 15 integer and 4 fractional digits */
                        totalAmount: string;
                        allowedTransitions: ({
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "ADVANCE";
                            /** @enum {string} */
                            toStage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED" | "CLOSED";
                        } | {
                            /**
                             * @description discriminator enum property added by openapi-typescript
                             * @enum {string}
                             */
                            action: "CANCEL";
                        })[];
                        capabilities: ("order.update" | "order.transition")[];
                        metadata?: {
                            [key: string]: unknown;
                        };
                    } & ({
                        /** @constant */
                        status: "DRAFT";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP";
                    } | {
                        /** @constant */
                        status: "CONFIRMED";
                        /** @enum {unknown} */
                        stage: "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    } | {
                        /** @constant */
                        status: "FULFILLED";
                        /** @constant */
                        stage: "CLOSED";
                    } | {
                        /** @constant */
                        status: "CANCELLED";
                        /** @enum {unknown} */
                        stage: "INITIAL_CONTACT" | "QUOTING" | "QUOTE_FOLLOW_UP" | "DEPOSIT_PENDING" | "DEPOSIT_CONFIRMED" | "FULFILLMENT" | "FOB_COMPLETED";
                    });
                };
            };
            /** @description Command accepted */
            202: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Content-Location": "/api/v2/commands/status";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        commandId: string;
                        operationId: string;
                        /** @enum {string} */
                        state: "IN_PROGRESS" | "RECOVERY_REQUIRED" | "SUCCEEDED" | "FAILED";
                        /** Format: date-time */
                        startedAt: string;
                        /** Format: date-time */
                        expiresAt: string;
                        retryAfterMs: number;
                        completedAt: string | null;
                        httpStatus: number | null;
                        resource: {
                            /** @enum {string} */
                            resourceType: "PRODUCT" | "SKU" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            href: string;
                        } | null;
                        resultHref: string | null;
                        problem: (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 400;
                            /** @constant */
                            code: "VALIDATION_FAILED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VALIDATION";
                                violations: {
                                    field: string;
                                    code: string;
                                    message: string;
                                }[];
                            };
                        }) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "AUTHENTICATION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 401;
                            /** @constant */
                            code: "SESSION_EXPIRED";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "PERMISSION_DENIED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 403;
                            /** @constant */
                            code: "CSRF_FAILED";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "CSRF";
                                /** @constant */
                                refreshHref: "/api/v2/auth/csrf";
                            };
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "RESOURCE_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 404;
                            /** @constant */
                            code: "COMMAND_NOT_FOUND";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "STATE_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "STATE_CONFLICT";
                                /** @enum {string} */
                                resourceType: "SKU" | "FILE" | "ORDER";
                                /** Format: uuid */
                                resourceId: string;
                                currentState: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "VERSION_CONFLICT";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "VERSION_CONFLICT";
                                currentVersion: number;
                                currentEtag: string;
                                resourceHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "IDEMPOTENCY_KEY_REUSED";
                            /** @constant */
                            retryable: false;
                            meta: {
                                /** @constant */
                                kind: "IDEMPOTENCY";
                                operationId: string;
                                /** @constant */
                                commandStatusHref: "/api/v2/commands/status";
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "FILE_NOT_READY";
                            /** @constant */
                            retryable: true;
                            meta: {
                                /** @constant */
                                kind: "FILE_NOT_READY";
                                /** Format: uuid */
                                fileId: string;
                                /** @enum {string} */
                                state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                                statusHref: string;
                            };
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 409;
                            /** @constant */
                            code: "DUPLICATE_BUSINESS_KEY";
                            /** @constant */
                            retryable: false;
                        })) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 428;
                            /** @constant */
                            code: "PRECONDITION_REQUIRED";
                            /** @constant */
                            retryable: false;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 429;
                            /** @constant */
                            code: "RATE_LIMITED";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: false;
                        })) | (({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 500;
                            /** @constant */
                            code: "INTERNAL_ERROR";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 502;
                            /** @constant */
                            code: "DEPENDENCY_FAILURE";
                            /** @constant */
                            retryable: true;
                        }) | ({
                            type: string;
                            title: string;
                            status: number;
                            detail?: string;
                            instance?: string;
                            code: string;
                            /** Format: uuid */
                            requestId: string;
                            retryable: boolean;
                        } & {
                            /** @constant */
                            status: 503;
                            /** @constant */
                            code: "DEPENDENCY_UNAVAILABLE";
                            /** @constant */
                            retryable: true;
                        })) | null;
                    } & {
                        /** @constant */
                        state: "IN_PROGRESS";
                        retryAfterMs: number;
                        completedAt: null;
                        httpStatus: null;
                        resource: null;
                        resultHref: null;
                        problem: null;
                    };
                };
            };
            /** @description Terminal mutation validation problem; Idempotent-Replay is emitted only on a replay */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Terminal mutation authentication problem; Idempotent-Replay is emitted only on a replay */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation authorization problem; Idempotent-Replay is emitted only on a replay */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Terminal mutation hidden-resource problem; Idempotent-Replay is emitted only on a replay */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation conflict problem; Idempotent-Replay is emitted only on a replay */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Terminal mutation precondition problem; Idempotent-Replay is emitted only on a replay */
            428: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 428;
                        /** @constant */
                        code: "PRECONDITION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    };
                };
            };
            /** @description Rate limit problem on a mutation; terminal ledger replay may set Idempotent-Replay true */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Mutation internal problem; terminal response validation may set Idempotent-Replay true */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Idempotent-Replay"?: "true";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    getFileStatusV2: {
        parameters: {
            query?: never;
            header?: {
                "X-Request-ID"?: string;
            };
            path: {
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Files-owned file status */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        id: string;
                        version: number;
                        /** @enum {string} */
                        status: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "AVAILABLE" | "REJECTED" | "QUARANTINED";
                        /** Format: date-time */
                        updatedAt: string;
                        href: string;
                        metadata?: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Hidden resource problem */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
    createFileDownloadIntentV2: {
        parameters: {
            query?: never;
            header: {
                "X-CSRF-Token": string;
                "X-Request-ID"?: string;
            };
            path: {
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Short-lived Files-owned download intent */
            200: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        file: {
                            /** Format: uuid */
                            id: string;
                            version: number;
                            /** @constant */
                            status: "AVAILABLE";
                            /** Format: date-time */
                            updatedAt: string;
                            metadata?: {
                                [key: string]: unknown;
                            };
                        };
                        href: string;
                        transfer: {
                            /** @constant */
                            kind: "HTTP_GET";
                            /** @constant */
                            method: "GET";
                            /** Format: uri */
                            locator: string;
                            /** Format: date-time */
                            expiresAt: string;
                            headers: {
                                [key: string]: string;
                            };
                        };
                    };
                };
            };
            /** @description Validation problem */
            400: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 400;
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VALIDATION";
                            violations: {
                                field: string;
                                code: string;
                                message: string;
                            }[];
                        };
                    };
                };
            };
            /** @description Authentication problem */
            401: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "AUTHENTICATION_REQUIRED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 401;
                        /** @constant */
                        code: "SESSION_EXPIRED";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Authorization or CSRF problem */
            403: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "PERMISSION_DENIED";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 403;
                        /** @constant */
                        code: "CSRF_FAILED";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "CSRF";
                            /** @constant */
                            refreshHref: "/api/v2/auth/csrf";
                        };
                    });
                };
            };
            /** @description Hidden resource problem */
            404: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "RESOURCE_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 404;
                        /** @constant */
                        code: "COMMAND_NOT_FOUND";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Conflict problem */
            409: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "STATE_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "STATE_CONFLICT";
                            /** @enum {string} */
                            resourceType: "SKU" | "FILE" | "ORDER";
                            /** Format: uuid */
                            resourceId: string;
                            currentState: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "VERSION_CONFLICT";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "VERSION_CONFLICT";
                            currentVersion: number;
                            currentEtag: string;
                            resourceHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "IDEMPOTENCY_KEY_REUSED";
                        /** @constant */
                        retryable: false;
                        meta: {
                            /** @constant */
                            kind: "IDEMPOTENCY";
                            operationId: string;
                            /** @constant */
                            commandStatusHref: "/api/v2/commands/status";
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "FILE_NOT_READY";
                        /** @constant */
                        retryable: true;
                        meta: {
                            /** @constant */
                            kind: "FILE_NOT_READY";
                            /** Format: uuid */
                            fileId: string;
                            /** @enum {string} */
                            state: "PENDING_UPLOAD" | "UPLOADED" | "SCANNING" | "REJECTED" | "QUARANTINED";
                            statusHref: string;
                        };
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 409;
                        /** @constant */
                        code: "DUPLICATE_BUSINESS_KEY";
                        /** @constant */
                        retryable: false;
                    });
                };
            };
            /** @description Rate limit problem; read and idempotency-exempt responses never replay */
            429: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    "Retry-After": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 429;
                        /** @constant */
                        code: "RATE_LIMITED";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Internal problem for read/exempt operations; recoverable branches never replay */
            500: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: false;
                    }) | ({
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 500;
                        /** @constant */
                        code: "INTERNAL_ERROR";
                        /** @constant */
                        retryable: true;
                    });
                };
            };
            /** @description Recoverable dependency failure */
            502: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 502;
                        /** @constant */
                        code: "DEPENDENCY_FAILURE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
            /** @description Recoverable dependency unavailable */
            503: {
                headers: {
                    "X-Request-ID": string;
                    "Cache-Control": "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": {
                        type: string;
                        title: string;
                        status: number;
                        detail?: string;
                        instance?: string;
                        code: string;
                        /** Format: uuid */
                        requestId: string;
                        retryable: boolean;
                    } & {
                        /** @constant */
                        status: 503;
                        /** @constant */
                        code: "DEPENDENCY_UNAVAILABLE";
                        /** @constant */
                        retryable: true;
                    };
                };
            };
        };
    };
}
