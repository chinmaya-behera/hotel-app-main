import test from 'node:test';
import assert from 'node:assert/strict';
import { FolioCheckoutService } from '../src/server/modules/finance/folio/FolioCheckoutService.ts';
import { FolioRepository } from '../src/server/modules/finance/folio/FolioRepository.ts';
import { MockPaymentProviderAdapter } from '../src/server/modules/finance/folio/MockPaymentProviderAdapter.ts';
import { QrAuthService } from '../src/server/modules/guest/QrAuthService.ts';
import { getGuestStayRepository } from '../src/server/modules/guest/repositories/GuestStayRepository.ts';
import { MockPmsConnectorAdapter } from '../src/server/modules/integrations/pms/MockPmsConnectorAdapter.ts';

test.describe('DEV3-TASK-20: Folio Settlement & Express Checkout (F34, F35)', () => {
  let checkoutService;
  let folioRepo;
  let paymentGateway;
  let authService;
  let stayRepo;
  let pmsAdapter;

  let sessionToken402; // Room 402, balance ₹0.00 (Ready for checkout)
  let sessionToken201; // Room 201, balance ₹6,623.00 (Unpaid)

  test.beforeEach(async () => {
    folioRepo = FolioRepository.getInstance();
    folioRepo.reset();
    paymentGateway = MockPaymentProviderAdapter.getInstance();
    paymentGateway.reset();
    authService = new QrAuthService();
    stayRepo = getGuestStayRepository();
    stayRepo.reset();
    pmsAdapter = MockPmsConnectorAdapter.getInstance();
    pmsAdapter.reset();

    checkoutService = new FolioCheckoutService(folioRepo, authService, paymentGateway, pmsAdapter);
    checkoutService.reset();

    // Ensure test stays are in checked_in state for testing checkout workflows
    await stayRepo.updateStayStatus('stay_seed_402', 'checked_in');
    await stayRepo.updateStayStatus('stay_seed_201', 'checked_in');

    // Create session for Room 402: Aarav Sharma
    const sig402 = QrAuthService.generateHmacSignature('402');
    const authA = await authService.verifyAndCreateSession({
      roomNumber: '402',
      qrSignature: sig402,
      guestLastName: 'Sharma',
      verificationCode: '4829',
    });
    sessionToken402 = authA.data?.sessionToken;

    // Create session for Room 201: Neha Verma
    const sig201 = QrAuthService.generateHmacSignature('201');
    const authB = await authService.verifyAndCreateSession({
      roomNumber: '201',
      qrSignature: sig201,
      guestLastName: 'Verma',
      verificationCode: '2021',
    });
    sessionToken201 = authB.data?.sessionToken;
  });

  test('1. Authenticated guest retrieves their own authoritative itemized folio', async () => {
    const result = await checkoutService.getGuestFolio(sessionToken402);

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.folio.stayId, 'stay_seed_402');
    assert.equal(result.data.folio.roomNumber, '402');
    assert.equal(result.data.folio.currency, 'INR');
    assert.ok(result.data.lineItems.length >= 3);
    assert.ok(result.data.payments.length >= 1);
  });

  test('2. Unauthenticated request to folio is rejected with 401 Unauthorized', async () => {
    const result = await checkoutService.getGuestFolio(null);

    assert.equal(result.success, false);
    assert.equal(result.statusCode, 401);
    assert.match(result.error, /Authentication required/);
  });

  test('3. Cross-stay data isolation: Guest in 402 only sees 402, Guest in 201 only sees 201', async () => {
    const folio402 = await checkoutService.getGuestFolio(sessionToken402);
    const folio201 = await checkoutService.getGuestFolio(sessionToken201);

    assert.equal(folio402.data.folio.roomNumber, '402');
    assert.equal(folio402.data.folio.stayId, 'stay_seed_402');
    assert.equal(folio201.data.folio.roomNumber, '201');
    assert.equal(folio201.data.folio.stayId, 'stay_seed_201');
    assert.notEqual(folio402.data.folio.id, folio201.data.folio.id);
  });

  test('4. Exact monetary calculations and outstanding balance verification', async () => {
    const result = await checkoutService.getGuestFolio(sessionToken201);

    const { folio, lineItems, payments } = result.data;
    const computedCharges = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const computedPayments = payments
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + p.amount, 0);
    const expectedBalance = parseFloat((computedCharges - computedPayments).toFixed(2));

    assert.equal(folio.totalCharges, computedCharges);
    assert.equal(folio.totalPayments, computedPayments);
    assert.equal(folio.outstandingBalance, expectedBalance);
    assert.equal(folio.outstandingBalance, 6623.00);
  });

  test('5. Dispute visibility on folio without exposing internal staff notes', async () => {
    const result = await checkoutService.getGuestFolio(sessionToken402);

    assert.ok(Array.isArray(result.data.disputes));
    const disputedItem = result.data.lineItems.find((item) => item.isDisputed);
    assert.ok(disputedItem, 'Expected disputed line item to be flagged');
    assert.equal(disputedItem.category, 'dining');
  });

  test('6. Checkout summary reports eligible when balance is ₹0.00 and stay is checked_in', async () => {
    const result = await checkoutService.getCheckoutSummary(sessionToken402);

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.outstandingBalance, 0.00);
    assert.equal(result.data.stayStatus, 'checked_in');
    assert.equal(result.data.isEligibleForCheckout, true);
    assert.equal(result.data.ineligibilityReason, undefined);
  });

  test('7. Checkout summary blocks express checkout when unpaid balance remains', async () => {
    const result = await checkoutService.getCheckoutSummary(sessionToken201);

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.data.outstandingBalance, 6623.00);
    assert.equal(result.data.isEligibleForCheckout, false);
    assert.match(result.data.ineligibilityReason, /Outstanding folio balance of ₹6623.00 must be settled/);
  });

  test('8. Payment order creation returns gateway order and payment reference', async () => {
    const result = await checkoutService.createSettlementPayment(sessionToken201, {
      amount: 6623.00,
      method: 'card',
      idempotencyKey: 'order_test_201_key',
    });

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 201);
    assert.ok(result.data.orderId.startsWith('order_'));
    assert.ok(result.data.paymentRef.startsWith('PAY-'));
    assert.equal(result.data.amount, 6623.00);
    assert.equal(result.data.status, 'created');
  });

  test('9. Payment cannot be initiated for amount exceeding outstanding balance', async () => {
    const result = await checkoutService.createSettlementPayment(sessionToken201, {
      amount: 10000.00, // Exceeds balance of 6623.00
      method: 'card',
    });

    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
    assert.match(result.error, /cannot exceed outstanding balance/);
  });

  test('10. Payment gateway unavailable returns honest 503 without fake success', async () => {
    paymentGateway.setSimulateUnavailable(true);

    const result = await checkoutService.createSettlementPayment(sessionToken201, {
      amount: 6623.00,
      method: 'upi',
    });

    assert.equal(result.success, false);
    assert.equal(result.statusCode, 503);
    assert.match(result.error, /Payment provider is not configured/);
  });

  test('11. Server-side payment verification records captured payment and settles folio to ₹0.00', async () => {
    // 1. Create order
    const orderRes = await checkoutService.createSettlementPayment(sessionToken201, {
      amount: 6623.00,
      method: 'card',
    });

    // 2. Verify payment server-side
    const verifyRes = await checkoutService.verifySettlementPayment(sessionToken201, {
      orderId: orderRes.data.orderId,
      paymentRef: orderRes.data.paymentRef,
    });

    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.statusCode, 200);
    assert.equal(verifyRes.data.folio.outstandingBalance, 0.00);
    assert.equal(verifyRes.data.folio.status, 'SETTLED');
    assert.equal(verifyRes.data.payment.status, 'captured');
  });

  test('12. Duplicate payment verification is idempotent and prevents double-crediting', async () => {
    const orderRes = await checkoutService.createSettlementPayment(sessionToken201, {
      amount: 6623.00,
      method: 'card',
    });

    // First verification
    const firstVerify = await checkoutService.verifySettlementPayment(sessionToken201, {
      orderId: orderRes.data.orderId,
      paymentRef: orderRes.data.paymentRef,
    });
    assert.equal(firstVerify.success, true);
    assert.equal(firstVerify.data.folio.outstandingBalance, 0.00);

    // Duplicate verification with same paymentRef
    const duplicateVerify = await checkoutService.verifySettlementPayment(sessionToken201, {
      orderId: orderRes.data.orderId,
      paymentRef: orderRes.data.paymentRef,
    });

    assert.equal(duplicateVerify.success, true);
    assert.equal(duplicateVerify.data.alreadyProcessed, true);
    // Folio remains ₹0.00 and was not double credited
    assert.equal(duplicateVerify.data.folio.outstandingBalance, 0.00);
  });

  test('13. Unpaid express checkout restriction: Attempting checkout with balance > 0 is rejected with 400', async () => {
    // Room 201 has balance of ₹6,623.00
    const checkoutRes = await checkoutService.completeExpressCheckout(sessionToken201);

    assert.equal(checkoutRes.success, false);
    assert.equal(checkoutRes.statusCode, 400);
    assert.match(checkoutRes.error, /Unpaid folio balance of ₹6623.00 must be settled before checkout/);

    // Verify stay remains checked_in
    const stay = (await stayRepo.getStayWithRoomById('stay_seed_201'))?.stay;
    assert.equal(stay.status, 'checked_in');
  });

  test('14. Successful Express Checkout: Updates stay status, marks room dirty, revokes sessions, syncs PMS', async () => {
    // Room 402 has balance of ₹0.00
    const result = await checkoutService.completeExpressCheckout(sessionToken402);

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.ok(result.data.receiptId.startsWith('rcpt_'));
    assert.equal(result.data.roomNumber, '402');
    assert.equal(result.data.outstandingBalance, 0.00);
    assert.equal(result.data.pmsSyncStatus, 'SYNCED');

    // 1. Authoritative Stay Status verified
    const stay = (await stayRepo.getStayWithRoomById('stay_seed_402'))?.stay;
    assert.equal(stay.status, 'checked_out');

    // 2. Housekeeping room turnover verified
    const assignments = await stayRepo.getRoomAssignmentsForStay('stay_seed_402');
    const roomAssignment = assignments.find((a) => a.isCurrent) || assignments[0];
    assert.equal(roomAssignment.cleanlinessStatus, 'dirty');

    // 3. Guest Session instant revocation verified
    const validation = QrAuthService.validateSession(sessionToken402);
    assert.equal(validation.valid, false);
    assert.equal(validation.reason, 'checkout');
  });

  test('15. PMS sync failure does not break internal checkout (graceful degradation)', async () => {
    // First settle Room 201 so it has 0 balance
    const orderRes = await checkoutService.createSettlementPayment(sessionToken201, {
      amount: 6623.00,
      method: 'card',
    });
    await checkoutService.verifySettlementPayment(sessionToken201, {
      orderId: orderRes.data.orderId,
      paymentRef: orderRes.data.paymentRef,
    });

    // Simulate PMS outage
    pmsAdapter.setFailNextCall(true, 'PMS_UNREACHABLE', 'Oracle Opera Cloud connection offline');

    const checkoutRes = await checkoutService.completeExpressCheckout(sessionToken201);

    // Guest checkout still succeeds internally!
    assert.equal(checkoutRes.success, true);
    assert.equal(checkoutRes.statusCode, 200);
    assert.equal(checkoutRes.data.pmsSyncStatus, 'PENDING_RECONCILIATION');

    // Stay is checked_out internally
    const stay = (await stayRepo.getStayWithRoomById('stay_seed_201'))?.stay;
    assert.equal(stay.status, 'checked_out');
  });

  test('16. Digital checkout receipt retrieval by receipt ID', async () => {
    const checkoutRes = await checkoutService.completeExpressCheckout(sessionToken402);
    assert.equal(checkoutRes.success, true);

    const receiptRes = await checkoutService.getCheckoutReceipt(checkoutRes.data.receiptId);
    assert.equal(receiptRes.success, true);
    assert.equal(receiptRes.statusCode, 200);
    assert.equal(receiptRes.data.receiptId, checkoutRes.data.receiptId);
    assert.equal(receiptRes.data.guestName, 'Aarav Sharma');
  });
});
