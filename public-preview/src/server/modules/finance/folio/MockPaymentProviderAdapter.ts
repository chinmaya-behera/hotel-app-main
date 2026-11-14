import type {
  IPaymentProviderAdapter,
  CreatePaymentOrderInput,
  PaymentOrderResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
} from './FolioContracts.ts';

/**
 * Mock Payment Provider Adapter (DEV3-TASK-20 / F34)
 * Simulates gateway payment order creation and signature verification (Razorpay / Stripe)
 * for automated tests, failure injection, and settlement isolation.
 */
export class MockPaymentProviderAdapter implements IPaymentProviderAdapter {
  private static instance: MockPaymentProviderAdapter;
  private providerId = 'razorpay_mock';
  private providerName = 'Razorpay / Stripe Payment Gateway (Sandbox Mock)';
  private available = true;
  private failNextCall = false;
  private failureCode = 'PAYMENT_FAILED';
  private failureMessage = 'Simulated card/UPI transaction failure from gateway';
  private timeoutNextCall = false;

  private orders = new Map<string, { orderId: string; paymentRef: string; amount: number; currency: string }>();
  private processedKeys = new Map<string, PaymentOrderResult>();

  public static getInstance(): MockPaymentProviderAdapter {
    if (!MockPaymentProviderAdapter.instance) {
      MockPaymentProviderAdapter.instance = new MockPaymentProviderAdapter();
    }
    return MockPaymentProviderAdapter.instance;
  }

  public getProviderId(): string {
    return this.providerId;
  }

  public getProviderName(): string {
    return this.providerName;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public setSimulateUnavailable(unavailable: boolean): void {
    this.available = !unavailable;
  }

  public setFailNextCall(fail: boolean, code = 'PAYMENT_FAILED', message = 'Simulated card/UPI transaction failure from gateway'): void {
    this.failNextCall = fail;
    this.failureCode = code;
    this.failureMessage = message;
  }

  public setTimeoutNextCall(timeout: boolean): void {
    this.timeoutNextCall = timeout;
  }

  public reset(): void {
    this.available = true;
    this.failNextCall = false;
    this.failureCode = 'PAYMENT_FAILED';
    this.failureMessage = 'Simulated card/UPI transaction failure from gateway';
    this.timeoutNextCall = false;
    this.orders.clear();
    this.processedKeys.clear();
  }

  public async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    if (!this.available) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'PROVIDER_UNAVAILABLE',
        errorMessage: 'Payment gateway provider is not configured. Live transactions unavailable.',
      };
    }

    if (input.idempotencyKey && this.processedKeys.has(input.idempotencyKey)) {
      return this.processedKeys.get(input.idempotencyKey)!;
    }

    if (this.timeoutNextCall) {
      this.timeoutNextCall = false;
      return {
        success: false,
        status: 'failed',
        errorCode: 'GATEWAY_TIMEOUT',
        errorMessage: 'Payment gateway connection timed out.',
      };
    }

    if (this.failNextCall) {
      this.failNextCall = false;
      const result: PaymentOrderResult = {
        success: false,
        status: 'failed',
        errorCode: this.failureCode,
        errorMessage: this.failureMessage,
      };
      if (input.idempotencyKey) {
        this.processedKeys.set(input.idempotencyKey, result);
      }
      return result;
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const paymentRef = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderRecord = {
      orderId,
      paymentRef,
      amount: input.amount,
      currency: input.currency,
    };
    this.orders.set(orderId, orderRecord);

    const result: PaymentOrderResult = {
      success: true,
      orderId,
      paymentRef,
      amount: input.amount,
      currency: input.currency,
      status: 'created',
    };

    if (input.idempotencyKey) {
      this.processedKeys.set(input.idempotencyKey, result);
    }

    return result;
  }

  public async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    if (!this.available) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'PROVIDER_UNAVAILABLE',
        errorMessage: 'Payment gateway is offline. Server verification failed.',
      };
    }

    if (this.failNextCall) {
      this.failNextCall = false;
      return {
        success: false,
        status: 'failed',
        errorCode: this.failureCode,
        errorMessage: this.failureMessage,
      };
    }

    const order = this.orders.get(input.orderId);
    if (!order && !input.orderId.startsWith('order_')) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'INVALID_ORDER',
        errorMessage: `Payment order ${input.orderId} does not exist.`,
      };
    }

    const providerPaymentId = input.providerPaymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      providerPaymentId,
      amount: order?.amount || 0,
      status: 'captured',
    };
  }
}
