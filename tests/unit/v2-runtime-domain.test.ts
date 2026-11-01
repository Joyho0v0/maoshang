import { describe, expect, it } from 'vitest';
import { projectOrderV2, type V2OrderStateInput, validateV2LinePricing } from '../../apps/api/src/modules/v2/v2-domain.js';

const baseOrder = (overrides: Partial<V2OrderStateInput> = {}): V2OrderStateInput => ({
  status: 'DRAFT',
  stage: 'INITIAL_CONTACT',
  permissions: new Set(['order.update', 'order.transition']),
  ...overrides,
});

describe('Catalog + Orders v2 runtime domain', () => {
  it('projects update-only, transition-only, full, read-only and terminal capabilities from state', () => {
    expect(projectOrderV2(baseOrder({ permissions: new Set(['order.update']) })).capabilities).toEqual(['order.update']);
    expect(projectOrderV2(baseOrder({ permissions: new Set(['order.transition']) })).capabilities).toEqual(['order.transition']);
    expect(projectOrderV2(baseOrder()).capabilities).toEqual(['order.update', 'order.transition']);
    expect(projectOrderV2(baseOrder({ permissions: new Set() })).allowedTransitions).toEqual([]);
    expect(projectOrderV2(baseOrder({ status: 'FULFILLED', stage: 'CLOSED' })).capabilities).toEqual([]);
    expect(projectOrderV2(baseOrder({ status: 'FULFILLED', stage: 'CLOSED' })).allowedTransitions).toEqual([]);
    expect(projectOrderV2(baseOrder({ status: 'CANCELLED', stage: 'QUOTING' })).allowedTransitions).toEqual([]);
  });

  it('keeps adjacent transition order stable while allowing capability order to vary', () => {
    const result = projectOrderV2(baseOrder({ stage: 'QUOTING' }));
    expect(result.allowedTransitions).toEqual([{ action: 'ADVANCE', toStage: 'QUOTE_FOLLOW_UP' }, { action: 'CANCEL' }]);
    expect(result.capabilities).toEqual(['order.update', 'order.transition']);
  });

  it('enforces mutually exclusive standard FX and manual quote branches', () => {
    expect(() => validateV2LinePricing({
      itemKind: 'STANDARD', orderCurrency: 'USD', sourceCurrency: 'USD', sourceKind: 'CATALOG_POLICY', fxSnapshot: null,
    })).not.toThrow();
    expect(() => validateV2LinePricing({
      itemKind: 'STANDARD', orderCurrency: 'EUR', sourceCurrency: 'USD', sourceKind: 'CATALOG_POLICY',
      fxSnapshot: { baseCurrency: 'USD', quoteCurrency: 'EUR' },
    })).not.toThrow();
    expect(() => validateV2LinePricing({
      itemKind: 'STANDARD', orderCurrency: 'USD', sourceCurrency: 'USD', sourceKind: 'CATALOG_POLICY',
      fxSnapshot: { baseCurrency: 'USD', quoteCurrency: 'USD' },
    })).toThrow('FX snapshot must be null');
    expect(() => validateV2LinePricing({
      itemKind: 'NON_STANDARD', orderCurrency: 'USD', sourceCurrency: 'EUR', sourceKind: 'MANUAL_QUOTE', fxSnapshot: null,
    })).toThrow('manual quote currency');
  });
});
