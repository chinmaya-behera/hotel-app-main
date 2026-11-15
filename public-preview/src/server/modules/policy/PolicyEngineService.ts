export const POLICY_ACTIONS = {
  readAssignedTask: 'task.read_assigned',
  approveFinancialException: 'financial.approve',
  executeFinancialException: 'financial.execute',
} as const;

const scopeFields = ['departmentId', 'outletId', 'floorId', 'shiftId'] as const;

type ScopeField = typeof scopeFields[number];
type ScopeDimensions = Partial<Record<ScopeField, string | null>>;

export type PolicyActor = {
  membershipId: string;
  propertyId: string;
};

export type FinancialAuthorization = {
  // Keep PostgreSQL numeric values as decimal strings.
  amount: string;
  currency: string;
  transactionType: string;
  requestedByMembershipId: string;
  approvedByMembershipId?: string;
};

export type PolicyResource = ScopeDimensions & {
  propertyId: string;
  resourceType: string;
  resourceId?: string;
  assigneeMembershipId?: string;
  financial?: FinancialAuthorization;
};

export type PolicyGrant = {
  id: string;
  scope: ScopeDimensions & { propertyId: string };
  maximumAmount: string | null;
};

export interface PolicyGrantRepository {
  // Return only current grants for the active actor and exact permission, each with its own scope and cap.
  findActiveGrants(
    actor: PolicyActor,
    action: string,
    financial?: Pick<FinancialAuthorization, 'currency' | 'transactionType'>,
  ): Promise<PolicyGrant[]>;
}

export type PolicyDecision =
  | { authorized: true; grantId: string }
  | { authorized: false; reason: 'INVALID_CONTEXT' | 'PROPERTY_MISMATCH' | 'ASSIGNMENT_REQUIRED' |
      'SEPARATION_OF_DUTIES' | 'NO_MATCHING_GRANT' | 'FINANCIAL_LIMIT_EXCEEDED' };

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}

function units(amount: unknown): bigint | null {
  if (typeof amount !== 'string' || !/^\d{1,14}(?:\.\d{1,4})?$/.test(amount)) return null;
  const [whole, fraction = ''] = amount.split('.');
  const minorUnits = BigInt(whole + fraction.padEnd(4, '0'));
  return minorUnits > 0n ? minorUnits : null;
}

function covers(scope: PolicyGrant['scope'], resource: PolicyResource) {
  return scope.propertyId === resource.propertyId &&
    scopeFields.every((field) => scope[field] == null || scope[field] === resource[field]);
}

/**
 * Pass an authenticated membership and resource context resolved by the server.
 * Omitted resource dimensions cannot satisfy a grant restricted to those dimensions.
 * For mutations, authorize the current record inside the transaction that changes it.
 */
export class PolicyEngineService {
  private readonly grants: PolicyGrantRepository;

  constructor(grants: PolicyGrantRepository) {
    this.grants = grants;
  }

  async authorize(actor: PolicyActor, action: string, resource: PolicyResource): Promise<PolicyDecision> {
    if (!isId(actor.membershipId) || !isId(actor.propertyId) || !isId(action) ||
        !isId(resource.propertyId) || !isId(resource.resourceType) ||
        (resource.resourceId !== undefined && !isId(resource.resourceId)) ||
        scopeFields.some((field) => resource[field] != null && !isId(resource[field])) ||
        (resource.outletId != null && resource.departmentId == null)) {
      return { authorized: false, reason: 'INVALID_CONTEXT' };
    }
    if (actor.propertyId !== resource.propertyId) {
      return { authorized: false, reason: 'PROPERTY_MISMATCH' };
    }
    if (action === POLICY_ACTIONS.readAssignedTask) {
      if (resource.resourceType !== 'department_task' || !resource.resourceId) {
        return { authorized: false, reason: 'INVALID_CONTEXT' };
      }
      if (resource.assigneeMembershipId !== actor.membershipId) {
        return { authorized: false, reason: 'ASSIGNMENT_REQUIRED' };
      }
    }

    const financial = resource.financial;
    const execution = action === POLICY_ACTIONS.executeFinancialException;
    const approval = action === POLICY_ACTIONS.approveFinancialException;
    const amount = financial ? units(financial.amount) : null;
    if ((approval || execution) &&
        (resource.resourceType !== 'financial_exception' || !financial || !resource.resourceId)) {
      return { authorized: false, reason: 'INVALID_CONTEXT' };
    }
    if (financial && (amount === null || !/^[A-Z]{3}$/.test(financial.currency) ||
        !isId(financial.transactionType) || !isId(financial.requestedByMembershipId) ||
        (execution && !isId(financial.approvedByMembershipId)))) {
      return { authorized: false, reason: 'INVALID_CONTEXT' };
    }
    if (financial && (
      ((approval || execution) && financial.requestedByMembershipId === actor.membershipId) ||
      (execution && (financial.approvedByMembershipId === actor.membershipId ||
        financial.approvedByMembershipId === financial.requestedByMembershipId))
    )) {
      return { authorized: false, reason: 'SEPARATION_OF_DUTIES' };
    }

    const candidates = await this.grants.findActiveGrants(actor, action, financial);
    let scoped = false;
    for (const grant of candidates) {
      if (!covers(grant.scope, resource)) continue;
      scoped = true;
      const limit = amount === null ? null : units(grant.maximumAmount);
      if (amount === null || (limit !== null && amount <= limit)) {
        return { authorized: true, grantId: grant.id };
      }
    }

    return { authorized: false, reason: scoped ? 'FINANCIAL_LIMIT_EXCEEDED' : 'NO_MATCHING_GRANT' };
  }
}
