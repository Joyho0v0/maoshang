import { ContractApiClient, type ContractApiClientOptions, type ContractResponse, type GeneratedOperation } from './client.js';
import type { components } from './generated.js';
import { validateIntentPayload } from './runtime-validator.js';

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
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Cache-Control"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
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
            "required": true,
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
          "X-Request-ID",
          "Cache-Control"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
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
          "X-Request-ID",
          "Cache-Control"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "CsrfFailedProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
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
          "X-Request-ID",
          "Cache-Control"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "CommandNotFoundProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[groupId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
          }
        },
        "type": "array"
      },
      "filter[ownerUserId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[skuId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
          }
        },
        "type": "array"
      },
      "filter[locationId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[skuId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
          }
        },
        "type": "array"
      },
      "filter[locationId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[skuId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
          }
        },
        "type": "array"
      },
      "filter[locationId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[skuId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
          }
        },
        "type": "array"
      },
      "filter[locationId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[orderId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
        "schema": "UploadIntent",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
          },
          "Content-Location": {
            "required": false,
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location",
          "Cache-Control"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "413": {
        "schema": "ProblemFileTooLarge",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "415": {
        "schema": "ProblemUnsupportedMediaType",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "200": {
        "schema": "DownloadIntent",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Cache-Control"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "ProblemFileNotReady",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[status]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 64
          }
        },
        "type": "array"
      },
      "filter[assigneeUserId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
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
            "schema": "Href"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag",
          "Location"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "404": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
            "required": true,
            "schema": "Uuid"
          },
          "ETag": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^\"v[1-9][0-9]*\"$"
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
        },
        "requiredHeaders": [
          "X-Request-ID",
          "ETag"
        ]
      },
      "202": {
        "schema": "CommandStatusInProgress",
        "contentType": "application/json",
        "headers": {
          "X-Request-ID": {
            "required": true,
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
          "X-Request-ID",
          "Retry-After",
          "Cache-Control",
          "Content-Location"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "403": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "409": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "428": {
        "schema": "PreconditionRequiredProblem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
      "filter[actorUserId]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/Uuid"
          }
        },
        "type": "array"
      },
      "filter[action]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "type": "string",
            "minLength": 1,
            "maxLength": 128
          }
        },
        "type": "array"
      },
      "filter[resourceType]": {
        "required": false,
        "schema": {
          "type": "array",
          "minItems": 1,
          "maxItems": 20,
          "items": {
            "$ref": "#/components/schemas/ResourceType"
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
            "required": true,
            "schema": "Uuid"
          },
          "Cache-Control": {
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "400": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "401": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "429": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          },
          "Retry-After": {
            "required": true,
            "schema": {
              "type": "string",
              "pattern": "^[1-9][0-9]*$"
            }
          }
        },
        "requiredHeaders": [
          "X-Request-ID",
          "Retry-After"
        ]
      },
      "500": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "502": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
      },
      "503": {
        "schema": "Problem",
        "contentType": "application/problem+json",
        "headers": {
          "X-Request-ID": {
            "required": true,
            "schema": "Uuid"
          }
        },
        "requiredHeaders": [
          "X-Request-ID"
        ]
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
  "listCustomers": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[groupId]"?: string[]; "filter[ownerUserId]"?: string[] } };
  "createCustomer": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["CustomerCreateRequest"] };
  "getCustomer": { pathParams: { "id": string } };
  "updateCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerUpdateRequest"] };
  "submitCustomerApproval": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "approveCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "rejectCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "reassignCustomer": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["CustomerCommandRequest"] };
  "listProducts": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[] } };
  "createProduct": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["ProductCreateRequest"] };
  "getProduct": { pathParams: { "id": string } };
  "updateProduct": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["ProductUpdateRequest"] };
  "listSkus": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[] } };
  "createSku": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["SkuCreateRequest"] };
  "getSku": { pathParams: { "id": string } };
  "updateSku": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["SkuUpdateRequest"] };
  "listOrders": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[] } };
  "createOrder": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["OrderCreateRequest"] };
  "getOrder": { pathParams: { "id": string } };
  "updateOrder": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["OrderUpdateRequest"] };
  "transitionOrder": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["OrderCommandRequest"] };
  "listInventoryBalances": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[skuId]"?: string[]; "filter[locationId]"?: string[] } };
  "listInventoryMovements": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[skuId]"?: string[]; "filter[locationId]"?: string[] } };
  "listInventoryReservations": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[skuId]"?: string[]; "filter[locationId]"?: string[] } };
  "createInventoryReservation": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryReservationCreateRequest"] };
  "getInventory": { pathParams: { "id": string } };
  "releaseInventoryReservation": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["InventoryCommandRequestTyped"] };
  "listInventoryObservations": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[skuId]"?: string[]; "filter[locationId]"?: string[] } };
  "createInventoryObservation": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryObservationCreateRequest"] };
  "getInventoryOperation": { pathParams: { "id": string } };
  "createInitialReceipt": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "createInventoryReceipt": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "createInventoryAdjustment": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "issueInventory": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["InventoryOperationCreateRequest"] };
  "reverseInventoryOperation": { pathParams: { "operationId": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["InventoryCommandRequest"] };
  "listPayments": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[orderId]"?: string[] } };
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
  "listDocuments": { pathParams: { "orderId": string }; query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[] } };
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
  "listTasks": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[status]"?: string[]; "filter[assigneeUserId]"?: string[] } };
  "createTask": { headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string }; body: components["schemas"]["TaskCreateRequest"] };
  "getTask": { pathParams: { "id": string } };
  "completeTask": { pathParams: { "id": string }; headers: Record<string, string> & { "X-CSRF-Token": string; "Idempotency-Key": string; "If-Match": string }; body: components["schemas"]["TaskCommandRequest"] };
  "listAuditEvents": { query?: { "page[after]"?: string; "page[size]"?: number; "sort"?: string; "filter[actorUserId]"?: string[]; "filter[action]"?: string[]; "filter[resourceType]"?: string[] } };
};
export type OperationResponseMap = {
  "getCsrfToken": ContractResponse<components["schemas"]["CsrfToken"], { "X-Request-ID": string; "Cache-Control": "no-store" }, 200>;
  "createSession": ContractResponse<components["schemas"]["Session"], { "X-Request-ID": string; "Cache-Control": "no-store" }, 201>;
  "getCurrentSession": ContractResponse<components["schemas"]["Session"], { "X-Request-ID": string; "Cache-Control": "no-store" }, 200>;
  "deleteCurrentSession": ContractResponse<void, { "X-Request-ID": string }, 204>;
  "getCommandStatus": ContractResponse<components["schemas"]["CommandStatus"], { "X-Request-ID": string; "Retry-After"?: string; "Cache-Control": "no-store"; "Idempotent-Replay"?: "true"; "Content-Location"?: string }, 200>;
  "getUser": ContractResponse<components["schemas"]["User"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "createUser": ContractResponse<components["schemas"]["User"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "updateUserRoleBindings": ContractResponse<components["schemas"]["User"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "updateUserDataScopeGrants": ContractResponse<components["schemas"]["User"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "disableUser": ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listCustomers": ContractResponse<components["schemas"]["CustomerPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "updateCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "submitCustomerApproval": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "approveCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "rejectCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reassignCustomer": ContractResponse<components["schemas"]["Customer"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listProducts": ContractResponse<components["schemas"]["ProductPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createProduct": ContractResponse<components["schemas"]["Product"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getProduct": ContractResponse<components["schemas"]["Product"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "updateProduct": ContractResponse<components["schemas"]["Product"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listSkus": ContractResponse<components["schemas"]["SkuPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createSku": ContractResponse<components["schemas"]["Sku"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getSku": ContractResponse<components["schemas"]["Sku"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "updateSku": ContractResponse<components["schemas"]["Sku"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listOrders": ContractResponse<components["schemas"]["OrderPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "updateOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "transitionOrder": ContractResponse<components["schemas"]["Order"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listInventoryBalances": ContractResponse<components["schemas"]["InventoryBalancePage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "listInventoryMovements": ContractResponse<components["schemas"]["InventoryMovementPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "listInventoryReservations": ContractResponse<components["schemas"]["InventoryReservationPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createInventoryReservation": ContractResponse<components["schemas"]["InventoryReservation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getInventory": ContractResponse<components["schemas"]["InventoryReservation"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "releaseInventoryReservation": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listInventoryObservations": ContractResponse<components["schemas"]["InventoryObservationPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createInventoryObservation": ContractResponse<components["schemas"]["InventoryObservation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getInventoryOperation": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "createInitialReceipt": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createInventoryReceipt": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createInventoryAdjustment": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "issueInventory": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reverseInventoryOperation": ContractResponse<components["schemas"]["InventoryOperation"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listPayments": ContractResponse<components["schemas"]["PaymentPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createPayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getPayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "attachPaymentProof": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "submitPaymentReview": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reviewPayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "reversePayment": ContractResponse<components["schemas"]["Payment"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getFile": ContractResponse<components["schemas"]["File"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "createUploadIntent": ContractResponse<components["schemas"]["UploadIntent"], { "X-Request-ID": string; "ETag": string; "Location": string; "Content-Location"?: string; "Cache-Control": "no-store"; "Idempotent-Replay"?: "true" }, 201>;
  "completeUpload": ContractResponse<components["schemas"]["File"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createDownloadIntent": ContractResponse<components["schemas"]["DownloadIntent"], { "X-Request-ID": string; "Cache-Control": "no-store" }, 200>;
  "listDocuments": ContractResponse<components["schemas"]["DocumentPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "updateDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "createDocumentVersion": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "submitDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "approveDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "rejectDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "finalizeDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "issueDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "voidDocument": ContractResponse<components["schemas"]["Document"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listTasks": ContractResponse<components["schemas"]["TaskPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
  "createTask": ContractResponse<components["schemas"]["Task"], { "X-Request-ID": string; "ETag": string; "Location": string; "Idempotent-Replay"?: "true" }, 201> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "getTask": ContractResponse<components["schemas"]["Task"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200>;
  "completeTask": ContractResponse<components["schemas"]["Task"], { "X-Request-ID": string; "ETag": string; "Idempotent-Replay"?: "true" }, 200> | ContractResponse<components["schemas"]["CommandStatusInProgress"], { "X-Request-ID": string; "Retry-After": string; "Cache-Control": "no-store"; "Content-Location": string }, 202>;
  "listAuditEvents": ContractResponse<components["schemas"]["AuditEventPage"], { "X-Request-ID": string; "Cache-Control"?: string }, 200>;
};

export class GeneratedApiClient extends ContractApiClient {
  constructor(options: ContractApiClientOptions = {}) {
    super(options);
  }

  async call<Id extends OperationId>(operationId: Id, input: OperationInputMap[Id]): Promise<OperationResponseMap[Id]> {
    const response = await super.execute<OperationResponseMap[Id]>(operations[operationId], input);
    if (operationId === 'createUploadIntent' && response.status === 201) {
      const data = response.data as { href?: unknown };
      const headers = response.headers as Record<string, string>;
      if (headers.Location !== data.href) throw new Error('Upload intent Location must equal body href.');
      if (headers['Content-Location'] !== undefined && headers['Content-Location'] !== data.href) throw new Error('Upload intent Content-Location must equal body href.');
    }
    return response as OperationResponseMap[Id];
  }
}

export interface TransferExecutorOptions {
  readonly fetch?: typeof globalThis.fetch;
  readonly now?: () => Date;
}

export type UploadIntent = components['schemas']['UploadIntent'];
export type DownloadIntent = components['schemas']['DownloadIntent'];
export type TransferPayload = Blob | Uint8Array | ArrayBuffer | string;

export class TransferExecutor {
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => Date;

  constructor(options: TransferExecutorOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.now = options.now ?? (() => new Date());
  }

  async upload(intent: UploadIntent, payload: TransferPayload): Promise<Response> {
    assertTransferIntent(intent, this.now);
    const transfer = intent.transfer;
    if (transfer.kind === 'HTTP_PUT') {
      return await this.fetchImpl(transfer.locator, {
        method: 'PUT',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: transfer.headers,
        body: payload,
      });
    }
    const form = new FormData();
    for (const [name, value] of Object.entries(transfer.formFields)) form.append(name, value);
    form.append(transfer.fileField, payload instanceof Blob ? payload : new Blob([payload as never]));
    return await this.fetchImpl(transfer.locator, {
      method: 'POST',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: transfer.headers,
      body: form,
    });
  }

  async download(intent: DownloadIntent): Promise<Response> {
    assertTransferIntent(intent, this.now);
    return await this.fetchImpl(intent.transfer.locator, {
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: intent.transfer.headers,
    });
  }
}

function assertTransferIntent(intent: UploadIntent | DownloadIntent, now: () => Date): void {
  const transfer = intent.transfer as { kind?: unknown; expiresAt?: unknown; headers?: Record<string, string> };
  if (typeof transfer.expiresAt !== 'string' || !Number.isFinite(Date.parse(transfer.expiresAt)) || Date.parse(transfer.expiresAt) <= now().getTime()) throw new Error('Transfer descriptor expired.');
  const forbidden = new Set(['cookie', 'authorization', 'x-csrf-token', 'idempotency-key', 'if-match']);
  if (transfer.kind === 'HTTP_MULTIPART_POST') forbidden.add('content-type');
  if (transfer.headers !== undefined && Object.keys(transfer.headers).some((name) => forbidden.has(name.toLowerCase()))) throw new Error('Transfer descriptor contains a forbidden application header.');
  if (!validateIntentPayload(intent, now)) throw new Error('Invalid transfer intent descriptor.');
}
