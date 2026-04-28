import api from '@/lib/api';
import type { Doctor, DoctorSchedule } from '@/types/doctor';

export async function createDoctor(data: Omit<Doctor, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Promise<string> {
  const res = await api.post('/users/sync', {
    ...data,
    role: 'doctor',
  });
  return res.data.doctor.id;
}

export async function getDoctor(doctorId: string): Promise<Doctor | null> {
  try {
    const res = await api.get(`/doctors/${doctorId}`);
    const doctor = res.data;
    // Flatten photoURL from user object if it exists
    if (doctor.user?.photoURL) {
      doctor.photoURL = doctor.user.photoURL;
    }
    return doctor;
  } catch (err) {
    return null;
  }
}

export async function getDoctorByUid(uid: string): Promise<Doctor | null> {
  try {
    const res = await api.get('/users/me');
    const user = res.data;
    const doctor = user.doctor;
    if (doctor && user.photoURL) {
      doctor.photoURL = user.photoURL;
    }
    return doctor;
  } catch (err) {
    return null;
  }
}

export async function getAllDoctors(
  specializationFilter?: string,
  lat?: number,
  lng?: number,
  radius?: number,
): Promise<Doctor[]> {
  const params: any = {};
  if (specializationFilter && specializationFilter !== 'all') {
    params.specialization = specializationFilter;
  }
  if (lat !== undefined) params.lat = lat;
  if (lng !== undefined) params.lng = lng;
  if (radius !== undefined) params.radius = radius;

  const res = await api.get('/doctors', { params });
  return res.data.map((doctor: any) => ({
    ...doctor,
    photoURL: doctor.user?.photoURL,
  }));
}

export async function updateDoctorSchedule(doctorId: string, schedule: DoctorSchedule, workingDays: string[], slotDuration: number) {
  await api.patch('/doctors/schedule', {
    schedule,
    workingDays,
    slotDurationMinutes: slotDuration,
  });
}

export async function updateDoctorProfile(doctorId: string, data: Partial<Doctor>) {
  await api.patch('/users/me', data);
}

export async function updateDoctorRating(doctorId: string, newRating: number, newCount: number) {
  // Usually handled by the backend during review creation
  await api.patch(`/doctors/${doctorId}`, {
    rating: newRating,
    reviewCount: newCount,
  });
}

export async function getPatientFullProfile(patientId: string) {
  const res = await api.get(`/users/patient/${patientId}/full-profile`);
  return res.data;
}

export async function getPatientActivityLog(patientId: string, page: number = 1, perPage: number = 10) {
  const res = await api.get(`/users/patient/${patientId}/activity`, {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function getPatientLabAnalysis(patientId: string, page: number = 1, perPage: number = 10) {
  const res = await api.get(`/users/patient/${patientId}/analysis`, {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function getPatientDiagnosesLog(patientId: string, page: number = 1, perPage: number = 10) {
  const res = await api.get(`/diagnosis/patient/${patientId}/paginated`, {
    params: { page, per_page: perPage },
  });
  return res.data;
}
