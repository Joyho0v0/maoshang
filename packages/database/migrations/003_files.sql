CREATE SCHEMA IF NOT EXISTS files;

CREATE TABLE IF NOT EXISTS files.file_object (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES org.organization(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL,
  business_group_id uuid,
  object_key text NOT NULL CHECK (length(object_key) BETWEEN 32 AND 512),
  original_name text NOT NULL CHECK (length(original_name) BETWEEN 1 AND 256),
  declared_content_type text NOT NULL CHECK (length(declared_content_type) BETWEEN 1 AND 256),
  detected_content_type text CHECK (detected_content_type IS NULL OR length(detected_content_type) BETWEEN 1 AND 256),
  declared_size_bytes bigint NOT NULL CHECK (declared_size_bytes > 0),
  actual_size_bytes bigint CHECK (actual_size_bytes IS NULL OR actual_size_bytes > 0),
  declared_checksum text CHECK (declared_checksum IS NULL OR length(declared_checksum) BETWEEN 1 AND 256),
  actual_checksum text CHECK (actual_checksum IS NULL OR length(actual_checksum) BETWEEN 1 AND 256),
  status text NOT NULL DEFAULT 'PENDING_UPLOAD' CHECK (status IN ('PENDING_UPLOAD', 'UPLOADED', 'SCANNING', 'AVAILABLE', 'REJECTED', 'QUARANTINED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason text CHECK (rejection_reason IS NULL OR length(rejection_reason) BETWEEN 1 AND 128),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, object_key),
  FOREIGN KEY (organization_id, created_by) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS file_object_organization_status_idx ON files.file_object (organization_id, status, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS file_object_created_by_idx ON files.file_object (organization_id, created_by, updated_at DESC, id);
CREATE INDEX IF NOT EXISTS file_object_business_group_idx ON files.file_object (organization_id, business_group_id, updated_at DESC, id) WHERE business_group_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS files.upload_intent (
  file_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  object_key text NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'EXPIRED', 'REJECTED')),
  consumed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, object_key),
  FOREIGN KEY (organization_id, file_id) REFERENCES files.file_object (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, created_by) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  CHECK ((status = 'ACTIVE' AND consumed_at IS NULL) OR (status <> 'ACTIVE' AND consumed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS upload_intent_expiry_idx ON files.upload_intent (expires_at, file_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS upload_intent_created_by_idx ON files.upload_intent (organization_id, created_by, created_at DESC, file_id);

CREATE TABLE IF NOT EXISTS files.file_link (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  file_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 64),
  resource_id uuid NOT NULL,
  purpose text NOT NULL CHECK (length(purpose) BETWEEN 1 AND 128),
  linked_by uuid NOT NULL,
  resource_owner_id uuid,
  resource_business_group_id uuid,
  linked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, file_id, resource_type, resource_id, purpose),
  FOREIGN KEY (organization_id, file_id) REFERENCES files.file_object (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, linked_by) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, resource_owner_id) REFERENCES iam.user_account (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, resource_business_group_id) REFERENCES org.business_group (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS file_link_resource_idx ON files.file_link (organization_id, resource_type, resource_id, file_id);
CREATE INDEX IF NOT EXISTS file_link_file_idx ON files.file_link (organization_id, file_id, linked_at DESC, id);

CREATE TABLE IF NOT EXISTS files.scan_result (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  file_id uuid NOT NULL,
  event_id uuid NOT NULL,
  engine text NOT NULL CHECK (length(engine) BETWEEN 1 AND 128),
  engine_version text NOT NULL CHECK (length(engine_version) BETWEEN 1 AND 128),
  result text NOT NULL CHECK (result IN ('CLEAN', 'MALICIOUS', 'UNKNOWN', 'ERROR')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_id, event_id),
  FOREIGN KEY (organization_id, file_id) REFERENCES files.file_object (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS scan_result_file_idx ON files.scan_result (organization_id, file_id, scanned_at DESC, id);

CREATE TABLE IF NOT EXISTS integration.inbox_consumption (
  consumer_name text NOT NULL CHECK (length(consumer_name) BETWEEN 1 AND 128),
  event_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  result_hash bytea CHECK (result_hash IS NULL OR octet_length(result_hash) = 32),
  PRIMARY KEY (consumer_name, event_id)
);
CREATE INDEX IF NOT EXISTS inbox_consumption_event_idx ON integration.inbox_consumption (event_id, consumer_name);

INSERT INTO iam.permission (id, code, description, is_system) VALUES
  ('00000000-0000-4000-8000-000000002023', 'file.read', 'Read file metadata and linked files', true),
  ('00000000-0000-4000-8000-000000002024', 'file.create', 'Create and complete file uploads', true)
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_id)
SELECT role.id, permission.id
FROM iam.role
CROSS JOIN iam.permission
WHERE role.code = 'SUPER_ADMIN'
  AND role.is_system
  AND permission.code IN ('file.read', 'file.create')
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_id)
SELECT role.id, permission.id
FROM iam.role
JOIN iam.permission ON permission.code IN ('file.read', 'file.create')
WHERE role.code IN ('GROUP_LEADER', 'SALES')
  AND role.is_system
ON CONFLICT DO NOTHING;
