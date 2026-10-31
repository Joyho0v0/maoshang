import { assertDutiesSeparated, type AuthorizationPrincipal } from '../../identity/domain/authz.js';

export type CustomerStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'INACTIVE';
export type ApprovalAction = 'SUBMIT_APPROVAL' | 'APPROVE' | 'REJECT';

export interface ApprovalTransitionInput {
  status: CustomerStatus;
  action: ApprovalAction;
  submitterUserId?: string;
  actorUserId: string;
  reason?: string;
}

export function assertApprovalTransition(input: ApprovalTransitionInput): { nextStatus: CustomerStatus; outcome?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' } {
  if (input.action === 'SUBMIT_APPROVAL') {
    if (input.status !== 'DRAFT') throw new Error('CUSTOMER_APPROVAL_STATE_CONFLICT');
    return { nextStatus: 'PENDING_APPROVAL', outcome: 'SUBMITTED' };
  }
  if (input.status !== 'PENDING_APPROVAL') throw new Error('CUSTOMER_APPROVAL_STATE_CONFLICT');
  if (input.submitterUserId !== undefined) assertDutiesSeparated(input.submitterUserId, input.actorUserId);
  if (input.action === 'REJECT') {
    if (input.reason === undefined || input.reason.trim().length === 0) throw new Error('REJECTION_REASON_REQUIRED');
    return { nextStatus: 'DRAFT', outcome: 'REJECTED' };
  }
  return { nextStatus: 'APPROVED', outcome: 'APPROVED' };
}

export function customerCapabilities(input: { status: CustomerStatus; canApprove: boolean; canUpdate: boolean }): string[] {
  const capabilities: string[] = [];
  if (input.canUpdate && input.status === 'DRAFT') capabilities.push('customer.update', 'customer.submit-approval');
  if (input.canApprove && input.status === 'PENDING_APPROVAL') capabilities.push('customer.approve', 'customer.reject');
  return capabilities;
}

export interface CustomerVisibility {
  organizationId: string;
  ownerUserId?: string;
  businessGroupId?: string;
}

export function canSeeCustomer(principal: AuthorizationPrincipal, customer: CustomerVisibility): boolean {
  const scope = principal.scopes.get('CUSTOMER');
  if (scope === undefined || customer.organizationId !== principal.organizationId || principal.status !== 'ACTIVE' || !principal.permissions.has('customer.read')) return false;
  if (scope.scopeType === 'ALL_ORG') return true;
  if (scope.scopeType === 'OWN') return customer.ownerUserId === principal.userId;
  return scope.groupIds.length > 0 && customer.businessGroupId !== undefined && scope.groupIds.includes(customer.businessGroupId);
}
