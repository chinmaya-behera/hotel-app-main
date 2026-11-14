import test from 'node:test';
import assert from 'node:assert/strict';
import { FinancialDisputeService } from '../src/server/modules/finance/disputes/FinancialDisputeService.ts';
import { InMemoryFinancialDisputeRepository } from '../src/server/modules/finance/disputes/FinancialDisputeRepository.ts';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';

import { InMemoryGuestStayRepository } from '../src/server/modules/guest/repositories/GuestStayRepository.ts';

let guestSessionTokenA;
let guestSessionTokenB;

test.beforeEach(async () => {
  InMemoryFinancialDisputeRepository.getInstance().reset();
  const stayRepo = InMemoryGuestStayRepository.getInstance();
  stayRepo.reset();
  await stayRepo.updateStayStatus('stay_seed_201', 'checked_in');

  const authService = new QrAuthService();
  const sig402 = QrAuthService.generateHmacSignature('402');
  const authA = await authService.verifyAndCreateSession({
    roomNumber: '402',
    qrSignature: sig402,
    guestLastName: 'Sharma',
    verificationCode: '4829',
  });
  guestSessionTokenA = authA.data?.sessionToken;

  const sig201 = QrAuthService.generateHmacSignature('201');
  const authB = await authService.verifyAndCreateSession({
    roomNumber: '201',
    qrSignature: sig201,
    guestLastName: 'Verma',
    verificationCode: '2021',
  });
  guestSessionTokenB = authB.data?.sessionToken;
});

test('DEV3-TASK-18: 1. Authenticated guest creates dispute anchored strictly to their stay', async () => {
  const service = new FinancialDisputeService();

  const result = await service.createGuestDispute(
    {
      category: 'dining_charge_query',
      chargeRef: 'chg_dining_breakfast_11',
      disputedAmount: 1250,
      currency: 'INR',
      guestExplanation: 'Double charge for buffet breakfast on Day 2.',
      preferredResolution: 'folio_credit',
    },
    guestSessionTokenA,
  );

  assert.equal(result.success, true);
  assert.equal(result.statusCode, 201);
  assert.ok(result.data);
  assert.ok(result.data.disputeRef.startsWith('DSP-'));
  assert.equal(result.data.roomNumber, '402');
  assert.equal(result.data.guestName, 'Aarav Sharma');
  assert.equal(result.data.disputedAmount, 1250);
  assert.equal(result.data.status, 'triage_pending');
  assert.equal(result.data.escalationRequired, false);

  // PRIVACY VERIFICATION: Internal notes must NEVER be exposed to guests!
  assert.equal('internalNotes' in result.data, false);
});

test('DEV3-TASK-18: 2. Unauthenticated dispute submission is rejected with 401', async () => {
  const service = new FinancialDisputeService();

  const result = await service.createGuestDispute(
    {
      category: 'tax_fee_query',
      disputedAmount: 450,
      guestExplanation: 'Incorrect service charge applied.',
    },
    undefined,
  );

  assert.equal(result.success, false);
  assert.equal(result.statusCode, 401);
});

test('DEV3-TASK-18: 3. Guest sees only their own disputes (cross-guest data isolation)', async () => {
  const service = new FinancialDisputeService();

  // Create dispute for Guest A
  await service.createGuestDispute(
    {
      category: 'dining_charge_query',
      disputedAmount: 800,
      guestExplanation: 'Minibar water charge dispute.',
    },
    guestSessionTokenA,
  );

  // Guest A queries their disputes
  const listA = await service.getGuestDisputes(guestSessionTokenA);
  assert.equal(listA.success, true);
  assert.ok(listA.data.length >= 1);
  assert.ok(listA.data.every((d) => d.roomNumber === '402'));

  // Guest B queries their disputes (should see 0 of Guest A's disputes)
  const listB = await service.getGuestDisputes(guestSessionTokenB);
  assert.equal(listB.success, true);
  assert.ok(listB.data.every((d) => d.roomNumber !== '402'));
});

