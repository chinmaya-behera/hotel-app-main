import crypto from 'node:crypto';

export interface AttachmentMetadataInput {
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  fileSizeBytes: number;
  fileSha256: string;
}

export interface RegisteredAttachment {
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileSha256: string;
  quarantineStatus: 'pending_scan' | 'clean' | 'infected';
  registeredAt: string;
}

/**
 * Storage interface contract.
 * Owned by Developer 1 in DEV1-TASK-06 (S3 Presigned URL Vault).
 * Developer 3 consumes this typed interface without implementing a competing S3 service.
 */
export interface IStorageService {
  registerAttachment(stayId: string, meta: AttachmentMetadataInput): Promise<RegisteredAttachment>;
  isAvailable(): boolean;
}

/**
 * Temporary Mock Storage Adapter for Sprint 0 decoupled development.
 * Safely registers attachment metadata without storing raw base64 payloads in memory
 * and without claiming real S3 connectivity.
 */
export class TemporaryMockStorageService implements IStorageService {
  private static instance: TemporaryMockStorageService;
  private available = true;
  private registry = new Map<string, RegisteredAttachment>();

  public static getInstance(): TemporaryMockStorageService {
    if (!TemporaryMockStorageService.instance) {
      TemporaryMockStorageService.instance = new TemporaryMockStorageService();
    }
    return TemporaryMockStorageService.instance;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public setAvailable(available: boolean): void {
    this.available = available;
  }

  public async registerAttachment(
    stayId: string,
    meta: AttachmentMetadataInput,
  ): Promise<RegisteredAttachment> {
    if (!this.available) {
      throw new Error('STORAGE_SERVICE_UNAVAILABLE: Attachment storage service is not reachable.');
    }

    // MIME type validation
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMime.includes(meta.mimeType)) {
      throw new Error(`UNSUPPORTED_MEDIA_TYPE: MIME type '${meta.mimeType}' is not allowed for ID verification.`);
    }

    // Size limit validation (10 MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (meta.fileSizeBytes > MAX_SIZE) {
      throw new Error(`FILE_TOO_LARGE: Attachment size (${meta.fileSizeBytes} bytes) exceeds 10MB limit.`);
    }

    const storageKey = `quarantine/id_docs/${stayId}/${crypto.randomUUID()}`;
    const record: RegisteredAttachment = {
      storageKey,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      fileSizeBytes: meta.fileSizeBytes,
      fileSha256: meta.fileSha256,
      quarantineStatus: 'pending_scan',
      registeredAt: new Date().toISOString(),
    };

    this.registry.set(storageKey, record);
    return { ...record };
  }

  public getAttachmentMeta(storageKey: string): RegisteredAttachment | null {
    const item = this.registry.get(storageKey);
    return item ? { ...item } : null;
  }

  public reset(): void {
    this.available = true;
    this.registry.clear();
  }
}

export function getStorageService(): IStorageService {
  return TemporaryMockStorageService.getInstance();
}
