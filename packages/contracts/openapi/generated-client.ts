import { ContractApiClient, type ContractApiClientOptions, type GeneratedOperation } from './client.js';
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
        "headers": [
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
        "requiredHeaders": [
          "Cache-Control"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
        "requiredHeaders": [
          "Cache-Control"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [],
        "requiredHeaders": []
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Idempotent-Replay",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Cache-Control"
        ]
      },
      "404": {
        "schema": "CommandNotFoundProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "CustomerPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "ProductPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "SkuPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "OrderPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryBalancePage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryMovementPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryReservationPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "InventoryObservationPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "PaymentPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "DocumentPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "TaskPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag",
          "Location"
        ],
        "requiredHeaders": [
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
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
        "headers": [
          "X-Request-ID",
          "ETag"
        ],
        "requiredHeaders": []
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ],
        "requiredHeaders": [
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": [],
        "requiredHeaders": []
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": [
          "X-Request-ID"
        ],
        "requiredHeaders": []
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": [],
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
          "maxLength": 256
        },
        "type": "string"
      },
      "filter": {
        "required": false,
        "schema": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        "type": "string"
      }
    },
    "headers": {},
    "responses": {
      "200": {
        "schema": "AuditEventPage",
        "contentType": "application/json",
        "headers": [
          "X-Request-ID",
          "Cache-Control"
        ],
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
  "listCustomers": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createCustomer": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["CustomerCreateRequest"] };
  "getCustomer": { pathParams: { "id": string } };
  "updateCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerUpdateRequest"] };
  "submitCustomerApproval": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "approveCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "rejectCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "reassignCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "listProducts": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createProduct": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["ProductCreateRequest"] };
  "getProduct": { pathParams: { "id": string } };
  "updateProduct": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["ProductUpdateRequest"] };
  "listSkus": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createSku": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["SkuCreateRequest"] };
  "getSku": { pathParams: { "id": string } };
  "updateSku": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["SkuUpdateRequest"] };
  "listOrders": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createOrder": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["OrderCreateRequest"] };
  "getOrder": { pathParams: { "id": string } };
  "updateOrder": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["OrderUpdateRequest"] };
  "transitionOrder": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["OrderCommandRequest"] };
  "listInventoryBalances": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "listInventoryMovements": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "listInventoryReservations": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createInventoryReservation": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryReservationCreateRequest"] };
  "getInventory": { pathParams: { "id": string } };
  "releaseInventoryReservation": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["InventoryCommandRequestTyped"] };
  "listInventoryObservations": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createInventoryObservation": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryObservationCreateRequest"] };
  "getInventoryOperation": { pathParams: { "id": string } };
  "createInitialReceipt": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "createInventoryReceipt": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "createInventoryAdjustment": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "issueInventory": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "reverseInventoryOperation": { pathParams: { "operationId": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["InventoryCommandRequest"] };
  "listPayments": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
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
  "listDocuments": { pathParams: { "orderId": string }; query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
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
  "listTasks": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
  "createTask": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["TaskCreateRequest"] };
  "getTask": { pathParams: { "id": string } };
  "completeTask": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["TaskCommandRequest"] };
  "listAuditEvents": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter"?: string } };
};
export type OperationResponseMap = {
  "getCsrfToken": components["schemas"]["CsrfToken"];
  "createSession": components["schemas"]["Session"];
  "getCurrentSession": components["schemas"]["Session"];
  "deleteCurrentSession": void;
  "getCommandStatus": components["schemas"]["CommandStatus"];
  "getUser": components["schemas"]["User"];
  "createUser": components["schemas"]["User"] | components["schemas"]["CommandStatusInProgress"];
  "updateUserRoleBindings": components["schemas"]["User"] | components["schemas"]["CommandStatusInProgress"];
  "updateUserDataScopeGrants": components["schemas"]["User"] | components["schemas"]["CommandStatusInProgress"];
  "disableUser": components["schemas"]["CommandStatusInProgress"];
  "listCustomers": components["schemas"]["CustomerPage"];
  "createCustomer": components["schemas"]["Customer"] | components["schemas"]["CommandStatusInProgress"];
  "getCustomer": components["schemas"]["Customer"];
  "updateCustomer": components["schemas"]["Customer"] | components["schemas"]["CommandStatusInProgress"];
  "submitCustomerApproval": components["schemas"]["Customer"] | components["schemas"]["CommandStatusInProgress"];
  "approveCustomer": components["schemas"]["Customer"] | components["schemas"]["CommandStatusInProgress"];
  "rejectCustomer": components["schemas"]["Customer"] | components["schemas"]["CommandStatusInProgress"];
  "reassignCustomer": components["schemas"]["Customer"] | components["schemas"]["CommandStatusInProgress"];
  "listProducts": components["schemas"]["ProductPage"];
  "createProduct": components["schemas"]["Product"] | components["schemas"]["CommandStatusInProgress"];
  "getProduct": components["schemas"]["Product"];
  "updateProduct": components["schemas"]["Product"] | components["schemas"]["CommandStatusInProgress"];
  "listSkus": components["schemas"]["SkuPage"];
  "createSku": components["schemas"]["Sku"] | components["schemas"]["CommandStatusInProgress"];
  "getSku": components["schemas"]["Sku"];
  "updateSku": components["schemas"]["Sku"] | components["schemas"]["CommandStatusInProgress"];
  "listOrders": components["schemas"]["OrderPage"];
  "createOrder": components["schemas"]["Order"] | components["schemas"]["CommandStatusInProgress"];
  "getOrder": components["schemas"]["Order"];
  "updateOrder": components["schemas"]["Order"] | components["schemas"]["CommandStatusInProgress"];
  "transitionOrder": components["schemas"]["Order"] | components["schemas"]["CommandStatusInProgress"];
  "listInventoryBalances": components["schemas"]["InventoryBalancePage"];
  "listInventoryMovements": components["schemas"]["InventoryMovementPage"];
  "listInventoryReservations": components["schemas"]["InventoryReservationPage"];
  "createInventoryReservation": components["schemas"]["InventoryReservation"] | components["schemas"]["CommandStatusInProgress"];
  "getInventory": components["schemas"]["InventoryReservation"];
  "releaseInventoryReservation": components["schemas"]["InventoryOperation"] | components["schemas"]["CommandStatusInProgress"];
  "listInventoryObservations": components["schemas"]["InventoryObservationPage"];
  "createInventoryObservation": components["schemas"]["InventoryObservation"] | components["schemas"]["CommandStatusInProgress"];
  "getInventoryOperation": components["schemas"]["InventoryOperation"];
  "createInitialReceipt": components["schemas"]["InventoryOperation"] | components["schemas"]["CommandStatusInProgress"];
  "createInventoryReceipt": components["schemas"]["InventoryOperation"] | components["schemas"]["CommandStatusInProgress"];
  "createInventoryAdjustment": components["schemas"]["InventoryOperation"] | components["schemas"]["CommandStatusInProgress"];
  "issueInventory": components["schemas"]["InventoryOperation"] | components["schemas"]["CommandStatusInProgress"];
  "reverseInventoryOperation": components["schemas"]["InventoryOperation"] | components["schemas"]["CommandStatusInProgress"];
  "listPayments": components["schemas"]["PaymentPage"];
  "createPayment": components["schemas"]["Payment"] | components["schemas"]["CommandStatusInProgress"];
  "getPayment": components["schemas"]["Payment"];
  "attachPaymentProof": components["schemas"]["Payment"] | components["schemas"]["CommandStatusInProgress"];
  "submitPaymentReview": components["schemas"]["Payment"] | components["schemas"]["CommandStatusInProgress"];
  "reviewPayment": components["schemas"]["Payment"] | components["schemas"]["CommandStatusInProgress"];
  "reversePayment": components["schemas"]["Payment"] | components["schemas"]["CommandStatusInProgress"];
  "getFile": components["schemas"]["File"];
  "createUploadIntent": components["schemas"]["File"] | components["schemas"]["CommandStatusInProgress"];
  "completeUpload": components["schemas"]["File"] | components["schemas"]["CommandStatusInProgress"];
  "createDownloadIntent": components["schemas"]["File"];
  "listDocuments": components["schemas"]["DocumentPage"];
  "createDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "getDocument": components["schemas"]["Document"];
  "updateDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "createDocumentVersion": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "submitDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "approveDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "rejectDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "finalizeDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "issueDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "voidDocument": components["schemas"]["Document"] | components["schemas"]["CommandStatusInProgress"];
  "listTasks": components["schemas"]["TaskPage"];
  "createTask": components["schemas"]["Task"] | components["schemas"]["CommandStatusInProgress"];
  "getTask": components["schemas"]["Task"];
  "completeTask": components["schemas"]["Task"] | components["schemas"]["CommandStatusInProgress"];
  "listAuditEvents": components["schemas"]["AuditEventPage"];
};

export class GeneratedApiClient extends ContractApiClient {
  constructor(options: ContractApiClientOptions = {}) {
    super(options);
  }

  call<Id extends OperationId>(operationId: Id, input: OperationInputMap[Id]): Promise<OperationResponseMap[Id]> {
    return super.execute(operations[operationId], input);
  }
}
