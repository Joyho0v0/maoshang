# Files v2 support surface and live-parent authorization (review-only)

The system decision is incorporated: the canonical Files-owned status/read
href is `/api/v2/files/{fileId}`. The top-level v2 artifact declares:

- `GET /api/v2/files/{fileId}`, operationId `getFileStatusV2`;
- `POST /api/v2/files/{fileId}/download-intents`, operationId
  `createFileDownloadIntentV2`.

Orders consumes these hrefs and schemas but does not own a Files endpoint.
Upload-intent and complete-upload remain v1 operations. A v2 Order may refer
to a stable file UUID created by the v1 upload flow, but v2 status and final
download never fall back to a v1 path. A `FILE_NOT_READY` href remains valid
after an Order create transaction rolls back because the Files object exists
independently of that Order.

## Resolver port

Files transport and Files service do not query Orders tables directly and do
not accept caller-supplied owner/group facts as authority. Files defines this
read-only port; the Orders owner supplies the implementation:

```text
OrderFileAuthorizationResolver.resolve(
  organizationId: UUID,
  orderId: UUID,
  fileId: UUID,
  principal: Principal,
  correlationId: UUID,
) ->
  { orderId, organizationId, ownerUserId, businessGroupId, visible } | NotVisible
```

The resolver reads current Order owner/group and organization facts under a
stable lock order. `file_link.resource_owner_id` and
`file_link.resource_business_group_id` are historical/cache snapshots only;
they never grant access after reassignment.

## Permission and scope matrix

| operation | permission | additional scope rule | invisible result |
| --- | --- | --- | --- |
| v1 upload/complete | `file.create` | existing Files flow | v1 contract |
| create Order with image | `order.create + order.read + file.read` | organization + FILE scope + new ORDER scope; file must be AVAILABLE | hidden 404 / typed FILE_NOT_READY |
| update Order line image | `order.update + order.read + file.read` | organization + FILE scope + current parent ORDER scope | hidden 404 / typed FILE_NOT_READY |
| `GET /api/v2/files/{id}` unlinked | `file.read` | organization + current FILE scope | hidden 404 |
| `GET /api/v2/files/{id}` linked to Order | `file.read + order.read` | organization + current FILE scope + live ORDER scope | hidden 404 |
| `POST /api/v2/files/{id}/download-intents` unlinked | `file.read` | organization + current FILE scope; status AVAILABLE | hidden 404 / 409 FILE_NOT_READY |
| download-intent for Order-linked file | `file.read + order.read` | organization + current FILE scope + live ORDER scope; status AVAILABLE | hidden 404 / 409 FILE_NOT_READY |

`file.create` is never treated as read, link, status, or download authority.
Empty GROUP_SET, cross organization, missing parent, missing link and scope
denial all use hidden `404 RESOURCE_NOT_FOUND`; they do not reveal whether the
file exists. The status GET returns 200 for every visible current file state;
only the download-intent operation returns 409 `FILE_NOT_READY` for a visible
non-AVAILABLE file. That 409 is terminal for the current idempotency identity
and the caller must use a new key after AVAILABLE.

## Transaction and concurrency protocol

When Orders links an image, the same PostgreSQL transaction/client performs:

1. lock the parent Order (`ORDER parent`);
2. lock/read the File object (`FILE`) and current organization/scope;
3. lock/check the unique `file_link` row (`file_link`);
4. validate `file.read`, `order.create` or `order.update`, FILE scope and live
   ORDER scope;
5. write Order/line association and the Files-owned `ORDER/IMAGE` link,
   audit and outbox atomically.

No caller-provided cached owner/group participates in authorization. A failed
validation or database error rolls back Order, Item, link, Audit and Outbox
together. The public Audit resource remains `ORDER` with a controlled lineId
summary; no `ORDER_ITEM` ResourceType or permission is introduced.

For status and download, the resolver runs on every request using the current
parent facts. For a download intent, the signer may be called outside the
database lock/transaction, but immediately before returning the transfer it
must call the resolver again and recheck file version/status, organization,
FILE scope and live ORDER scope. If reassignment wins during signing, no
transfer is returned. This covers reassign-before-read, reassign-during-sign,
cross-scope, empty GROUP_SET and same-lock-order concurrency cases.

The final evidence matrix must include unlinked owner status polling,
linked-image status/download, cross organization, empty GROUP_SET, reassign
before and during signing, not-ready terminal replay, AVAILABLE/new-key retry,
and failed transaction absence of Order/Item/link/Audit/Outbox partial writes.
