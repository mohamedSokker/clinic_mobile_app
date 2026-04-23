import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Syringe, FileText, ArrowRightLeft, Calendar } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuthStore } from '@/stores/authStore';
import { getDoctorByUid } from '@/services/doctorService';
import {
  getDiagnosisByReservation, createDiagnosis,
  updateDiagnosis, addVaccineToDiagnosis,
} from '@/services/diagnosisService';
import { getReservationsForPatient } from '@/services/reservationService';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from '@/lib/theme';
import type { Diagnosis, Vaccine } from '@/types/diagnosis';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export default function PatientProfileScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingVaccine, setAddingVaccine] = useState(false);
  const [vaccineName, setVaccineName] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');

  const { data: doctorInfo } = useQuery({
    queryKey: ['doctor', user?.uid],
    queryFn: async () => {
      const doc = await getDoctorByUid(user!.uid);
      if (!doc) throw new Error('Doctor not found');
      return { id: doc.id, name: doc.doctorName, clinicName: doc.clinicName };
    },
    enabled: !!user,
  });

  const { data: reservations } = useQuery({
    queryKey: ['patient-reservations', patientId],
    queryFn: () => getReservationsForPatient(patientId),
    enabled: !!patientId,
  });

  const reservation = useMemo(() => {
    if (!reservations || !doctorInfo) return null;
    return reservations.find(r => r.doctorId === doctorInfo.id && r.status !== 'cancelled') || null;
  }, [reservations, doctorInfo]);

  const { data: diagnosisData } = useQuery({
    queryKey: ['diagnosis', reservation?.id],
    queryFn: () => getDiagnosisByReservation(reservation!.id),
    enabled: !!reservation?.id,
  });

  useEffect(() => {
    if (diagnosisData) {
      setDiagnosis(diagnosisData);
      setNotes(diagnosisData.notes);
      setPrescriptions(diagnosisData.prescriptions ?? '');
    }
  }, [diagnosisData]);

  const patientName = reservation?.patientName ?? 'Patient';
  const reservationId = reservation?.id ?? '';

  const handleSave = async () => {
    if (!doctorInfo || !patientId) return;
    setSaving(true);
    try {
      if (diagnosis) {
        await updateDiagnosis(diagnosis.id, { notes, prescriptions });
        Toast.show({ type: 'success', text1: '✅ Diagnosis updated' });
      } else {
        await createDiagnosis({
          reservationId,
          patientId,
          doctorId: doctorInfo.id,
          doctorName: doctorInfo.name,
          clinicName: doctorInfo.clinicName,
          visitDate: new Date(),
          notes,
          prescriptions,
        });
        const freshDiag = await getDiagnosisByReservation(reservationId);
        setDiagnosis(freshDiag);
        Toast.show({ type: 'success', text1: '✅ Diagnosis created' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save diagnosis' });
    } finally { setSaving(false); }
  };

  const handleAddVaccine = async () => {
    if (!vaccineName || !diagnosis) return;
    const vaccine: Vaccine = {
      id: Date.now().toString(),
      name: vaccineName.trim(),
      date: vaccineDate || new Date().toISOString().split('T')[0],
    };
    try {
      await addVaccineToDiagnosis(diagnosis.id, vaccine);
      setDiagnosis(prev => prev ? { ...prev, vaccines: [...prev.vaccines, vaccine] } : prev);
      setVaccineName(''); setVaccineDate('');
      setAddingVaccine(false);
      Toast.show({ type: 'success', text1: '💉 Vaccine added' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to add vaccine' });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background as any} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
            <View style={styles.patientHero}>
              <Avatar name={patientName} size={60} />
              <Text style={styles.patientName}>{patientName}</Text>
            </View>
          </View>

          {/* Diagnosis */}
          <GlassCard style={styles.section} variant="strong" radius={RADIUS.xl}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Diagnosis & Notes</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Write diagnosis notes, observations, and recommendations..."
              placeholderTextColor="rgba(229, 235, 253, 0.2)"
              value={notes}
              onChangeText={setNotes}
              multiline numberOfLines={5}
              textAlignVertical="top"
              selectionColor={COLORS.secondary}
            />
            <TextInput
              style={[styles.textArea, { height: 80 }]}
              placeholder="Prescriptions..."
              placeholderTextColor="rgba(229, 235, 253, 0.2)"
              value={prescriptions}
              onChangeText={setPrescriptions}
              multiline numberOfLines={3}
              textAlignVertical="top"
              selectionColor={COLORS.secondary}
            />
            <GradientButton
              onPress={handleSave}
              label={diagnosis ? 'Update Diagnosis' : 'Save Diagnosis'}
              loading={saving}
              variant="secondary"
              size="md"
            />
          </GlassCard>

          {/* Vaccines */}
          <GlassCard style={styles.section} variant="subtle" radius={RADIUS.xl}>
            <View style={styles.sectionHeader}>
              <Syringe size={18} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Vaccines</Text>
              <TouchableOpacity onPress={() => setAddingVaccine(v => !v)} style={styles.addBtn}>
                <Plus size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {diagnosis?.vaccines.map((v, i) => (
              <View key={i} style={styles.vaccineRow}>
                <View style={styles.vaccineDot} />
                <Text style={styles.vaccineName}>{v.name}</Text>
                <Text style={styles.vaccineDate}>{v.date}</Text>
              </View>
            ))}

            {addingVaccine && (
              <View style={styles.addVaccineForm}>
                <TextInput
                  style={styles.smallInput}
                  placeholder="Vaccine name"
                  placeholderTextColor="rgba(229, 235, 253, 0.25)"
                  value={vaccineName}
                  onChangeText={setVaccineName}
                  selectionColor={COLORS.primary}
                />
                <TextInput
                  style={styles.smallInput}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor="rgba(229, 235, 253, 0.25)"
                  value={vaccineDate}
                  onChangeText={setVaccineDate}
                  selectionColor={COLORS.primary}
                />
                <GradientButton
                  onPress={handleAddVaccine}
                  label="Add Vaccine"
                  size="sm"
                  disabled={!diagnosis}
                />
              </View>
            )}
            {!diagnosis && addingVaccine && (
              <Text style={styles.saveFirstHint}>Save diagnosis first, then add vaccines</Text>
            )}
          </GlassCard>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <GradientButton
              onPress={() => router.push('/(doctor)/transfer')}
              label="Transfer"
              variant="ghost"
              size="md"
              icon={<ArrowRightLeft size={16} color={COLORS.primary} />}
              style={{ flex: 1 }}
            />
            <GradientButton
              onPress={() => {}}
              label="Follow-up"
              variant="ghost"
              size="md"
              icon={<Calendar size={16} color={COLORS.primary} />}
              style={{ flex: 1 }}
            />
          </View>

          {/* Lab files */}
          {diagnosis && diagnosis.analysisFiles.length > 0 && (
            <GlassCard style={styles.section} variant="secondary" radius={RADIUS.xl}>
              <Text style={styles.sectionTitle}>Lab Analysis Files</Text>
              {diagnosis.analysisFiles.map((f, i) => (
                <View key={i} style={styles.fileRow}>
                  <Text style={styles.fileName}>{f.fileName}</Text>
                  <Text style={styles.fileType}>{f.type.toUpperCase()}</Text>
                </View>
              ))}
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.xl, paddingBottom: 100, gap: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  backBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainer, borderWidth: 1,
    borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center',
  },
  patientHero: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  patientName: { color: COLORS.onSurface, fontSize: FONT_SIZE.xl, fontFamily: FONT_FAMILY.headline },
  section: { padding: SPACING.md, gap: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  sectionTitle: { color: COLORS.onSurface, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.title, flex: 1 },
  addBtn: {
    width: 28, height: 28, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(64, 206, 243, 0.1)', borderWidth: 1,
    borderColor: 'rgba(64, 206, 243, 0.25)', alignItems: 'center', justifyContent: 'center',
  },
  textArea: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    padding: SPACING.md, color: COLORS.onSurface, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.body,
    minHeight: 120, textAlignVertical: 'top',
  },
  vaccineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  vaccineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  vaccineName: { color: COLORS.onSurface, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.title, flex: 1 },
  vaccineDate: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.body },
  addVaccineForm: { gap: SPACING.sm },
  smallInput: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md, height: 44, color: COLORS.onSurface, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body,
  },
  saveFirstHint: { color: COLORS.warning, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.body },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileName: { color: COLORS.onSurface, flex: 1, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body },
  fileType: { color: COLORS.secondary, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.label },
});
