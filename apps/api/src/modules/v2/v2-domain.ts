import type { OrderStage } from '../orders/domain/orders.js';

export interface V2OrderStateInput {
  status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  stage: OrderStage;
  permissions: ReadonlySet<string>;
}

export interface V2OrderStateProjection {
  capabilities: readonly ('order.update' | 'order.transition')[];
  allowedTransitions: readonly ({ action: 'ADVANCE'; toStage: OrderStage } | { action: 'CANCEL' })[];
}

const adjacentStage: Partial<Record<OrderStage, OrderStage>> = {
  INITIAL_CONTACT: 'QUOTING',
  QUOTING: 'QUOTE_FOLLOW_UP',
  QUOTE_FOLLOW_UP: 'DEPOSIT_PENDING',
  DEPOSIT_PENDING: 'DEPOSIT_CONFIRMED',
  DEPOSIT_CONFIRMED: 'FULFILLMENT',
  FULFILLMENT: 'FOB_COMPLETED',
  FOB_COMPLETED: 'CLOSED',
};

export function projectOrderV2(input: V2OrderStateInput): V2OrderStateProjection {
  const terminal = input.status === 'CANCELLED' || input.status === 'FULFILLED' || input.stage === 'CLOSED';
  if (terminal) return { capabilities: [], allowedTransitions: [] };

  const capabilities: ('order.update' | 'order.transition')[] = [];
  if (input.status === 'DRAFT' && ['INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP'].includes(input.stage) && input.permissions.has('order.update')) capabilities.push('order.update');
  if (input.permissions.has('order.transition')) capabilities.push('order.transition');

  const allowedTransitions: Array<{ action: 'ADVANCE'; toStage: OrderStage } | { action: 'CANCEL' }> = [];
  if (input.permissions.has('order.transition')) {
    const next = adjacentStage[input.stage];
    if (next !== undefined) allowedTransitions.push({ action: 'ADVANCE', toStage: next });
    allowedTransitions.push({ action: 'CANCEL' });
  }
  return { capabilities, allowedTransitions };
}

export interface V2LinePricingInput {
  itemKind: 'STANDARD' | 'NON_STANDARD';
  orderCurrency: string;
  sourceCurrency: string;
  sourceKind: 'CATALOG_POLICY' | 'MANUAL_QUOTE';
  fxSnapshot: { baseCurrency: string; quoteCurrency: string } | null;
}

export function validateV2LinePricing(input: V2LinePricingInput): void {
  if (input.itemKind === 'NON_STANDARD') {
    if (input.sourceKind !== 'MANUAL_QUOTE') throw new Error('non-standard line requires manual quote');
    if (input.sourceCurrency !== input.orderCurrency) throw new Error('manual quote currency must equal order currency');
    if (input.fxSnapshot !== null) throw new Error('non-standard line cannot carry an FX snapshot');
    return;
  }
  if (input.sourceKind !== 'CATALOG_POLICY') throw new Error('standard line requires catalog policy');
  if (input.sourceCurrency === input.orderCurrency) {
    if (input.fxSnapshot !== null) throw new Error('FX snapshot must be null for same-currency standard line');
    return;
  }
  if (input.fxSnapshot === null) throw new Error('cross-currency standard line requires an FX snapshot');
  if (input.fxSnapshot.baseCurrency !== input.sourceCurrency) throw new Error('FX base currency must equal source currency');
  if (input.fxSnapshot.quoteCurrency !== input.orderCurrency) throw new Error('FX quote currency must equal order currency');
}
