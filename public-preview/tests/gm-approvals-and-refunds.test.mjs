import test from 'node:test';
import assert from 'node:assert/strict';
import { RefundService } from '../src/server/modules/finance/refunds/RefundService.ts';
import { RefundRepository } from '../src/server/modules/finance/refunds/RefundRepository.ts';
import { MockRefundProviderAdapter } from '../src/server/modules/finance/refunds/MockRefundProviderAdapter.ts';

test.describe('DEV3-TASK-19: GM Approvals & Refund Execution (F32, F33)', () => {
  let refundService;
  let refundRepo;
  let mockGateway;

  const staffRequester = {
    staffId: 'stf_fd_priya',
    name: 'Priya Patel',
    role: 'front_desk',
  };

  const staffFinance = {
    staffId: 'stf_fin_vikram',
    name: 'Vikram Mehta',
    role: 'finance_officer',
  };

  const staffGm = {
    staffId: 'stf_gm_sanjay',
    name: 'Sanjay Kapoor',
    role: 'general_manager',
  };

  const staffUnauthorized = {
    staffId: 'stf_guest_user',
    name: 'Regular Staff',
    role: 'housekeeping',
  };

  test.beforeEach(() => {
    refundRepo = RefundRepository.getInstance();
    refundRepo.reset();
    mockGateway = MockRefundProviderAdapter.getInstance();
    mockGateway.reset();
    refundService = RefundService.getInstance();
    refundService.setProviderAdapter(mockGateway);
  });

  test('1. Refund request creation with valid parameters & initial pending status', async () => {
    const result = await refundService.createRefundRequest(
      {
        disputeId: 'dsp_test_123',
        stayId: 'stay_seed_402',
        folioId: 'fol_seed_402',
        chargeRef: 'CHG-DIN-402',
        originalPaymentRef: 'PAY-2026-402-01',
        requestedAmount: 2450.00,
        currency: 'INR',
        reason: 'Guest disputed dinner charges for misdelivered meal.',
        idempotencyKey: 'idem_req_001',
      },
      staffRequester
    );

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 201);
    assert.ok(result.data.id.startsWith('ref_'));
    assert.ok(result.data.refundRef.startsWith('REF-'));
    assert.equal(result.data.approvalStatus, 'PENDING_APPROVAL');
    assert.equal(result.data.executionStatus, 'PENDING_EXECUTION');
    assert.equal(result.data.requestedAmount, 2450.00);
    assert.equal(result.data.requestedByStaffId, 'stf_fd_priya');
    assert.equal(result.data.auditHistory.length, 1);
  });

  test('2. Idempotency prevents duplicate refund request creation', async () => {
    const payload = {
      stayId: 'stay_seed_201',
      folioId: 'fol_seed_201',
      originalPaymentRef: 'PAY-2026-201-01',
      requestedAmount: 1200.00,
      reason: 'Partial compensation for jacuzzi downtime',
      idempotencyKey: 'idem_same_key_999',
    };

    const first = await refundService.createRefundRequest(payload, staffFinance);
    assert.equal(first.success, true);
    assert.equal(first.statusCode, 201);

    const second = await refundService.createRefundRequest(payload, staffFinance);
    assert.equal(second.success, true);
    assert.equal(second.statusCode, 200);
    assert.equal(second.data.id, first.data.id);
    assert.equal(second.data.refundRef, first.data.refundRef);
  });

  test('3. GM authorization enforcement: Unauthorized staff cannot access GM approval queue', async () => {
    const result = await refundService.getPendingGmApprovals(staffUnauthorized);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 403);
    assert.match(result.error, /General Manager or Duty Manager/);
  });

  test('4. Authorized GM can query pending refund approvals queue', async () => {
    const result = await refundService.getPendingGmApprovals(staffGm);
    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.ok(Array.isArray(result.data));
    assert.ok(result.data.length >= 1);
    assert.ok(result.data.every((r) => r.approvalStatus === 'PENDING_APPROVAL'));
  });

  test('5. Separation of Duties: Requester CANNOT approve their own refund request', async () => {
    // stf_fd_01 requested ref_seed_001
    const requesterAsApprover = {
      staffId: 'stf_fd_01',
      name: 'Priya Patel',
      role: 'general_manager', // Even if promoted/acting as GM
    };

    const result = await refundService.approveRefund('ref_seed_001', { notes: 'Self approval attempt' }, requesterAsApprover);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 403);
    assert.match(result.error, /Separation of duties violation/);
  });

  test('6. GM can approve pending refund with full or partial amount', async () => {
    const result = await refundService.approveRefund(
      'ref_seed_001',
      { approvedAmount: 2000.00, notes: 'Approved partial refund of ₹2,000 for misdelivered items.' },
      staffGm
    );

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.approvalStatus, 'APPROVED');
    assert.equal(result.data.approvedAmount, 2000.00);
    assert.equal(result.data.approvedByStaffId, 'stf_gm_sanjay');
    assert.ok(result.data.approvedAt);
    const lastAudit = result.data.auditHistory.slice(-1)[0];
    assert.equal(lastAudit.action, 'GM_APPROVED');
  });

  test('7. GM cannot approve amount greater than requested amount', async () => {
    // ref_seed_001 requestedAmount is 2450.00
    const result = await refundService.approveRefund(
      'ref_seed_001',
      { approvedAmount: 5000.00, notes: 'Excess amount' },
      staffGm
    );

    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
    assert.match(result.error, /cannot exceed requested amount/);
  });

  test('8. GM can reject pending refund with mandatory reason', async () => {
    const result = await refundService.rejectRefund(
      'ref_seed_001',
      { rejectionReason: 'Kitchen logs confirm food was delivered and consumed in Room 402.' },
      staffGm
    );

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.approvalStatus, 'REJECTED');
    assert.equal(result.data.rejectionReason, 'Kitchen logs confirm food was delivered and consumed in Room 402.');
  });

  test('9. Rejected refund CANNOT be executed', async () => {
    // ref_seed_003 is pre-seeded with approvalStatus = 'REJECTED'
    const result = await refundService.executeRefund('ref_seed_003', staffFinance);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
    assert.match(result.error, /Execution prohibited: This refund request was rejected/);
  });

  test('10. Unapproved refund (PENDING_APPROVAL) CANNOT be executed', async () => {
    // ref_seed_001 is PENDING_APPROVAL
    const result = await refundService.executeRefund('ref_seed_001', staffFinance);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
    assert.match(result.error, /must be APPROVED by the GM before execution/);
  });

  test('11. Successful gateway refund execution for approved request', async () => {
    // ref_seed_002 is pre-seeded as APPROVED by GM
    const result = await refundService.executeRefund('ref_seed_002', staffFinance);

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.executionStatus, 'SUCCEEDED');
    assert.ok(result.data.providerRef.startsWith('rfnd_'));
    const lastAudit = result.data.auditHistory.slice(-1)[0];
    assert.equal(lastAudit.action, 'REFUND_EXECUTED_SUCCESS');
  });

  test('12. Gateway failure simulation records FAILED status safely without crash', async () => {
    mockGateway.setFailNextCall(true, 'INSUFFICIENT_FUNDS', 'Merchant gateway account has insufficient balance');

    const result = await refundService.executeRefund('ref_seed_002', staffFinance);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 502);
    assert.equal(result.data.executionStatus, 'FAILED');
    assert.equal(result.data.providerErrorCode, 'INSUFFICIENT_FUNDS');
  });

  test('13. Gateway timeout handling records failure with reconciliation guidance', async () => {
    mockGateway.setTimeoutNextCall(true);

    const result = await refundService.executeRefund('ref_seed_002', staffFinance);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 502);
    assert.equal(result.data.executionStatus, 'FAILED');
    assert.equal(result.data.providerErrorCode, 'GATEWAY_TIMEOUT');
  });

  test('14. Gateway unavailable simulation does not report false success (honest failure reporting)', async () => {
    mockGateway.setSimulateUnavailable(true);

    const result = await refundService.executeRefund('ref_seed_002', staffFinance);
    assert.equal(result.success, false);
    assert.equal(result.statusCode, 503);
    assert.match(result.error, /Live credentials required/);
  });

  test('15. Idempotent re-execution returns existing succeeded execution result', async () => {
    // First execution succeeds
    const first = await refundService.executeRefund('ref_seed_002', staffFinance, 'idem_exec_unique_777');
    assert.equal(first.success, true);

    // Second execution with same idempotency
    const second = await refundService.executeRefund('ref_seed_002', staffFinance, 'idem_exec_unique_777');
    assert.equal(second.success, true);
    assert.equal(second.data.providerRef, first.data.providerRef);
  });

  test('16. Refund status endpoint returns full reconciliation status and gateway reference', async () => {
    await refundService.executeRefund('ref_seed_002', staffFinance);
    const statusResult = await refundService.getRefundStatus('ref_seed_002', staffFinance);

    assert.equal(statusResult.success, true);
    assert.equal(statusResult.data.executionStatus, 'SUCCEEDED');
    assert.ok(statusResult.data.providerRef);
    assert.equal(statusResult.data.providerStatus.success, true);
  });
});
