export interface Vaccine {
  id: string;
  name: string;
  date: string; // ISO string
  dose?: string;
  nextDueDate?: string;
}

export interface AnalysisFile {
  id: string;
  url: string;
  type: 'pdf' | 'image';
  fileName: string;
  labId?: string;
  labName?: string;
  uploadedAt: Date;
}

export interface Diagnosis {
  id: string;
  reservationId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  doctor?: {
    doctorName?: string;
    specialization?: string;
    clinicName?: string;
    user?: {
      name?: string;
    }
  };
  visitDate: Date;
  notes: string;
  vaccines: Vaccine[];
  analysisFiles: AnalysisFile[];
  prescriptions?: string;
  nextVisitDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lab {
  id: string;
  uid: string;
  labName: string;
  location: string;
  mobile: string;
  type: string; // "clinical" | "radiology" | "pathology" etc.
  licenseNumber?: string;
  createdAt: Date;
}