test('DEV3-TASK-18: 4. Cross-stay dispute access by ID is rejected with 403 Forbidden (Anti-IDOR)', async () => {
  const service = new FinancialDisputeService();

  const disputeA = await service.createGuestDispute(
    {
      category: 'incorrect_room_charge',
      disputedAmount: 2100,
      guestExplanation: 'Early check-in fee dispute.',
    },
    guestSessionTokenA,
  );

  const disputeId = disputeA.data.id;

  // Guest B attempts to inspect Guest A's dispute
  const idorAttempt = await service.getGuestDisputeById(disputeId, guestSessionTokenB);
  assert.equal(idorAttempt.success, false);
  assert.equal(idorAttempt.statusCode, 403);
  assert.ok(idorAttempt.error?.includes('Forbidden'));
});

test('DEV3-TASK-18: 5. Internal note privacy: staff notes are never returned in guest responses', async () => {
  const service = new FinancialDisputeService();
  const repo = InMemoryFinancialDisputeRepository.getInstance();

  const dispute = await service.createGuestDispute(
    {
      category: 'dining_charge_query',
      disputedAmount: 1500,
      guestExplanation: 'Wine corkage fee was billed mistakenly.',
    },
    guestSessionTokenA,
  );

  // Staff adds a confidential internal note
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };
  await service.triageDispute(
    dispute.data.id,
    {
      decision: 'under_review',
      internalNote: 'CONFIDENTIAL: Staff error during billing shift. Guest was authorized free corkage.',
    },
    staff,
  );

  // Guest queries the dispute
  const guestView = await service.getGuestDisputeById(dispute.data.id, guestSessionTokenA);
  assert.equal(guestView.success, true);
  assert.equal('internalNotes' in guestView.data, false);
  assert.equal(JSON.stringify(guestView.data).includes('CONFIDENTIAL'), false);

  // Front Desk queries the dispute (internal notes MUST be visible)
  const staffView = await service.getFrontDeskDisputeById(dispute.data.id, staff);
  assert.equal(staffView.success, true);
  assert.ok(staffView.data?.internalNotes.some((n) => n.note.includes('CONFIDENTIAL')));
});

test('DEV3-TASK-18: 6. Front Desk dispute queue supports search and filtering by status and category', async () => {
  const service = new FinancialDisputeService();
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };

  const all = await service.getFrontDeskDisputes({}, staff);
  assert.equal(all.success, true);
  assert.ok(all.data && all.data.length >= 2);
  assert.ok(all.counts);

  // Filter by status
  const pending = await service.getFrontDeskDisputes({ status: 'triage_pending' }, staff);
  assert.ok(pending.data.every((d) => d.status === 'triage_pending'));

  // Search by reference or guest name
  const searched = await service.getFrontDeskDisputes({ search: 'Marcus' }, staff);
  assert.ok(searched.data.some((d) => d.guestName.includes('Marcus')));
});

test('DEV3-TASK-18: 7. Delegated limit enforcement: Front Desk CAN resolve disputes <= ₹2,500', async () => {
  const service = new FinancialDisputeService();
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };

  // Create dispute within ₹2,500 limit
  const dispute = await service.createGuestDispute(
    {
      category: 'dining_charge_query',
      disputedAmount: 1200, // <= ₹2,500
      guestExplanation: 'Overcharged for room service coffee.',
    },
    guestSessionTokenA,
  );

  const resolveRes = await service.triageDispute(
    dispute.data.id,
    {
      decision: 'resolve',
      notes: 'Approved coffee charge waiver under Front Desk delegated authority.',
    },
    staff,
  );

  assert.equal(resolveRes.success, true);
  assert.equal(resolveRes.data?.status, 'resolved');
  assert.equal(resolveRes.data?.resolvedBy, 'Sunita Patel');
});

test('DEV3-TASK-18: 8. Delegated limit enforcement: Front Desk CANNOT approve disputes > ₹2,500 (escalation required)', async () => {
  const service = new FinancialDisputeService();
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };

  // Create dispute exceeding ₹2,500 limit
  const dispute = await service.createGuestDispute(
    {
      category: 'incorrect_room_charge',
      disputedAmount: 14500, // > ₹2,500!
      guestExplanation: 'HVAC malfunction compensation claim.',
    },
    guestSessionTokenA,
  );

  assert.equal(dispute.data.escalationRequired, true);

  // Front Desk attempts to directly resolve/approve above limit
  const unauthorizedResolve = await service.triageDispute(
    dispute.data.id,
    {
      decision: 'resolve',
      notes: 'Attempting to approve ₹14,500 waiver',
    },
    staff,
  );

  assert.equal(unauthorizedResolve.success, false);
  assert.equal(unauthorizedResolve.statusCode, 403);
  assert.ok(unauthorizedResolve.error?.includes('exceeds the Front Desk delegated limit of ₹2500'));
});

