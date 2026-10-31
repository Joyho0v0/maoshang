import { describe, expect, it } from 'vitest';
import { assertApprovalTransition, customerCapabilities } from '../../apps/api/src/modules/crm/domain/crm.js';
import { addDecimalStrings, multiplyDecimalStrings, parseDecimalString } from '../../apps/api/src/modules/catalog/domain/catalog.js';
import { assertOrderStageTransition, ORDER_STAGES } from '../../apps/api/src/modules/orders/domain/orders.js';

describe('CRM, Catalog and Orders domain invariants', () => {
  it('calculates DecimalString values without binary floating point', () => {
    expect(addDecimalStrings('0.10', '0.20')).toBe('0.30');
    expect(multiplyDecimalStrings('12.3456', '2')).toBe('24.6912');
    expect(() => parseDecimalString('1e-3')).toThrow();
  });

  it('keeps customer approval duties separated and exposes only valid capabilities', () => {
    expect(() => assertApprovalTransition({ status: 'PENDING_APPROVAL', action: 'APPROVE', submitterUserId: 'same', actorUserId: 'same' })).toThrow('submitter-approver-separation');
    expect(assertApprovalTransition({ status: 'PENDING_APPROVAL', action: 'REJECT', submitterUserId: 'seller', actorUserId: 'manager', reason: 'Incomplete address' })).toEqual({ nextStatus: 'DRAFT', outcome: 'REJECTED' });
    expect(() => assertApprovalTransition({ status: 'DRAFT', action: 'SUBMIT_APPROVAL', actorUserId: 'seller', contacts: [{ name: 'Primary', countryCode: 'CN' }] })).toThrow('CUSTOMER_APPROVAL_CONTACTS_INCOMPLETE');
    expect(assertApprovalTransition({ status: 'DRAFT', action: 'SUBMIT_APPROVAL', actorUserId: 'seller', contacts: [{ name: 'Primary', countryCode: 'CN', timezone: 'Asia/Shanghai' }] })).toEqual({ nextStatus: 'PENDING_APPROVAL', outcome: 'SUBMITTED' });
    expect(customerCapabilities({ status: 'DRAFT', canApprove: true, canUpdate: true })).toContain('customer.submit-approval');
    expect(customerCapabilities({ status: 'APPROVED', canApprove: true, canUpdate: true })).not.toContain('customer.submit-approval');
    expect(customerCapabilities({ status: 'PENDING_APPROVAL', canApprove: true, canUpdate: false, isCurrentAttemptSubmitter: true })).toEqual([]);
    expect(customerCapabilities({ status: 'PENDING_APPROVAL', canApprove: true, canUpdate: false, isCurrentAttemptSubmitter: false })).toEqual(['customer.approve', 'customer.reject']);
  });

  it('allows only adjacent order stage transitions and no transition from terminal stages', () => {
    expect(ORDER_STAGES).toEqual(['INITIAL_CONTACT', 'QUOTING', 'QUOTE_FOLLOW_UP', 'DEPOSIT_PENDING', 'DEPOSIT_CONFIRMED', 'FULFILLMENT', 'FOB_COMPLETED', 'CLOSED']);
    expect(() => assertOrderStageTransition('INITIAL_CONTACT', 'DEPOSIT_PENDING')).toThrow('INVALID_TRANSITION');
    expect(assertOrderStageTransition('QUOTING', 'QUOTE_FOLLOW_UP')).toBe(true);
    expect(() => assertOrderStageTransition('CLOSED', 'INITIAL_CONTACT')).toThrow('INVALID_TRANSITION');
  });
});
