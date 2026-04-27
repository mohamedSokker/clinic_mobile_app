export type UserRole = 'doctor' | 'patient' | 'lab';

export interface BaseUser {
  id: string; // The database UUID
  uid: string; // The Firebase UID
  role: UserRole;
  name: string;
  email: string;
  mobile: string;
  photoURL?: string;
  fcmToken?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
}

export interface PatientUser extends BaseUser {
  role: 'patient';
  dateOfBirth?: string;
  bloodType?: string;
  // Vitals — displayed in Patient Profile vitals row
  bloodPressure?: string;   // e.g. "118/78"
  heartRate?: string;       // e.g. "72"
  glucose?: string;         // e.g. "142"
  spo2?: string;            // e.g. "98"
  // Demographics
  age?: string;
  gender?: string;
  weight?: number;
  height?: number;
  allergies?: string[];
  chronicConditions?: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  // Nested patient record fields
  patient?: {
    bloodType?: string;
    dateOfBirth?: string;
    bloodPressure?: string;
    heartRate?: string;
    glucose?: string;
    spo2?: string;
    age?: string;
    gender?: string;
    weight?: number;
    height?: number;
    allergies?: string[];
    chronicConditions?: string[];
    location?: string;
    latitude?: number;
    longitude?: number;
    analysisFiles?: any[];
  };
}

export interface DoctorUser extends BaseUser {
  role: 'doctor';
  clinicName?: string;
  doctorName?: string;
  specialization?: string;
  visitCost?: number;
  about?: string;
  badgeTitle?: string;
  yearsExperience?: number;
  patientsCount?: number;
  successRate?: number;
  rating?: number;
  latitude?: number;
  longitude?: number;
  doctor?: {
    id: string;
    clinicName?: string;
    doctorName?: string;
    location?: string;
    specialization?: string;
    visitCost: number;
    videoConsultCost?: number;
    inPersonCost?: number;
    about?: string;
    badgeTitle?: string;
    yearsExperience?: number;
    patientsCount?: number;
    successRate?: number;
    specialties?: string[];
    rating: number;
    reviewCount: number;
    latitude?: number;
    longitude?: number;
  };
}

export interface LabUser extends BaseUser {
  role: 'lab';
  id: string; // The Lab ID (different from User UID)
  labName?: string;
  location?: string;
  type?: string;
  licenseNumber?: string;
  analysisTypes?: { name: string; cost: number }[];
  partnershipLevel?: string;
  isAvailable?: boolean;
  accuracy?: number;
  avgTurnaroundTime?: number;
  description?: string;
  certifications?: Record<string, string>;
  latitude?: number;
  longitude?: number;
  lab?: any; // To allow access if not fully flattened or for nested access
}

export type AppUser = PatientUser | DoctorUser | LabUser;
