DROP TABLE IF EXISTS integration.inbox_consumption;
DROP TABLE IF EXISTS files.scan_result;
DROP TABLE IF EXISTS files.file_link;
DROP TABLE IF EXISTS files.upload_intent;
DROP TABLE IF EXISTS files.file_object;

DELETE FROM iam.role_permission
 WHERE permission_id IN (SELECT id FROM iam.permission WHERE code IN ('file.read', 'file.create'));
DELETE FROM iam.permission WHERE code IN ('file.read', 'file.create');
