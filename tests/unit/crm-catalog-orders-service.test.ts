import { describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import type { AuthorizationPrincipal } from '../../apps/api/src/modules/identity/domain/authz.js';
import { CrmService, type CrmStore } from '../../apps/api/src/modules/crm/application/crm.service.js';
import { CatalogService, type CatalogStore } from '../../apps/api/src/modules/catalog/application/catalog.service.js';
import { calculateOrderTotal } from '../../apps/api/src/modules/orders/application/orders.service.js';

const orgId = '00000000-0000-4000-8000-000000000001';
const actorId = '00000000-0000-4000-8000-000000000002';
const groupId = '00000000-0000-4000-8000-000000000003';
const attackerId = '00000000-0000-4000-8000-000000000004';

function principal(overrides: Partial<AuthorizationPrincipal> = {}): AuthorizationPrincipal {
  return {
    userId: actorId,
    organizationId: orgId,
    status: 'ACTIVE',
    permissions: new Set(['customer.create', 'customer.read', 'catalog.read', 'catalog.write']),
    scopes: new Map([
      ['CUSTOMER', { resourceType: 'CUSTOMER', scopeType: 'OWN', groupIds: [] }],
      ['ORGANIZATION', { resourceType: 'ORGANIZATION', scopeType: 'ALL_ORG', groupIds: [] }],
    ]),
    authzVersion: 1,
    sessionEpoch: 1,
    ...overrides,
  };
}

describe('CRM/Catalog/Orders application services', () => {
  it('derives customer owner and group from the authenticated session', async () => {
    const store = {
      resolvePrimaryBusinessGroup: vi.fn().mockResolvedValue(groupId),
      insertCustomer: vi.fn().mockResolvedValue({ id: 'customer-1', ownerUserId: actorId, businessGroupId: groupId }),
    } as unknown as CrmStore;
    const service = new CrmService(store);

    await service.createCustomer(principal(), { name: 'Acme', ownerUserId: attackerId, businessGroupId: attackerId, contacts: [] }, '00000000-0000-4000-8000-000000000005', {} as PoolClient);

    expect(store.insertCustomer).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ ownerUserId: actorId, businessGroupId: groupId }));
    expect(store.insertCustomer).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ ownerUserId: attackerId, businessGroupId: attackerId }));
  });

  it('keeps catalog writes behind the catalog.write permission', async () => {
    const store = { insertProduct: vi.fn().mockResolvedValue({ id: 'product-1' }) } as unknown as CatalogStore;
    const service = new CatalogService(store);

    await expect(service.createProduct(principal({ permissions: new Set(['catalog.read']) }), { name: 'Widget', productCode: 'W-1', unit: 'PCS' }, 'request-1', {} as PoolClient)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
    expect(store.insertProduct).not.toHaveBeenCalled();
  });

  it('sums order line amounts using DecimalString arithmetic', () => {
    expect(calculateOrderTotal([
      { skuId: 'sku-1', quantity: '0.10', unitPrice: '0.20' },
      { skuId: 'sku-2', quantity: '2', unitPrice: '3.50' },
    ])).toBe('7.0200');
  });
});
