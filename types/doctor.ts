export interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "17:00"
  hasBreak: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface DoctorSchedule {
  Mon?: WorkingHours;
  Tue?: WorkingHours;
  Wed?: WorkingHours;
  Thu?: WorkingHours;
  Fri?: WorkingHours;
  Sat?: WorkingHours;
  Sun?: WorkingHours;
}

export interface Doctor {
  id: string;
  uid: string;
  clinicName: string;
  doctorName: string;
  location: string;
  specialization: string;
  mobile: string;
  visitCost: number;
  videoConsultCost?: number;
  inPersonCost?: number;
  photoURL?: string;
  about?: string;
  badgeTitle?: string;        // e.g. "Senior Specialist"
  yearsExperience?: number;   // e.g. 12
  patientsCount?: number;     // e.g. 8500
  successRate?: number;       // e.g. 99 (percentage)
  specialties?: string[];     // tags e.g. ["Retinal Detachment"]
  rating: number;
  reviewCount: number;
  subscriptionActive: boolean;
  subscriptionExpiry?: Date;
  schedule: DoctorSchedule;
  workingDays: string[];
  slotDurationMinutes: number; // 15 | 20 | 30 | 45 | 60
  maxPatientsPerDay?: number;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export interface DoctorReview {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientPhotoURL?: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}
