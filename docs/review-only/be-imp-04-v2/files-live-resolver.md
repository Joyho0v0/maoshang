# R7 Files live-parent authorization (review-only)

The current candidate chooses the Order-scoped status resource:
`GET /api/v2/orders/{orderId}/files/{fileId}/status`. This is a candidate only;
the Chief Web Systems Architect must decide between this resource and a
Files-owned `/api/v2/files/{fileId}` alias before promotion. No Files endpoint
is changed by this package.

The resolver is an application-service boundary owned by Files and called with
`organizationId`, `orderId`, `fileId`, the actor principal and a correlation
ID. It performs one transaction at `READ COMMITTED`:

```sql
SELECT fo.id, fo.status, fo.version, oh.id AS order_id,
       oh.organization_id, oh.owner_user_id, oh.business_group_id
FROM files.file_object fo
JOIN files.file_link fl
  ON fl.organization_id = fo.organization_id AND fl.file_id = fo.id
JOIN orders.order_header oh
  ON oh.organization_id = fl.organization_id
 AND fl.resource_type = 'ORDER' AND fl.resource_id = oh.id
WHERE fo.organization_id = :organization_id
  AND fo.id = :file_id
  AND oh.id = :order_id
  AND fl.purpose = 'IMAGE'
FOR SHARE OF fo, oh;
```

The query does not use `file_link.resource_owner_id` or
`resource_business_group_id` as authority. Those columns are an audit/cache
snapshot only. The resolver then applies `file.read` and `order.read`, the
current Order owner/group scope, and the organization boundary. Missing
parent, missing link, cross-organization and out-of-scope cases all return
hidden `404 RESOURCE_NOT_FOUND`. A visible file whose current status is not
`AVAILABLE` returns the typed `409 FILE_NOT_READY` with the exact
Order-scoped `statusHref`; it does not expose object key, signed URL or scan
details.

Order reassign and file read/download use the same lock order `(organization,
order_id)` then `(organization,file_id)`. A reassign updates the Order and
its audit/history in one transaction; a concurrent resolver either sees the
old complete scope or the new complete scope, never the cached link scope.
Creating an image association first validates `AVAILABLE`, parent scope and
link uniqueness, then writes `order_item.image_file_id` and the Files-owned
`ORDER/IMAGE` link in one PostgreSQL transaction. Any dependency/program
failure rolls back both; a not-ready result is deterministic terminal 409
replay. The public Audit resource remains `ORDER`, with a controlled `lineId`
summary; no `ORDER_ITEM` permission or ResourceType is introduced.

The response matrix must be extended by the final owner decision if Files
selects the alias. Until then, this candidate's regex and operation keep every
href under `/api/v2/orders/.../status` and never point at an undeclared alias.
