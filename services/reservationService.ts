import api from "@/lib/api";
import type { Reservation, ReservationStatus } from "@/types/reservation";
import dayjs from "dayjs";

export async function createReservation(data: Omit<Reservation, 'id' | 'createdAt' | 'queuePosition' | 'status'>): Promise<string> {
  const res = await api.post('/reservations', data);
  return res.data.id;
}
export async function getReservationById(id: string): Promise<Reservation> {
  const res = await api.get(`/reservations/${id}`);
  return res.data;
}

export async function getReservationsForDoctor(doctorId: string, date: Date): Promise<Reservation[]> {
  // Format as YYYY-MM-DD using local time to avoid timezone shifts
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;

  const res = await api.get('/reservations/doctor', {
    params: { 
      doctorId,
      date: localDateStr
    }
  });
  return res.data;
}

export async function getReservationsForLab(labId: string, date: Date): Promise<Reservation[]> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;

  const res = await api.get(`/reservations/lab/${labId}`, {
    params: { date: localDateStr }
  });
  return res.data;
}

export async function getPaginatedReservationsForDoctor(
  date: Date,
  page: number = 1,
  perPage: number = 3,
  nextOnly: boolean = false,
): Promise<{ reservations: Reservation[]; total: number; totalPages: number; page: number }> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;

  const res = await api.get('/reservations/doctor/paginated', {
    params: { 
      date: localDateStr,
      page,
      per_page: perPage,
      next_only: nextOnly
    }
  });
  return res.data;
}

export async function getPaginatedReservationsForLab(
  date: Date,
  page: number = 1,
  perPage: number = 3,
  nextOnly: boolean = false,
): Promise<{ reservations: Reservation[]; total: number; totalPages: number; page: number }> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const localDateStr = `${year}-${month}-${day}`;

  const res = await api.get('/reservations/lab/paginated', {
    params: { 
      date: localDateStr,
      page,
      per_page: perPage,
      next_only: nextOnly
    }
  });
  return res.data;
}

export async function getReservationsForPatient(patientId: string): Promise<Reservation[]> {
  const res = await api.get('/reservations/patient');
  return res.data;
}

export async function getPaginatedReservationsForPatient(
  page: number = 1,
  perPage: number = 3,
): Promise<{ reservations: Reservation[]; total: number; totalPages: number; page: number }> {
  const res = await api.get('/reservations/patient/paginated', {
    params: { page, per_page: perPage }
  });
  return res.data;
}

export async function getLiveClinicQueue(doctorId?: string): Promise<{ clinicInfo: any, queue: any[], myPatientId: string }> {
  const res = await api.get('/reservations/patient/live-queue', {
    params: { doctorId }
  });
  return res.data;
}

export async function getUpcomingReservationForPatient(): Promise<Reservation | null> {
  try {
    const res = await api.get('/reservations/patient/upcoming');
    return res.data;
  } catch {
    return null;
  }
}

export async function cancelReservation(reservationId: string, patientId: string, patientName: string): Promise<void> {
  await api.patch(`/reservations/${reservationId}/status`, {
    status: 'cancelled',
  });
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus, extra?: Partial<Reservation>) {
  await api.patch(`/reservations/${reservationId}/status`, {
    status,
    ...extra,
  });
}

export async function insertEmergencyPatient(
  doctorId: string,
  patientName: string,
  patientMobile: string,
  date: Date,
  doctorName: string,
  clinicName: string,
): Promise<string> {
  const res = await api.post('/reservations', {
    doctorId,
    patientName,
    patientMobile,
    dateTime: date,
    doctorName,
    clinicName,
    isEmergency: true,
  });
  return res.data.id;
}

// Logic moved to backend, but helper can stay if needed for UI slot generation
export async function getAvailableTimeSlots(
  doctorId: string,
  date: Date,
  slotDurationMinutes: number,
  schedule: any,
): Promise<{ time: string; taken: boolean }[]> {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[date.getDay()];
  const daySchedule = schedule[dayName];
  if (!daySchedule) return [];

  const slots: string[] = [];
  const [startH, startM] = daySchedule.start.split(":").map(Number);
  const [endH, endM] = daySchedule.end.split(":").map(Number);
  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  while (current + slotDurationMinutes <= endTotal) {
    if (
      daySchedule.hasBreak &&
      daySchedule.breakStart &&
      daySchedule.breakEnd
    ) {
      const [bsH, bsM] = daySchedule.breakStart.split(":").map(Number);
      const [beH, beM] = daySchedule.breakEnd.split(":").map(Number);
      const bsTotal = bsH * 60 + bsM;
      const beTotal = beH * 60 + beM;
      if (current >= bsTotal && current < beTotal) {
        current = beTotal;
        continue;
      }
    }
    const h = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += slotDurationMinutes;
  }

  const reservations = await getReservationsForDoctor(doctorId, date);
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

// Polling fallback instead of onSnapshot
export function subscribeToQueue(doctorId: string, date: Date, callback: (reservations: Reservation[]) => void): () => void {
  const fetch = async () => {
    try {
      const res = await getReservationsForDoctor(doctorId, date);
      callback(res);
    } catch (e) {
      console.error('Queue poll failed', e);
    }
  };

  fetch();
  const interval = setInterval(fetch, 10000); // Poll every 10s
  return () => clearInterval(interval);
}
