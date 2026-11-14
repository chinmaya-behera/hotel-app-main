import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, exists, gt, isNull, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { departmentTable, staffAccountTable, staffMembershipTable, staffSessionTable } from '../db/schema/index.ts';
import { ACCESS_SECONDS, REFRESH_SECONDS, type StaffAuthConfig } from './config.ts';

export const randomToken = () => randomBytes(32).toString('base64url');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function staffIdentity() {
  return db.select({
    staffId: staffAccountTable.employeeIdentifier,
    name: staffAccountTable.fullName,
    role: staffAccountTable.role,
    membershipId: staffMembershipTable.id,
    propertyId: staffMembershipTable.propertyId,
    department: departmentTable.name,
  }).from(staffMembershipTable)
    .innerJoin(staffAccountTable, eq(staffAccountTable.id, staffMembershipTable.staffAccountId))
    .leftJoin(departmentTable, and(
      eq(departmentTable.id, staffMembershipTable.departmentId),
      eq(departmentTable.propertyId, staffMembershipTable.propertyId),
    )).$dynamic();
}

function activeMembership(settings: StaffAuthConfig) {
  return and(
    eq(staffAccountTable.oidcIssuer, settings.issuer.href),
    eq(staffAccountTable.status, 'active'),
    eq(staffMembershipTable.status, 'active'),
    eq(staffMembershipTable.propertyId, settings.propertyId),
  );
}

export async function findStaff(settings: StaffAuthConfig, subject: string) {
  const [staff] = await staffIdentity()
    .where(and(activeMembership(settings), eq(staffAccountTable.oidcSubject, subject)))
    .limit(1);
  return staff ? { ...staff, department: staff.department ?? undefined } : null;
}

function newCredentials(now: Date) {
  const access = randomToken();
  const refresh = randomToken();
  const csrf = randomToken();
  return {
    access, refresh, csrf,
    values: {
      accessHash: hash(access),
      refreshHash: hash(refresh),
      csrfHash: hash(csrf),
      accessExpiresAt: new Date(now.getTime() + ACCESS_SECONDS * 1000),
      refreshExpiresAt: new Date(now.getTime() + REFRESH_SECONDS * 1000),
    },
  };
}

export type StaffCredentials = ReturnType<typeof newCredentials>;

export async function createStaffSession(membershipId: string) {
  const credentials = newCredentials(new Date());
  await db.insert(staffSessionTable).values({ id: randomUUID(), membershipId, ...credentials.values });
  return credentials;
}

export async function readStaffSession(settings: StaffAuthConfig, access: string, csrf?: string) {
  const [staff] = await staffIdentity()
    .innerJoin(staffSessionTable, eq(staffSessionTable.membershipId, staffMembershipTable.id))
    .where(and(
      activeMembership(settings),
      eq(staffSessionTable.accessHash, hash(access)),
      isNull(staffSessionTable.revokedAt),
      gt(staffSessionTable.accessExpiresAt, new Date()),
      csrf ? eq(staffSessionTable.csrfHash, hash(csrf)) : undefined,
    )).limit(1);
  return staff ? { ...staff, department: staff.department ?? undefined } : null;
}

export async function rotateStaffSession(settings: StaffAuthConfig, refresh: string, csrf: string) {
  const now = new Date();
  const credentials = newCredentials(now);
  const active = db.select({ id: staffMembershipTable.id }).from(staffMembershipTable)
    .innerJoin(staffAccountTable, eq(staffAccountTable.id, staffMembershipTable.staffAccountId))
    .where(and(activeMembership(settings), eq(staffMembershipTable.id, staffSessionTable.membershipId)));
  const [updated] = await db.update(staffSessionTable).set(credentials.values).where(and(
    eq(staffSessionTable.refreshHash, hash(refresh)),
    eq(staffSessionTable.csrfHash, hash(csrf)),
    isNull(staffSessionTable.revokedAt),
    gt(staffSessionTable.refreshExpiresAt, now),
    exists(active),
  )).returning({ id: staffSessionTable.id });
  return updated ? credentials : null;
}

export async function revokeStaffSession(access: string | undefined, refresh: string | undefined, csrf: string) {
  if (!access && !refresh) return;
  await db.update(staffSessionTable).set({ revokedAt: new Date() }).where(and(
    isNull(staffSessionTable.revokedAt),
    eq(staffSessionTable.csrfHash, hash(csrf)),
    or(
      access ? eq(staffSessionTable.accessHash, hash(access)) : undefined,
      refresh ? eq(staffSessionTable.refreshHash, hash(refresh)) : undefined,
    ),
  ));
}
