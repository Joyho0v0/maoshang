-- This down script is intentionally destructive and is limited to isolated
-- development/test rehearsals. Production uses additive forward-fix migrations.
DO $$
BEGIN
  IF current_setting('app.allow_identity_down', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'identity down migration is disabled; use an additive production forward-fix';
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS user_role_binding_organization_guard ON iam.user_role_binding;
DROP FUNCTION IF EXISTS iam.assert_role_binding_organization();
DROP TRIGGER IF EXISTS user_account_core_mirror ON iam.user_account;
DROP FUNCTION IF EXISTS iam.sync_core_user_account();
DROP TRIGGER IF EXISTS organization_core_mirror ON org.organization;
DROP FUNCTION IF EXISTS org.sync_core_organization();
DROP TRIGGER IF EXISTS core_organization_identity_mirror ON core.organization;
DROP FUNCTION IF EXISTS core.sync_identity_organization();
DROP TRIGGER IF EXISTS authentication_event_immutable ON audit.authentication_event;
DROP FUNCTION IF EXISTS audit.reject_authentication_mutation();
DROP TABLE IF EXISTS audit.authentication_event;
DROP TABLE IF EXISTS integration.login_attempt_bucket;
DROP TRIGGER IF EXISTS audit_event_immutable ON audit.audit_event;
DROP FUNCTION IF EXISTS audit.reject_audit_mutation();
DROP TABLE IF EXISTS audit.audit_event;
DROP TABLE IF EXISTS integration.identity_outbox_event;
DROP TABLE IF EXISTS iam.data_scope_group;
DROP TABLE IF EXISTS iam.user_data_scope;
DROP TABLE IF EXISTS iam.user_role_binding;
DROP TABLE IF EXISTS iam.role_permission;
DROP TABLE IF EXISTS iam.permission;
DROP TABLE IF EXISTS iam.role;
DROP TABLE IF EXISTS iam.session;
DROP TABLE IF EXISTS org.position_history;
DROP TABLE IF EXISTS org.membership;
DROP TABLE IF EXISTS iam.user_account;
DROP TABLE IF EXISTS org.business_group;
DROP TABLE IF EXISTS org.organization;
