import api from '@/lib/api';
import type { Diagnosis, Vaccine, AnalysisFile, Lab } from '@/types/diagnosis';

export async function createDiagnosis(data: Omit<Diagnosis, 'id' | 'createdAt' | 'updatedAt' | 'vaccines' | 'analysisFiles'>): Promise<string> {
  const res = await api.post('/diagnosis', data);
  return res.data.id;
}

export async function getDiagnosesForPatient(patientId: string): Promise<Diagnosis[]> {
  const res = await api.get('/diagnosis/patient');
  return res.data;
}

export async function getDiagnosisById(diagnosisId: string): Promise<Diagnosis | null> {
  try {
    const res = await api.get(`/diagnosis/${diagnosisId}`);
    return res.data;
  } catch (err) {
    return null;
  }
}

export async function getDiagnosisByReservation(reservationId: string): Promise<Diagnosis | null> {
  // Can be implemented as a specific endpoint if needed
  const res = await api.get(`/diagnosis/reservation/${reservationId}`);
  return res.data;
}

export async function updateDiagnosis(diagnosisId: string, data: Partial<Pick<Diagnosis, 'notes' | 'prescriptions' | 'nextVisitDate'>>) {
  await api.patch(`/diagnosis/${diagnosisId}`, data);
}

export async function addVaccineToDiagnosis(diagnosisId: string, vaccine: Vaccine) {
  await api.patch(`/diagnosis/${diagnosisId}`, {
    vaccines: { push: vaccine } // Assuming backend handles push logic
  });
}

export async function attachAnalysisFile(diagnosisId: string, file: AnalysisFile) {
  await api.post('/diagnosis/analysis', {
    diagnosisId,
    ...file,
  });
}

// Lab functions
export async function createLab(data: Omit<Lab, 'id' | 'createdAt'>): Promise<string> {
  const res = await api.post('/users/sync', {
    ...data,
    role: 'lab',
  });
  return res.data.lab.id;
}

export async function getLatestDiagnosisForPatient(patientId: string): Promise<Diagnosis | null> {
  const history = await getDiagnosesForPatient(patientId);
  return history.length > 0 ? history[0] : null;
}
