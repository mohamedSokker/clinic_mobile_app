import api from "@/lib/api";
import type { Lab } from "@/types/lab";
import dayjs from "dayjs";
import { getReservationsForLab } from "./reservationService";

export async function createLab(data: any): Promise<string> {
  const res = await api.post('/users/sync', {
    ...data,
    role: 'lab',
  });
  return res.data.lab.id;
}

export async function getAllLabs(
  typeFilter?: string,
  query?: string,
  lat?: number,
  lng?: number,
  radius?: number,
): Promise<Lab[]> {
  const params: any = {};
  if (typeFilter && typeFilter !== 'all' && typeFilter !== 'All') {
    params.type = typeFilter;
  }
  if (query) {
    params.query = query;
  }
  if (lat !== undefined) params.lat = lat;
  if (lng !== undefined) params.lng = lng;
  if (radius !== undefined) params.radius = radius;

  const res = await api.get('/labs', { params });
  return res.data;
}

export async function getLabById(id: string): Promise<Lab> {
  const res = await api.get(`/labs/${id}`);
  return res.data;
}

export async function getLabByUid(uid: string): Promise<Lab | null> {
  try {
    const res = await api.get('/users/me');
    const user = res.data;
    const lab = user.lab;
    if (lab && user.photoURL) {
      lab.photoURL = user.photoURL;
    }
    return lab;
  } catch (err) {
    return null;
  }
}

export async function getLabAvailableTimeSlots(
  labId: string,
  date: Date,
  schedule: any,
): Promise<{ time: string; taken: boolean }[]> {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[date.getDay()];
  const daySchedule = schedule[dayName];

  if (!daySchedule || !daySchedule.isActive) return [];

  const slots: string[] = [];
  const [startH, startM] = daySchedule.start.split(":").map(Number);
  const [endH, endM] = daySchedule.end.split(":").map(Number);
  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const slotDuration = 30; // 30 minutes per test slot

  while (current + slotDuration <= endTotal) {
    const h = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += slotDuration;
  }

  // Fetch reservations for this lab using the standardized service
  const reservations = await getReservationsForLab(labId, date);
  const bookedTimes = reservations
    .filter((r) => r.status !== "cancelled")
    .map((r) => dayjs(r.dateTime).format("HH:mm"));

  const now = dayjs();
  const isToday = dayjs(date).isSame(now, "day");

  return slots
    .filter((s) => {
      if (!isToday) return true;
      const [h, m] = s.split(":").map(Number);
      const slotTime = dayjs(date).hour(h).minute(m).second(0);
      return slotTime.isAfter(now);
    })
    .map((s) => ({
      time: s,
      taken: bookedTimes.includes(s),
    }));
}

export async function getLabDashboard(): Promise<any> {
  const res = await api.get('/labs/dashboard');
  return res.data;
}

export async function getLabQueue(): Promise<any> {
  const res = await api.get('/labs/queue');
  return res.data;
}

export async function updateLabProfile(data: any): Promise<any> {
  const res = await api.patch('/users/me', data);
  return res.data;
}

export async function getPatientAnalysis(patientId: string, page: number = 1, perPage: number = 3): Promise<any> {
  const res = await api.get(`/labs/patient-analysis/${patientId}`, {
    params: { page, per_page: perPage }
  });
  return res.data;
}

export async function deleteAnalysisFile(fileId: string): Promise<any> {
  const res = await api.delete(`/labs/analysis/${fileId}`);
  return res.data;
}
