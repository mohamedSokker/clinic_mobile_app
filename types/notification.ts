export type NotificationType =
  | 'queue_shift'
  | 'emergency_insert'
  | 'cancellation'
  | 'time_slot_taken'
  | 'reservation_confirmed'
  | 'analysis_uploaded'
  | 'transfer'
  | 'reminder';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  relatedId?: string; // reservationId or diagnosisId
  data?: Record<string, string>;
  createdAt: Date;
}
