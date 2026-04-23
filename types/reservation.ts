export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'waiting'
  | 'inside'
  | 'done'
  | 'cancelled'
  | 'transferred'
  | 'no-show';

export interface Reservation {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhotoURL?: string;
  patientMobile?: string;
  clinicName: string;
  doctorName: string;
  dateTime: Date;
  status: ReservationStatus;
  queuePosition: number;
  symptoms?: string;
  entryTime?: Date;
  exitTime?: Date;
  isEmergency: boolean;
  transferredFromId?: string;
  transferredToId?: string;
  cancelReason?: string;
  consultationNote?: string;
  createdAt: Date;
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  reservationId?: string;
}
