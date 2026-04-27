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
  doctorId?: string; // Optional for Lab
  labId?: string;    // Optional for Doctor
  patientId: string;
  patientName: string;
  patientPhotoURL?: string;
  patientMobile?: string;
  clinicName?: string; // Optional for Lab
  doctorName?: string; // Optional for Lab
  labName?: string;    // For Lab
  selectedTest?: string; // For Lab
  dateTime: string | Date;
  status: ReservationStatus;
  queuePosition: number;
  symptoms?: string;
  entryTime?: string | Date;
  exitTime?: string | Date;
  isEmergency: boolean;
  transferredFromId?: string;
  transferredToId?: string;
  cancelReason?: string;
  consultationNote?: string;
  expectedTime?: string | Date;
  createdAt: string | Date;
  doctor?: {
    id: string;
    doctorName?: string;
    clinicName?: string;
    location?: string;
    photoURL?: string;
    latitude?: number;
    longitude?: number;
    user?: {
      photoURL?: string;
    };
  };
  lab?: {
    id: string;
    labName?: string;
    location?: string;
    photoURL?: string;
    latitude?: number;
    longitude?: number;
    user?: {
      photoURL?: string;
    };
  };
  patient?: {
    id: string;
    age?: string;
    gender?: string;
    bloodType?: string;
    user?: {
      name: string;
      photoURL?: string;
      email: string;
      mobile?: string;
    };
  };
}

export interface TimeSlot {
  time: string; // "09:00"
  available: boolean;
  reservationId?: string;
}
