export interface GuestFeedbackRecord {
  id: string;
  taskId: string;
  stayId: string;
  guestName: string;
  roomNumber: string;
  rating: number; // 1 to 5
  comment?: string;
  tags?: string[];
  submittedAt: string;
}

export interface CreateFeedbackDto {
  taskId: string;
  stayId: string;
  guestName: string;
  roomNumber: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface IGuestFeedbackRepository {
  createFeedback(data: CreateFeedbackDto): Promise<GuestFeedbackRecord>;
  getFeedbackByTaskId(taskId: string): Promise<GuestFeedbackRecord | null>;
  getFeedbackForStay(stayId: string): Promise<GuestFeedbackRecord[]>;
}

/**
 * ============================================================================
 * In-Memory Guest Feedback Repository (Sprint 0 Adapter)
 * ============================================================================
 */
export class InMemoryGuestFeedbackRepository implements IGuestFeedbackRepository {
  private static instance: InMemoryGuestFeedbackRepository;
  private feedbacks = new Map<string, GuestFeedbackRecord>(); // key: taskId

  public static getInstance(): InMemoryGuestFeedbackRepository {
    if (!InMemoryGuestFeedbackRepository.instance) {
      InMemoryGuestFeedbackRepository.instance = new InMemoryGuestFeedbackRepository();
    }
    return InMemoryGuestFeedbackRepository.instance;
  }

  public async createFeedback(data: CreateFeedbackDto): Promise<GuestFeedbackRecord> {
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: GuestFeedbackRecord = {
      id,
      taskId: data.taskId,
      stayId: data.stayId,
      guestName: data.guestName,
      roomNumber: data.roomNumber,
      rating: data.rating,
      comment: data.comment,
      tags: data.tags,
      submittedAt: new Date().toISOString(),
    };
    this.feedbacks.set(data.taskId, record);
    return { ...record };
  }

  public async getFeedbackByTaskId(taskId: string): Promise<GuestFeedbackRecord | null> {
    const found = this.feedbacks.get(taskId);
    return found ? { ...found } : null;
  }

  public async getFeedbackForStay(stayId: string): Promise<GuestFeedbackRecord[]> {
    return Array.from(this.feedbacks.values())
      .filter((fb) => fb.stayId === stayId)
      .map((fb) => ({ ...fb }));
  }

  public clear(): void {
    this.feedbacks.clear();
  }

  public reset(): void {
    this.clear();
  }
}

export function getGuestFeedbackRepository(): IGuestFeedbackRepository {
  return InMemoryGuestFeedbackRepository.getInstance();
}
