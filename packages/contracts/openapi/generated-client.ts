import { ContractApiClient, type ContractApiClientOptions, type ContractResponse, type GeneratedOperation } from './client.js';
import type { components } from './generated.js';

export const operations = {
  "getCsrfToken": {
    "method": "GET",
    "path": "/auth/csrf",
    "pathParams": {},
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "CsrfToken",
        "contentType": "application/json",
        "headers": {
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        },
        "requiredHeaders": [
          "Cache-Control"
        ]
      }
    }
  },
  "createSession": {
    "method": "POST",
    "path": "/auth/sessions",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      }
    },
    "requestSchema": "SessionRequest",
    "responses": {
      "201": {
        "schema": "Session",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        },
        "requiredHeaders": [
          "Cache-Control"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getCurrentSession": {
    "method": "GET",
    "path": "/auth/sessions/current",
    "pathParams": {},
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Session",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": true,
            "schema": {
              "type": "string",
              "const": "no-store"
            }
          }
        },
        "requiredHeaders": [
          "Cache-Control"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "deleteCurrentSession": {
    "method": "DELETE",
    "path": "/auth/sessions/current",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      }
    },
    "responses": {
      "204": {
        "headers": {},
        "requiredHeaders": []
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getCommandStatus": {
    "method": "GET",
    "path": "/commands/status",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "X-Command-Operation": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128
        },
        "type": "string"
      }
    },
    "responses": {
      "200": {
        "schema": "CommandStatus",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": false,
            "schema": {
              "type": "string"
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
          },
          "Content-Location": {
            "required": false,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Cache-Control"
        ]
      },
      "404": {
        "schema": "CommandNotFoundProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getUser": {
    "method": "GET",
    "path": "/users/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "User",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createUser": {
    "method": "POST",
    "path": "/organizations/{id}/users",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "X-Request-ID": {
        "required": false,
        "schema": "Uuid"
      }
    },
    "requestSchema": "UserCreateRequest",
    "responses": {
      "201": {
        "schema": "User",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "updateUserRoleBindings": {
    "method": "PUT",
    "path": "/users/{id}/role-bindings",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "RoleBindingsUpdateRequest",
    "responses": {
      "200": {
        "schema": "User",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "updateUserDataScopeGrants": {
    "method": "PUT",
    "path": "/users/{id}/data-scope-grants",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DataScopeUpdateRequest",
    "responses": {
      "200": {
        "schema": "User",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "disableUser": {
    "method": "POST",
    "path": "/users/{id}/disable",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "responses": {
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listCustomers": {
    "method": "GET",
    "path": "/customers",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "CustomerPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createCustomer": {
    "method": "POST",
    "path": "/customers",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "X-Request-ID": {
        "required": false,
        "schema": "Uuid"
      }
    },
    "requestSchema": "CustomerCreateRequest",
    "responses": {
      "201": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getCustomer": {
    "method": "GET",
    "path": "/customers/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "updateCustomer": {
    "method": "PATCH",
    "path": "/customers/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "CustomerUpdateRequest",
    "responses": {
      "200": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "submitCustomerApproval": {
    "method": "POST",
    "path": "/customers/{id}/submit-approval",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "CustomerCommandRequest",
    "responses": {
      "200": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "approveCustomer": {
    "method": "POST",
    "path": "/customers/{id}/approve",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "CustomerCommandRequest",
    "responses": {
      "200": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "rejectCustomer": {
    "method": "POST",
    "path": "/customers/{id}/reject",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "CustomerCommandRequest",
    "responses": {
      "200": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "reassignCustomer": {
    "method": "POST",
    "path": "/customers/{id}/reassign",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "CustomerCommandRequest",
    "responses": {
      "200": {
        "schema": "Customer",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listProducts": {
    "method": "GET",
    "path": "/products",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "ProductPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createProduct": {
    "method": "POST",
    "path": "/products",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "ProductCreateRequest",
    "responses": {
      "201": {
        "schema": "Product",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getProduct": {
    "method": "GET",
    "path": "/products/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Product",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "updateProduct": {
    "method": "PATCH",
    "path": "/products/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "ProductUpdateRequest",
    "responses": {
      "200": {
        "schema": "Product",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listSkus": {
    "method": "GET",
    "path": "/skus",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "SkuPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createSku": {
    "method": "POST",
    "path": "/skus",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "SkuCreateRequest",
    "responses": {
      "201": {
        "schema": "Sku",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getSku": {
    "method": "GET",
    "path": "/skus/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Sku",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "updateSku": {
    "method": "PATCH",
    "path": "/skus/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "SkuUpdateRequest",
    "responses": {
      "200": {
        "schema": "Sku",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listOrders": {
    "method": "GET",
    "path": "/orders",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "OrderPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createOrder": {
    "method": "POST",
    "path": "/orders",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "OrderCreateRequest",
    "responses": {
      "201": {
        "schema": "Order",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getOrder": {
    "method": "GET",
    "path": "/orders/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Order",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "updateOrder": {
    "method": "PATCH",
    "path": "/orders/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "OrderUpdateRequest",
    "responses": {
      "200": {
        "schema": "Order",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "transitionOrder": {
    "method": "POST",
    "path": "/orders/{id}/transitions",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "OrderCommandRequest",
    "responses": {
      "200": {
        "schema": "Order",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listInventoryBalances": {
    "method": "GET",
    "path": "/inventory/balances",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryBalancePage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "listInventoryMovements": {
    "method": "GET",
    "path": "/inventory/movements",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryMovementPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "listInventoryReservations": {
    "method": "GET",
    "path": "/inventory/reservations",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryReservationPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createInventoryReservation": {
    "method": "POST",
    "path": "/inventory/reservations",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryReservationCreateRequest",
    "responses": {
      "201": {
        "schema": "InventoryReservation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getInventory": {
    "method": "GET",
    "path": "/inventory/reservations/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryReservation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "releaseInventoryReservation": {
    "method": "POST",
    "path": "/inventory/reservations/{id}/release",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryCommandRequestTyped",
    "responses": {
      "200": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listInventoryObservations": {
    "method": "GET",
    "path": "/inventory/observations",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryObservationPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createInventoryObservation": {
    "method": "POST",
    "path": "/inventory/observations",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryObservationCreateRequest",
    "responses": {
      "201": {
        "schema": "InventoryObservation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getInventoryOperation": {
    "method": "GET",
    "path": "/inventory/operations/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createInitialReceipt": {
    "method": "POST",
    "path": "/inventory/initial-receipts",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryOperationCreateRequest",
    "responses": {
      "201": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "createInventoryReceipt": {
    "method": "POST",
    "path": "/inventory/receipts",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryOperationCreateRequest",
    "responses": {
      "201": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "createInventoryAdjustment": {
    "method": "POST",
    "path": "/inventory/adjustments",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryOperationCreateRequest",
    "responses": {
      "201": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "issueInventory": {
    "method": "POST",
    "path": "/inventory/issues",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryOperationCreateRequest",
    "responses": {
      "201": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "reverseInventoryOperation": {
    "method": "POST",
    "path": "/inventory/operations/{operationId}/reverse",
    "pathParams": {
      "operationId": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "InventoryCommandRequest",
    "responses": {
      "201": {
        "schema": "InventoryOperation",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listPayments": {
    "method": "GET",
    "path": "/payments",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "PaymentPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createPayment": {
    "method": "POST",
    "path": "/payments",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "PaymentCreateRequest",
    "responses": {
      "201": {
        "schema": "Payment",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getPayment": {
    "method": "GET",
    "path": "/payments/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Payment",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "attachPaymentProof": {
    "method": "POST",
    "path": "/payments/{id}/proofs",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "PaymentCommandRequest",
    "responses": {
      "200": {
        "schema": "Payment",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "submitPaymentReview": {
    "method": "POST",
    "path": "/payments/{id}/submit-review",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "PaymentCommandRequest",
    "responses": {
      "200": {
        "schema": "Payment",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "reviewPayment": {
    "method": "POST",
    "path": "/payments/{id}/review",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "PaymentCommandRequest",
    "responses": {
      "200": {
        "schema": "Payment",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "reversePayment": {
    "method": "POST",
    "path": "/payments/{id}/reverse",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "PaymentCommandRequest",
    "responses": {
      "200": {
        "schema": "Payment",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getFile": {
    "method": "GET",
    "path": "/files/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "File",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createUploadIntent": {
    "method": "POST",
    "path": "/files/upload-intents",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "FileCreateRequest",
    "responses": {
      "201": {
        "schema": "File",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "completeUpload": {
    "method": "POST",
    "path": "/files/{id}/complete",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "FileCommandRequest",
    "responses": {
      "200": {
        "schema": "File",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "createDownloadIntent": {
    "method": "POST",
    "path": "/files/{id}/download-intents",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      }
    },
    "responses": {
      "201": {
        "schema": "File",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "listDocuments": {
    "method": "GET",
    "path": "/orders/{orderId}/documents",
    "pathParams": {
      "orderId": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "DocumentPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createDocument": {
    "method": "POST",
    "path": "/orders/{orderId}/documents",
    "pathParams": {
      "orderId": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCreateRequest",
    "responses": {
      "201": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getDocument": {
    "method": "GET",
    "path": "/documents/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "updateDocument": {
    "method": "PATCH",
    "path": "/documents/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentUpdateRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "createDocumentVersion": {
    "method": "POST",
    "path": "/documents/{id}/versions",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "submitDocument": {
    "method": "POST",
    "path": "/documents/{id}/submit",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "approveDocument": {
    "method": "POST",
    "path": "/documents/{id}/approve",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "rejectDocument": {
    "method": "POST",
    "path": "/documents/{id}/reject",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "finalizeDocument": {
    "method": "POST",
    "path": "/documents/{id}/finalize",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "issueDocument": {
    "method": "POST",
    "path": "/documents/{id}/issue",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "voidDocument": {
    "method": "POST",
    "path": "/documents/{id}/void",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "DocumentCommandRequest",
    "responses": {
      "200": {
        "schema": "Document",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listTasks": {
    "method": "GET",
    "path": "/tasks",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "TaskPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "createTask": {
    "method": "POST",
    "path": "/tasks",
    "pathParams": {},
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      }
    },
    "requestSchema": "TaskCreateRequest",
    "responses": {
      "201": {
        "schema": "Task",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          },
          "Location": {
            "required": true,
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "getTask": {
    "method": "GET",
    "path": "/tasks/{id}",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {},
    "responses": {
      "200": {
        "schema": "Task",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      }
    }
  },
  "completeTask": {
    "method": "POST",
    "path": "/tasks/{id}/complete",
    "pathParams": {
      "id": {
        "required": true,
        "schema": "Uuid"
      }
    },
    "queryParams": {},
    "headers": {
      "X-CSRF-Token": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 16,
          "maxLength": 512
        },
        "type": "string"
      },
      "Idempotency-Key": {
        "required": true,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 128,
          "pattern": "^[\\x21-\\x7E]+$"
        },
        "type": "string"
      },
      "If-Match": {
        "required": true,
        "schema": {
          "type": "string",
          "pattern": "^\"v[1-9][0-9]*\"$"
        },
        "type": "string"
      }
    },
    "requestSchema": "TaskCommandRequest",
    "responses": {
      "200": {
        "schema": "Task",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "ETag": {
            "required": false,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
            }
          }
        },
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string"
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
            "schema": "Href"
          }
        },
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {},
        "requiredHeaders": []
      }
    }
  },
  "listAuditEvents": {
    "method": "GET",
    "path": "/audit-events",
    "pathParams": {},
    "queryParams": {
      "page[after]": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 512
        },
        "type": "string"
      },
      "page[size]": {
        "required": false,
        "schema": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "type": "integer"
      },
      "sort": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 256,
          "default": "-updatedAt,-id"
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 256
          }
        },
        "type": "array"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "AuditEventPage",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": false,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": []
      }
    }
  }
} as const satisfies Record<string, GeneratedOperation>;
export type OperationId = keyof typeof operations;
export type OperationInputMap = {
  "getCsrfToken": Record<never, never>;
  "createSession": { headers: Record<string, string> & { "X-CSRF-Token": string }; body: components["schemas"]["SessionRequest"] };
  "getCurrentSession": Record<never, never>;
  "deleteCurrentSession": { headers: Record<string, string> & { "X-CSRF-Token": string } };
  "getCommandStatus": { headers: Record<string, string> & { "Idempotency-Key": string; "X-Command-Operation": string } };
  "getUser": { pathParams: { "id": string } };
  "createUser": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["UserCreateRequest"] };
  "updateUserRoleBindings": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["RoleBindingsUpdateRequest"] };
  "updateUserDataScopeGrants": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DataScopeUpdateRequest"] };
  "disableUser": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string } };
  "listCustomers": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createCustomer": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["CustomerCreateRequest"] };
  "getCustomer": { pathParams: { "id": string } };
  "updateCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerUpdateRequest"] };
  "submitCustomerApproval": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "approveCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "rejectCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "reassignCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "listProducts": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createProduct": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["ProductCreateRequest"] };
  "getProduct": { pathParams: { "id": string } };
  "updateProduct": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["ProductUpdateRequest"] };
  "listSkus": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createSku": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["SkuCreateRequest"] };
  "getSku": { pathParams: { "id": string } };
  "updateSku": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["SkuUpdateRequest"] };
  "listOrders": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createOrder": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["OrderCreateRequest"] };
  "getOrder": { pathParams: { "id": string } };
  "updateOrder": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["OrderUpdateRequest"] };
  "transitionOrder": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["OrderCommandRequest"] };
  "listInventoryBalances": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "listInventoryMovements": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "listInventoryReservations": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createInventoryReservation": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryReservationCreateRequest"] };
  "getInventory": { pathParams: { "id": string } };
  "releaseInventoryReservation": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["InventoryCommandRequestTyped"] };
  "listInventoryObservations": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createInventoryObservation": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryObservationCreateRequest"] };
  "getInventoryOperation": { pathParams: { "id": string } };
  "createInitialReceipt": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "createInventoryReceipt": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "createInventoryAdjustment": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "issueInventory": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "reverseInventoryOperation": { pathParams: { "operationId": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["InventoryCommandRequest"] };
  "listPayments": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createPayment": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["PaymentCreateRequest"] };
  "getPayment": { pathParams: { "id": string } };
  "attachPaymentProof": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["PaymentCommandRequest"] };
  "submitPaymentReview": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["PaymentCommandRequest"] };
  "reviewPayment": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["PaymentCommandRequest"] };
  "reversePayment": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["PaymentCommandRequest"] };
  "getFile": { pathParams: { "id": string } };
  "createUploadIntent": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["FileCreateRequest"] };
  "completeUpload": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["FileCommandRequest"] };
  "createDownloadIntent": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string } };
  "listDocuments": { pathParams: { "orderId": string }; query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createDocument": { pathParams: { "orderId": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCreateRequest"] };
  "getDocument": { pathParams: { "id": string } };
  "updateDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentUpdateRequest"] };
  "createDocumentVersion": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "submitDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "approveDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "rejectDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "finalizeDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "issueDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "voidDocument": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["DocumentCommandRequest"] };
  "listTasks": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
  "createTask": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["TaskCreateRequest"] };
  "getTask": { pathParams: { "id": string } };
  "completeTask": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["TaskCommandRequest"] };
  "listAuditEvents": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string[] } };
};
export type OperationResponseMap = {
  "getCsrfToken": ContractResponse<components["schemas"]["CsrfToken"], { "Cache-Control": "no-store" }, 200>;
  "createSession": ContractResponse<components["schemas"]["Session"], { "X-Request-ID"?: string; "Cache-Control": "no-store" }, 201>;
  "getCurrentSession": ContractResponse<components["schemas"]["Session"], { "X-Request-ID"?: string; "Cache-Control": "no-store" }, 200>;
  "deleteCurrentSession": ContractResponse<void, Record<never, never>, 204>;
  "getCommandStatus": ContractResponse<components["schemas"]["CommandStatus"], { "X-Request-ID"?: string; "Retry-After"?: string; "Cache-Control": "no-store"; "Idempotent-Replay"?: "true"; "Content-Location"?: string }, 200>;
  "getUser": ContractResponse<components["schemas"]["User"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "createUser": ContractResponse<components["schemas"]["User"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "updateUserRoleBindings": ContractResponse<components["schemas"]["User"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "updateUserDataScopeGrants": ContractResponse<components["schemas"]["User"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "disableUser": ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listCustomers": ContractResponse<components["schemas"]["CustomerPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "updateCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "submitCustomerApproval": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "approveCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "rejectCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reassignCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listProducts": ContractResponse<components["schemas"]["ProductPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createProduct": ContractResponse<components["schemas"]["Product"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getProduct": ContractResponse<components["schemas"]["Product"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "updateProduct": ContractResponse<components["schemas"]["Product"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listSkus": ContractResponse<components["schemas"]["SkuPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createSku": ContractResponse<components["schemas"]["Sku"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getSku": ContractResponse<components["schemas"]["Sku"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "updateSku": ContractResponse<components["schemas"]["Sku"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listOrders": ContractResponse<components["schemas"]["OrderPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "updateOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "transitionOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listInventoryBalances": ContractResponse<components["schemas"]["InventoryBalancePage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "listInventoryMovements": ContractResponse<components["schemas"]["InventoryMovementPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "listInventoryReservations": ContractResponse<components["schemas"]["InventoryReservationPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createInventoryReservation": ContractResponse<components["schemas"]["InventoryReservation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getInventory": ContractResponse<components["schemas"]["InventoryReservation"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "releaseInventoryReservation": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listInventoryObservations": ContractResponse<components["schemas"]["InventoryObservationPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createInventoryObservation": ContractResponse<components["schemas"]["InventoryObservation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getInventoryOperation": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "createInitialReceipt": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createInventoryReceipt": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createInventoryAdjustment": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "issueInventory": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reverseInventoryOperation": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listPayments": ContractResponse<components["schemas"]["PaymentPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createPayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getPayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "attachPaymentProof": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "submitPaymentReview": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reviewPayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reversePayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getFile": ContractResponse<components["schemas"]["File"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "createUploadIntent": ContractResponse<components["schemas"]["File"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "completeUpload": ContractResponse<components["schemas"]["File"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createDownloadIntent": ContractResponse<components["schemas"]["File"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201>;
  "listDocuments": ContractResponse<components["schemas"]["DocumentPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "updateDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createDocumentVersion": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "submitDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "approveDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "rejectDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "finalizeDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "issueDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "voidDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listTasks": ContractResponse<components["schemas"]["TaskPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
  "createTask": ContractResponse<components["schemas"]["Task"], { "X-Request-ID"?: string; "ETag"?: string; "Location": string }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getTask": ContractResponse<components["schemas"]["Task"], { "X-Request-ID"?: string; "ETag"?: string }, 200>;
  "completeTask": ContractResponse<components["schemas"]["Task"], { "X-Request-ID"?: string; "ETag"?: string }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID"?: string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listAuditEvents": ContractResponse<components["schemas"]["AuditEventPage"], { "X-Request-ID"?: string; "Cache-Control"?: string }, 200>;
};

export class GeneratedApiClient extends ContractApiClient {
  constructor(options: ContractApiClientOptions = {}) {
    super(options);
  }

  call<Id extends OperationId>(operationId: Id, input: OperationInputMap[Id]): Promise<OperationResponseMap[Id]> {
    return super.execute(operations[operationId], input);
  }
}
