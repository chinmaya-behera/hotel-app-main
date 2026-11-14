import type {
  IRefundProviderAdapter,
  RefundExecutionInput,
  RefundExecutionResult,
} from './RefundContracts.ts';

/**
 * Mock Refund Provider Adapter (DEV3-TASK-19 / F33)
 * Simulates payment gateway refund processing (Razorpay / Stripe Refund API)
 * with idempotency, timeout simulation, and failure injection for automated testing.
 */
export class MockRefundProviderAdapter implements IRefundProviderAdapter {
  private static instance: MockRefundProviderAdapter;
  private providerId = 'razorpay_mock';
  private providerName = 'Razorpay / Stripe Gateway (Mock Sandbox)';
  private available = true;
  private failNextCall = false;
  private failureCode = 'GATEWAY_ERROR';
  private failureMessage = 'Simulated refund processing failure from payment gateway';
  private timeoutNextCall = false;

  // In-memory idempotency cache: idempotencyKey -> RefundExecutionResult
  private executedKeys = new Map<string, RefundExecutionResult>();
  // Processed refunds store: providerRef -> RefundExecutionResult
  private processedRefunds = new Map<string, RefundExecutionResult>();

  public static getInstance(): MockRefundProviderAdapter {
    if (!MockRefundProviderAdapter.instance) {
      MockRefundProviderAdapter.instance = new MockRefundProviderAdapter();
    }
    return MockRefundProviderAdapter.instance;
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

  public setFailNextCall(fail: boolean, code = 'GATEWAY_ERROR', message = 'Simulated refund processing failure from payment gateway'): void {
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
    this.failureCode = 'GATEWAY_ERROR';
    this.failureMessage = 'Simulated refund processing failure from payment gateway';
    this.timeoutNextCall = false;
    this.executedKeys.clear();
    this.processedRefunds.clear();
  }

  public async executeRefund(input: RefundExecutionInput): Promise<RefundExecutionResult> {
    if (!this.available) {
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'PROVIDER_UNAVAILABLE',
        errorMessage: 'Payment gateway refund provider is not configured or offline.',
      };
    }

    // 1. Idempotency check: if this idempotency key was already executed, return cached result
    if (input.idempotencyKey && this.executedKeys.has(input.idempotencyKey)) {
      return this.executedKeys.get(input.idempotencyKey)!;
    }

    // 2. Simulated Timeout
    if (this.timeoutNextCall) {
      this.timeoutNextCall = false;
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'GATEWAY_TIMEOUT',
        errorMessage: 'Connection to payment gateway timed out after 10000ms. Status uncertain; reconciliation required.',
      };
    }

    // 3. Simulated Failure
    if (this.failNextCall) {
      this.failNextCall = false;
      const result: RefundExecutionResult = {
        success: false,
        status: 'FAILED',
        errorCode: this.failureCode,
        errorMessage: this.failureMessage,
      };
      if (input.idempotencyKey) {
        this.executedKeys.set(input.idempotencyKey, result);
      }
      return result;
    }

    // 4. Successful refund execution
    const providerRef = `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const result: RefundExecutionResult = {
      success: true,
      providerRef,
      status: 'SUCCEEDED',
    };

    if (input.idempotencyKey) {
      this.executedKeys.set(input.idempotencyKey, result);
    }
    this.processedRefunds.set(providerRef, result);

    return result;
  }

  public async getRefundStatus(providerRef: string): Promise<RefundExecutionResult> {
    const existing = this.processedRefunds.get(providerRef);
    if (existing) {
      return existing;
    }

    return {
      success: false,
      status: 'FAILED',
      errorCode: 'NOT_FOUND',
      errorMessage: `Refund transaction ${providerRef} not found on gateway.`,
    };
  }
}
