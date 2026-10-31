export const ORDER_STAGES = ['INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP', 'DEPOSIT_PENDING', 'DEPOSIT_CONFIRMED', 'FULFILLMENT', 'FOB_COMPLETED', 'CLOSED'] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';

export const ORDER_STAGE_TRANSITIONS: Readonly<Record<OrderStage, readonly OrderStage[]>> = {
  INITIAL_CONTACT: ['QUOTING'],
  QUOTING: ['QUOTE_FOLLOW_UP'],
  QUOTE_FOLLOW_UP: ['DEPOSIT_PENDING'],
  DEPOSIT_PENDING: ['DEPOSIT_CONFIRMED'],
  DEPOSIT_CONFIRMED: ['FULFILLMENT'],
  FULFILLMENT: ['FOB_COMPLETED'],
  FOB_COMPLETED: ['CLOSED'],
  CLOSED: [],
};

export function assertOrderStageTransition(current: OrderStage, next: OrderStage): true {
  if (!ORDER_STAGES.includes(current) || !ORDER_STAGES.includes(next) || !ORDER_STAGE_TRANSITIONS[current].includes(next)) throw new Error('INVALID_TRANSITION');
  return true;
}

export function statusForStage(stage: OrderStage): OrderStatus {
  if (stage === 'INITIAL_CONTACT' || stage === 'QUOTING' || stage === 'QUOTE_FOLLOW_UP') return 'DRAFT';
  if (stage === 'CLOSED') return 'FULFILLED';
  return 'CONFIRMED';
}

export function canCancel(stage: OrderStage): boolean {
  return stage !== 'CLOSED';
}
