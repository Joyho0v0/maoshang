export const operations = {
  "getCsrfTokenV2": {
    "operationId": "getCsrfTokenV2",
    "method": "GET",
    "path": "/auth/csrf",
    "parameters": [],
    "responses": {
      "200": {
        "schema": "CsrfToken",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "getCurrentSessionV2": {
    "operationId": "getCurrentSessionV2",
    "method": "GET",
    "path": "/auth/sessions/current",
    "parameters": [],
    "responses": {
      "200": {
        "schema": "Session",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "getCommandStatusV2": {
    "operationId": "getCommandStatusV2",
    "method": "GET",
    "path": "/commands/status",
    "parameters": [
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "X-Command-Operation",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^(create|update|transition)(Product|Sku|Order)V2$"
        },
        "$ref": "#/components/parameters/CommandOperationHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "CommandStatus",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "listProductsV2": {
    "operationId": "listProductsV2",
    "method": "GET",
    "path": "/products",
    "parameters": [
      {
        "name": "page[after]",
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/CursorV2"
        },
        "$ref": "#/components/parameters/PageAfter"
      },
      {
        "name": "page[size]",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "$ref": "#/components/parameters/PageSize"
      },
      {
        "name": "filter[status]",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "INACTIVE"
          ]
        },
        "$ref": "#/components/parameters/ProductStatusFilter"
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/ProductSortV2"
        },
        "$ref": "#/components/parameters/ProductSort"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "ProductPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    },
    "cursorBinding": {
      "fields": [
        "version",
        "operation",
        "resource",
        "organization",
        "scopeFingerprint",
        "authzVersion",
        "sort",
        "filters",
        "pageSize",
        "lastTuple"
      ],
      "resource": "PRODUCT",
      "defaultSort": "-updatedAt,-id",
      "filterAllowlist": [
        "ACTIVE",
        "INACTIVE"
      ],
      "collation": "C",
      "tieBreaker": "id"
    }
  },
  "createProductV2": {
    "operationId": "createProductV2",
    "method": "POST",
    "path": "/products",
    "requestSchema": "ProductCreateRequestV2",
    "parameters": [
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "201": {
        "schema": "ProductV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^/api/v2/[A-Za-z0-9._~!$&'()*+,;=:@/-]+$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "getProductV2": {
    "operationId": "getProductV2",
    "method": "GET",
    "path": "/products/{id}",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "ProductV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "updateProductV2": {
    "operationId": "updateProductV2",
    "method": "PATCH",
    "path": "/products/{id}",
    "requestSchema": "ProductUpdateRequestV2",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "If-Match",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "$ref": "#/components/parameters/IfMatchHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "ProductV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "listSkusV2": {
    "operationId": "listSkusV2",
    "method": "GET",
    "path": "/skus",
    "parameters": [
      {
        "name": "page[after]",
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/CursorV2"
        },
        "$ref": "#/components/parameters/PageAfter"
      },
      {
        "name": "page[size]",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "$ref": "#/components/parameters/PageSize"
      },
      {
        "name": "filter[status]",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "ACTIVE",
            "INACTIVE"
          ]
        },
        "$ref": "#/components/parameters/SkuStatusFilter"
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/SkuSortV2"
        },
        "$ref": "#/components/parameters/SkuSort"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "SkuPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    },
    "cursorBinding": {
      "fields": [
        "version",
        "operation",
        "resource",
        "organization",
        "scopeFingerprint",
        "authzVersion",
        "sort",
        "filters",
        "pageSize",
        "lastTuple"
      ],
      "resource": "SKU",
      "defaultSort": "-updatedAt,-id",
      "filterAllowlist": [
        "ACTIVE",
        "INACTIVE"
      ],
      "collation": "C",
      "tieBreaker": "id"
    }
  },
  "createSkuV2": {
    "operationId": "createSkuV2",
    "method": "POST",
    "path": "/skus",
    "requestSchema": "SkuCreateRequestV2",
    "parameters": [
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "201": {
        "schema": "SkuV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^/api/v2/[A-Za-z0-9._~!$&'()*+,;=:@/-]+$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "getSkuV2": {
    "operationId": "getSkuV2",
    "method": "GET",
    "path": "/skus/{id}",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "SkuV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "updateSkuV2": {
    "operationId": "updateSkuV2",
    "method": "PATCH",
    "path": "/skus/{id}",
    "requestSchema": "SkuUpdateRequestV2",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "If-Match",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "$ref": "#/components/parameters/IfMatchHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "SkuV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "listOrdersV2": {
    "operationId": "listOrdersV2",
    "method": "GET",
    "path": "/orders",
    "parameters": [
      {
        "name": "page[after]",
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/CursorV2"
        },
        "$ref": "#/components/parameters/PageAfter"
      },
      {
        "name": "page[size]",
        "in": "query",
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "$ref": "#/components/parameters/PageSize"
      },
      {
        "name": "filter[status]",
        "in": "query",
        "required": false,
        "schema": {
          "type": "string",
          "enum": [
            "DRAFT",
            "CONFIRMED",
            "FULFILLED",
            "CANCELLED"
          ]
        },
        "$ref": "#/components/parameters/OrderStatusFilter"
      },
      {
        "name": "sort",
        "in": "query",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/OrderSortV2"
        },
        "$ref": "#/components/parameters/OrderSort"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "OrderPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    },
    "cursorBinding": {
      "fields": [
        "version",
        "operation",
        "resource",
        "organization",
        "scopeFingerprint",
        "authzVersion",
        "sort",
        "filters",
        "pageSize",
        "lastTuple"
      ],
      "resource": "ORDER",
      "defaultSort": "-updatedAt,-id",
      "filterAllowlist": [
        "DRAFT",
        "CONFIRMED",
        "FULFILLED",
        "CANCELLED"
      ],
      "collation": "C",
      "tieBreaker": "id"
    }
  },
  "createOrderV2": {
    "operationId": "createOrderV2",
    "method": "POST",
    "path": "/orders",
    "requestSchema": "OrderCreateRequestV2",
    "parameters": [
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "201": {
        "schema": "OrderV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^/api/v2/[A-Za-z0-9._~!$&'()*+,;=:@/-]+$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "getOrderV2": {
    "operationId": "getOrderV2",
    "method": "GET",
    "path": "/orders/{id}",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "OrderV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "updateOrderV2": {
    "operationId": "updateOrderV2",
    "method": "PATCH",
    "path": "/orders/{id}",
    "requestSchema": "OrderUpdateRequestV2",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "If-Match",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "$ref": "#/components/parameters/IfMatchHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "OrderV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "transitionOrderV2": {
    "operationId": "transitionOrderV2",
    "method": "POST",
    "path": "/orders/{id}/transitions",
    "requestSchema": "OrderTransitionRequestV2",
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/ResourceId"
      },
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "Idempotency-Key",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "$ref": "#/components/parameters/IdempotencyHeader"
      },
      {
        "name": "If-Match",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "$ref": "#/components/parameters/IfMatchHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "OrderV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "202": {
        "schema": "CommandStatusInProgressV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Content-Location": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "/api/v2/commands/status"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "428": {
        "schema": "Problem428",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Idempotent-Replay": {
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "true"
              ]
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "getFileStatusV2": {
    "operationId": "getFileStatusV2",
    "method": "GET",
    "path": "/files/{fileId}",
    "parameters": [
      {
        "name": "fileId",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/FileId"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "FileStatusV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  },
  "createFileDownloadIntentV2": {
    "operationId": "createFileDownloadIntentV2",
    "method": "POST",
    "path": "/files/{fileId}/download-intents",
    "parameters": [
      {
        "name": "fileId",
        "in": "path",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/FileId"
      },
      {
        "name": "X-CSRF-Token",
        "in": "header",
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "$ref": "#/components/parameters/CsrfHeader"
      },
      {
        "name": "X-Request-ID",
        "in": "header",
        "required": false,
        "schema": {
          "$ref": "#/components/schemas/Uuid"
        },
        "$ref": "#/components/parameters/RequestIdHeader"
      }
    ],
    "responses": {
      "200": {
        "schema": "FileDownloadIntentV2",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "400": {
        "schema": "Problem400",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "401": {
        "schema": "Problem401",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "403": {
        "schema": "Problem403",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "404": {
        "schema": "Problem404",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "409": {
        "schema": "Problem409",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "429": {
        "schema": "Problem429",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        }
      },
      "500": {
        "schema": "Problem500",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "502": {
        "schema": "Problem502",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      },
      "503": {
        "schema": "Problem503",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/Uuid"
            }
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        }
      }
    }
  }
};
export class GeneratedV2Client {
  constructor(options = {}) { this.baseUrl = (options.baseUrl ?? '/api/v2').replace(/\/$/, ''); this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis); this.validator = options.validator; }
  async call(operationId, input = {}) {
    const operation = operations[operationId];
    if (operation === undefined) throw new Error('Unknown operation ' + operationId);
    validateOperationInput(operation, input, this.validator);
    const path = operation.path.replace(/\{([^}]+)\}/g, (_match, name) => encodeURIComponent(input.pathParams?.[name] ?? (() => { throw new Error('Missing path parameter: ' + name); })()));
    const absolute = /^https?:\/\//i.test(this.baseUrl);
    const url = absolute ? new URL(this.baseUrl + path) : new URL(this.baseUrl + path, 'http://v2-contract.invalid');
    for (const [key, value] of Object.entries(input.query ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const headers = new Headers({ Accept: 'application/json', ...(input.headers ?? {}) });
    if (input.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
    const response = await this.fetchImpl(absolute ? url.toString() : url.pathname + url.search, { method: operation.method, credentials: 'include', headers, ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }) });
    const contract = operation.responses[String(response.status)];
    if (contract === undefined) throw new Error('Undeclared HTTP status ' + response.status);
    const payload = await response.text().then((text) => text.length === 0 ? undefined : JSON.parse(text));
    const responseHeaders = {}; for (const [name, header] of Object.entries(contract.headers ?? {})) { const value = response.headers.get(name); if (value === null && header.required) throw new Error('Missing required response header ' + name); if (value !== null && header.schema !== undefined && !this.validator.validateSchema(header.schema, value)) throw new Error('Invalid response header ' + name); if (value !== null) responseHeaders[name] = value; }
    for (const name of ['X-Request-ID', 'ETag', 'Location', 'Content-Location', 'Cache-Control', 'Retry-After', 'Idempotent-Replay']) if (!(name in (contract.headers ?? {})) && response.headers.get(name) !== null) throw new Error('Forbidden response header ' + name);
    validateResponseSemantics(operation, response.status, payload, responseHeaders, input);
    if (contract.schema !== undefined && !this.validator.validate(contract.schema, payload)) throw new Error('Invalid response schema ' + contract.schema); if (contract.schema === 'OrderV2') validateOrderState(payload); if (contract.schema === 'OrderPage') for (const item of payload.data ?? []) validateOrderState(item);
    if (!response.ok) { const error = new Error('API request failed.'); error.status = response.status; error.problem = payload; error.headers = responseHeaders; throw error; }
    return { status: response.status, data: payload, headers: responseHeaders };
  }
}
function findHeader(headers, name) { const key = Object.keys(headers ?? {}).find((candidate) => candidate.toLowerCase() === name.toLowerCase()); return key === undefined ? undefined : headers?.[key]; }
function validateOperationInput(operation, input, validator) {
  if (validator === undefined) throw new Error('A runtime validator is required before sending a request.');
  const containers = { path: input.pathParams, query: input.query, header: input.headers };
  const declaredHeaders = new Set((operation.parameters ?? []).filter((parameter) => parameter.in === 'header').map((parameter) => parameter.name.toLowerCase()));
  for (const parameter of operation.parameters ?? []) { const value = parameter.in === 'header' ? findHeader(containers.header, parameter.name) : containers[parameter.in]?.[parameter.name]; if (value === undefined) { if (parameter.required) throw new Error('Missing required ' + parameter.in + ' parameter: ' + parameter.name); continue; } if (parameter.in === 'header' && typeof value !== 'string') throw new Error('Invalid header: ' + parameter.name); if (parameter.schema !== undefined && !validator.validateSchema(parameter.schema, value)) throw new Error('Invalid ' + parameter.in + ' parameter: ' + parameter.name); }
  for (const name of Object.keys(containers.header ?? {})) if (!declaredHeaders.has(name.toLowerCase())) throw new Error('Unknown header: ' + name);
  if (operation.requestSchema !== undefined) { if (!Object.hasOwn(input, 'body') || !validator.validate(operation.requestSchema, input.body)) throw new Error('Invalid ' + operation.requestSchema + ' request body.'); } else if (Object.hasOwn(input, 'body')) throw new Error('Operation does not accept a request body.');
  validateSemanticInput(operation, input);
}
function validateSemanticInput(operation, input) { const query = input.query; if (query !== undefined) { const declared = new Set((operation.parameters ?? []).filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name)); for (const [key, value] of Object.entries(query)) { if (!declared.has(key) || Array.isArray(value)) throw new Error('Invalid or duplicate query parameter: ' + key); } } if (operation.cursorBinding && query?.['page[after]'] !== undefined) validateCursorBinding(operation, query); const body = input.body; if (operation.operationId === 'updateOrderV2' && body?.lines !== undefined) { const ids = new Set(); const images = new Set(); for (const line of body.lines) { if (line.lineId !== null && ids.has(String(line.lineId))) throw new Error('Duplicate replacement lineId'); if (line.lineId !== null) ids.add(String(line.lineId)); if (line.imageFileId !== null && images.has(String(line.imageFileId))) throw new Error('An image file cannot be reused by multiple lines'); if (line.imageFileId !== null) images.add(String(line.imageFileId)); } } }
function validateCursorBinding(operation, query) { const raw = String(query['page[after]']); if (!/^v2\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw)) throw new Error('Invalid opaque cursor'); }
function canonicalFilters(query) { return JSON.stringify(Object.fromEntries(Object.entries(query).filter(([key]) => key.startsWith('filter[')).sort(([a], [b]) => a.localeCompare(b)))); }
function nextOrderStage(stage) { return { INITIAL_CONTACT: 'QUOTING', QUOTING: 'QUOTE_FOLLOW_UP', QUOTE_FOLLOW_UP: 'DEPOSIT_PENDING', DEPOSIT_PENDING: 'DEPOSIT_CONFIRMED', DEPOSIT_CONFIRMED: 'FULFILLMENT', FULFILLMENT: 'FOB_COMPLETED', FOB_COMPLETED: 'CLOSED' }[stage]; }
function validateOrderState(payload) {
  const order = payload ?? {}; const caps = order.capabilities ?? []; const transitions = order.allowedTransitions ?? [];
  const terminal = order.status === 'FULFILLED' || order.status === 'CANCELLED' || order.stage === 'CLOSED';
  if (terminal) { if (caps.length !== 0 || transitions.length !== 0) throw new Error('terminal order state must expose empty capabilities and allowedTransitions'); }
  else {
    const canUpdate = order.status === 'DRAFT' && ['INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP'].includes(order.stage);
    const canTransition = nextOrderStage(order.stage) !== undefined;
    const allowedCaps = new Set([...(canUpdate ? ['order.update'] : []), ...(canTransition ? ['order.transition'] : [])]);
    if (caps.length !== new Set(caps).size || caps.some((cap) => !allowedCaps.has(cap))) throw new Error('order capabilities do not match independent permission projection');
    if (caps.includes('order.update') && !canUpdate) throw new Error('order.update is not allowed for this status/stage');
    if (caps.includes('order.transition') && !canTransition) throw new Error('order.transition is not allowed for this stage');
    const expectedTransitions = caps.includes('order.transition') ? [{ action: 'ADVANCE', toStage: nextOrderStage(order.stage) }, { action: 'CANCEL' }] : [];
    if (JSON.stringify(transitions) !== JSON.stringify(expectedTransitions)) throw new Error('allowedTransitions do not match independent transition capability');
  }
  validateOrderLines(order);
}
function validateOrderLines(order) {
  for (const value of order.lines ?? []) {
    if (value.itemKind === 'STANDARD') {
      if (value.priceSnapshot?.sourceKind !== 'CATALOG_POLICY') throw new Error('STANDARD line must use CATALOG_POLICY price snapshot');
      const sameCurrency = value.priceSnapshot?.sourceCurrency === order.currency;
      if (sameCurrency) { if (value.fxSnapshot !== null) throw new Error('STANDARD same-currency snapshot must not carry FX'); }
      else if (value.fxSnapshot === null || value.fxSnapshot === undefined || value.fxSnapshot.baseCurrency !== value.priceSnapshot?.sourceCurrency || value.fxSnapshot.quoteCurrency !== order.currency) throw new Error('STANDARD FX currency mismatch');
    } else if (value.itemKind === 'NON_STANDARD' && (value.priceSnapshot?.sourceKind !== 'MANUAL_QUOTE' || value.priceSnapshot.sourceCurrency !== order.currency || value.fxSnapshot !== null)) throw new Error('NON_STANDARD snapshot semantics are invalid');
  }
}
function validateResponseSemantics(operation, status, payload, headers, input) {
  const state = payload?.state; const retry = headers['Retry-After']; const replay = headers['Idempotent-Replay']; const declaredReplay = operation.responses?.[String(status)]?.headers?.['Idempotent-Replay'] !== undefined;
  if (status >= 400 && payload?.status !== status) throw new Error('Problem status must match HTTP status');
  if (status >= 400 && payload?.requestId !== headers['X-Request-ID']) throw new Error('Problem requestId must match X-Request-ID');
  if (replay !== undefined && replay !== 'true') throw new Error('Idempotent-Replay must be true'); if (replay !== undefined && !declaredReplay) throw new Error('Idempotent-Replay is forbidden for this response'); if (replay !== undefined && (status === 502 || status === 503 || (status === 500 && payload?.retryable === true))) throw new Error('recoverable problem cannot be replayed'); if ([429, 500, 502, 503].includes(status) && headers['Cache-Control'] !== 'no-store') throw new Error('Problem response requires Cache-Control no-store');
  if (operation.operationId === 'getCommandStatusV2') { const commandOperation = findHeader(input?.headers, 'X-Command-Operation'); if (commandOperation !== undefined && payload?.operationId !== commandOperation) throw new Error('CommandStatus operationId must match X-Command-Operation'); if ((state === 'IN_PROGRESS' || state === 'RECOVERY_REQUIRED') && retry === undefined) throw new Error(state + ' command status requires Retry-After'); if (state !== 'IN_PROGRESS' && state !== 'RECOVERY_REQUIRED' && retry !== undefined) throw new Error('terminal command status forbids Retry-After'); if (headers['Content-Location'] !== '/api/v2/commands/status') throw new Error('command status Content-Location must be canonical'); }
  if (status === 202 && operation.operationId !== 'getCommandStatusV2' && retry === undefined) throw new Error('202 command response requires Retry-After'); for (const name of ['Location', 'Content-Location']) { const value = headers[name]; if (value !== undefined && (!/^\/api\/v2\//.test(value) || /[?#]/.test(value))) throw new Error('Invalid canonical href header ' + name); } if (status === 202 && headers['Content-Location'] !== '/api/v2/commands/status') throw new Error('202 Content-Location must be the command status resource');
  if (status === 201 && operation.operationId.startsWith('create')) { const collection = { createProductV2: 'products', createSkuV2: 'skus', createOrderV2: 'orders' }[operation.operationId]; if (collection === undefined || typeof payload?.id !== 'string' || headers.Location !== '/api/v2/' + collection + '/' + payload.id) throw new Error('201 Location must identify this operation collection and body id'); }
}