test('DEV3-TASK-18: 9. Request information lifecycle: Front Desk asks question, status updates to info_requested', async () => {
  const service = new FinancialDisputeService();
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };

  const dispute = await service.createGuestDispute(
    {
      category: 'duplicate_charge',
      disputedAmount: 950,
      guestExplanation: 'Billed twice for laundry.',
    },
    guestSessionTokenA,
  );

  const reqInfoRes = await service.requestInformation(
    dispute.data.id,
    {
      guestMessage: 'Could you please upload a photo of the paper laundry slip left in your room?',
      internalNote: 'Awaiting laundry docket from guest to cross verify with Housekeeping.',
    },
    staff,
  );

  assert.equal(reqInfoRes.success, true);
  assert.equal(reqInfoRes.data?.status, 'info_requested');
  assert.ok(reqInfoRes.data?.auditHistory.some((a) => a.action === 'REQUEST_INFORMATION'));
});

test('DEV3-TASK-18: 10. Finance handoff: refers dispute to Finance workflow and records handoff audit', async () => {
  const service = new FinancialDisputeService();
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };

  const dispute = await service.createGuestDispute(
    {
      category: 'incorrect_room_charge',
      disputedAmount: 8500,
      guestExplanation: 'Room rate discrepancy on corporate discount.',
    },
    guestSessionTokenA,
  );

  const referRes = await service.referToFinance(
    dispute.data.id,
    {
      chargeRef: 'chg_room_rate_corp',
      notes: 'Referred to Finance: requires corporate rate audit and credit voucher issuance.',
      internalNote: 'Corporate code CORP-GOLD-89 verified on booking voucher.',
    },
    staff,
  );

  assert.equal(referRes.success, true);
  assert.equal(referRes.data?.status, 'referred_to_finance');
  assert.equal(referRes.financeHandoffStatus, 'referred_to_finance_workflow');
  assert.ok(referRes.data?.referredToFinanceAt);
});

test('DEV3-TASK-18: 11. Idempotency protection prevents duplicate dispute submissions', async () => {
  const service = new FinancialDisputeService();
  const idempotencyKey = 'idemp_dispute_submit_unique_99';

  const sub1 = await service.createGuestDispute(
    {
      category: 'dining_charge_query',
      disputedAmount: 750,
      guestExplanation: 'Room service water charge.',
      idempotencyKey,
    },
    guestSessionTokenA,
  );

  assert.equal(sub1.success, true);
  assert.equal(sub1.statusCode, 201);

  // Duplicate submission with same idempotency key
  const sub2 = await service.createGuestDispute(
    {
      category: 'dining_charge_query',
      disputedAmount: 750,
      guestExplanation: 'Room service water charge.',
      idempotencyKey,
    },
    guestSessionTokenA,
  );

  assert.equal(sub2.success, true);
  assert.equal(sub2.statusCode, 200);
  assert.equal(sub2.data.id, sub1.data.id);
  assert.equal(sub2.data.disputeRef, sub1.data.disputeRef);
});

test('DEV3-TASK-18: 12. Finalized disputes cannot be triaged or reopened', async () => {
  const service = new FinancialDisputeService();
  const staff = { staffId: 'staff_fd_01', name: 'Sunita Patel', role: 'front_desk' };

  const dispute = await service.createGuestDispute(
    {
      category: 'other_billing_concern',
      disputedAmount: 500,
      guestExplanation: 'Pool towel deposit dispute.',
    },
    guestSessionTokenA,
  );

  // Resolve
  await service.triageDispute(dispute.data.id, { decision: 'resolve' }, staff);

  // Attempt to triage again
  const retryTriage = await service.triageDispute(dispute.data.id, { decision: 'reject' }, staff);
  assert.equal(retryTriage.success, false);
  assert.equal(retryTriage.statusCode, 400);
  assert.ok(retryTriage.error?.includes('finalized status'));
});
