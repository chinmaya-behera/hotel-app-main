import { and, eq, gt, isNull, lte, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  financialLimitTable, grantScopeTable, profileGrantTable,
  profilePermissionTable, staffAccountTable, staffMembershipTable,
} from '../../db/schema/01_identity.ts';
import type { PolicyGrantRepository } from './PolicyEngineService.ts';

export class DrizzlePolicyGrantRepository implements PolicyGrantRepository {
  private readonly database: Pick<PostgresJsDatabase, 'select'>;

  constructor(database: Pick<PostgresJsDatabase, 'select'>) {
    this.database = database;
  }

  readonly findActiveGrants: PolicyGrantRepository['findActiveGrants'] = async (actor, action, financial) => {
    const now = sql`statement_timestamp()`;
    const rows = await this.database.select({
      id: profileGrantTable.id,
      scope: {
        propertyId: grantScopeTable.propertyId,
        departmentId: grantScopeTable.departmentId,
        outletId: grantScopeTable.outletId,
        floorId: grantScopeTable.floorId,
        shiftId: grantScopeTable.shiftId,
      },
      maximumAmount: financial ? financialLimitTable.maximumAmount : sql<null>`null`,
    }).from(staffMembershipTable)
      .innerJoin(staffAccountTable, eq(staffAccountTable.id, staffMembershipTable.staffAccountId))
      .innerJoin(profileGrantTable, and(
        eq(profileGrantTable.membershipId, staffMembershipTable.id),
        eq(profileGrantTable.propertyId, staffMembershipTable.propertyId),
      ))
      .innerJoin(profilePermissionTable, and(
        eq(profilePermissionTable.profileId, profileGrantTable.profileId),
        eq(profilePermissionTable.permissionCode, action),
      ))
      // An incomplete grant without a scope row gives no access.
      .innerJoin(grantScopeTable, and(
        eq(grantScopeTable.profileGrantId, profileGrantTable.id),
        eq(grantScopeTable.propertyId, profileGrantTable.propertyId),
      ))
      .leftJoin(financialLimitTable, financial ? and(
        eq(financialLimitTable.propertyId, profileGrantTable.propertyId),
        eq(financialLimitTable.profileGrantId, profileGrantTable.id),
        eq(financialLimitTable.profileId, profileGrantTable.profileId),
        eq(financialLimitTable.actionCode, action),
        eq(financialLimitTable.currency, financial.currency),
        eq(financialLimitTable.transactionType, financial.transactionType),
      ) : sql`false`)
      .where(and(
        eq(staffMembershipTable.id, actor.membershipId),
        eq(staffMembershipTable.propertyId, actor.propertyId),
        eq(staffMembershipTable.status, 'active'),
        eq(staffAccountTable.status, 'active'),
        lte(profileGrantTable.validFrom, now),
        or(isNull(profileGrantTable.expiresAt), gt(profileGrantTable.expiresAt, now)),
        isNull(profileGrantTable.revokedAt),
      )).orderBy(profileGrantTable.id);
    return rows;
  };
}
