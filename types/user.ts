export type UserRole = 'doctor' | 'patient' | 'lab';

export interface BaseUser {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  mobile: string;
  photoURL?: string;
  fcmToken?: string;
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
  };
}

export interface DoctorUser extends BaseUser {
  role: 'doctor';
  clinicId: string;
}

export interface LabUser extends BaseUser {
  role: 'lab';
  labId: string;
}

export type AppUser = PatientUser | DoctorUser | LabUser;
