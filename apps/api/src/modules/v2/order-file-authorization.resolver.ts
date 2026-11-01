import type { Pool, PoolClient, QueryResultRow } from 'pg';
import type { OrderFileAuthorizationResolver } from '../files/application/files.service.js';

interface OrderOwnerRow extends QueryResultRow {
  owner_user_id: string;
  business_group_id: string | null;
}

export class PostgresOrderFileAuthorizationResolver implements OrderFileAuthorizationResolver {
  constructor(private readonly pool: Pool) {}

  async resolve(organizationId: string, orderId: string, executor?: { query: PoolClient['query'] }): Promise<{ ownerUserId: string; businessGroupId: string | null } | undefined> {
    const result = await (executor ?? this.pool).query<OrderOwnerRow>(
      'SELECT owner_user_id,business_group_id FROM orders.order_header WHERE organization_id=$1 AND id=$2',
      [organizationId, orderId],
    );
    const row = result.rows[0];
    return row === undefined ? undefined : { ownerUserId: row.owner_user_id, businessGroupId: row.business_group_id };
  }
}
