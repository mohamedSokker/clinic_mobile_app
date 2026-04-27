export interface AnalysisType {
  name: string;
  cost: number;
}

export interface WorkingDay {
  isActive: boolean;
  start: string;
  end: string;
}

export interface Lab {
  id: string;
  userId: string;
  labName: string;
  location: string;
  type: string;
  licenseNumber?: string;
  analysisTypes: AnalysisType[];
  partnershipLevel: string;
  latitude: number | null;
  longitude: number | null;
  isAvailable: boolean;
  workingHours: Record<string, WorkingDay>;
  user: {
    id: string;
    uid: string;
    name: string;
    email: string;
    mobile: string;
    photoURL?: string;
  };
  photoURL?: string; // UI helper
  description?: string;
  certifications?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
