import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, FileText, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuthStore } from '@/stores/authStore';
import { getDiagnosesForPatient, attachAnalysisFile } from '@/services/diagnosisService';
import { uploadAnalysisFile } from '@/services/storageService';
import { addNotification } from '@/services/notificationService';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from '@/lib/theme';
import type { Diagnosis, AnalysisFile } from '@/types/diagnosis';
import Toast from 'react-native-toast-message';

export default function LabUpload() {
  const router = useRouter();
  const { user, profile } = useAuthStore();

  const [patientId, setPatientId] = useState('');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [selectedDiag, setSelectedDiag] = useState<Diagnosis | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!patientId.trim()) return;
    setSearching(true);
    try {
      const data = await getDiagnosesForPatient(patientId.trim());
      setDiagnoses(data);
      if (data.length === 0) Toast.show({ type: 'error', text1: 'No diagnoses found for this patient ID' });
    } catch {
      Toast.show({ type: 'error', text1: 'Search failed' });
    } finally { setSearching(false); }
  };

  const handlePickFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false, quality: 0.9,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.fileName ?? `analysis_${Date.now()}.jpg`);
      setFileType(asset.mimeType?.includes('pdf') ? 'pdf' : 'image');
    }
  };

  const handleUpload = async () => {
    if (!fileUri || !selectedDiag || !user || !profile) return;
    setUploading(true);
    try {
      const url = await uploadAnalysisFile(
        selectedDiag.patientId, user.uid, fileUri, fileType, fileName,
      );
      const file: AnalysisFile = {
        id: Date.now().toString(),
        url, type: fileType, fileName,
        labId: user.uid, labName: profile.name,
        uploadedAt: new Date(),
      };
      await attachAnalysisFile(selectedDiag.id, file);
      await addNotification({
        userId: selectedDiag.patientId,
        title: '🔬 Analysis Results Ready',
        body: `Your analysis from ${profile.name} has been attached to your diagnosis.`,
        type: 'analysis_uploaded',
        relatedId: selectedDiag.id,
      });
      Toast.show({ type: 'success', text1: '✅ File uploaded successfully!', text2: 'Patient has been notified' });
      setFileUri(null); setFileName(''); setSelectedDiag(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Upload failed' });
    } finally { setUploading(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background as any} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
            <Text style={styles.title}>Upload Analysis</Text>
          </View>

          {/* Patient search */}
          <GlassCard style={styles.section} variant="strong" radius={RADIUS.xl}>
            <Text style={styles.sectionTitle}>Find Patient</Text>
            <Text style={styles.sectionHint}>Enter the patient's UID to find their diagnoses</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Patient UID"
                placeholderTextColor="rgba(229, 235, 253, 0.25)"
                value={patientId}
                onChangeText={setPatientId}
                autoCapitalize="none"
                selectionColor={COLORS.warning}
              />
              <GradientButton onPress={handleSearch} label="Search" size="sm" loading={searching} variant="warning" />
            </View>
          </GlassCard>

          {/* Diagnoses list */}
          {diagnoses.length > 0 && (
            <GlassCard style={styles.section} variant="subtle" radius={RADIUS.xl}>
              <Text style={styles.sectionTitle}>Select Diagnosis</Text>
              {diagnoses.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setSelectedDiag(d)}
                  style={[styles.diagRow, selectedDiag?.id === d.id && styles.diagRowSelected]}
                >
                  <View style={styles.diagInfo}>
                    <Text style={styles.diagDoctor}>{d.doctorName}</Text>
                    <Text style={styles.diagDate}>
                      {d.visitDate instanceof Date ? d.visitDate.toLocaleDateString() : '--'}
                    </Text>
                  </View>
                  {selectedDiag?.id === d.id && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              ))}
            </GlassCard>
          )}

          {/* File picker */}
          {selectedDiag && (
            <GlassCard style={styles.section} variant="strong" radius={RADIUS.xl}>
              <Text style={styles.sectionTitle}>Select File</Text>
              <TouchableOpacity onPress={handlePickFile} style={styles.filePicker}>
                {fileUri ? (
                  <>
                    <FileText size={32} color={COLORS.warning} />
                    <Text style={styles.fileSelected}>{fileName}</Text>
                    <Text style={styles.fileTap}>Tap to change</Text>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="rgba(229, 235, 253, 0.3)" />
                    <Text style={styles.filePrompt}>Tap to pick PDF or Image</Text>
                  </>
                )}
              </TouchableOpacity>
              {fileUri && (
                <GradientButton
                  onPress={handleUpload}
                  label="Upload & Attach"
                  loading={uploading}
                  size="lg"
                  variant="warning"
                  icon={<Upload size={18} color="#fff" />}
                />
              )}
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
  title: { color: COLORS.onSurface, fontSize: FONT_SIZE.xl, fontFamily: FONT_FAMILY.headline },
  section: { padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: { color: COLORS.onSurface, fontFamily: FONT_FAMILY.title, fontSize: FONT_SIZE.base },
  sectionHint: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  searchInput: {
    flex: 1, backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md, height: 48, color: COLORS.onSurface, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.body,
  },
  diagRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.sm, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'transparent',
  },
  diagRowSelected: { borderColor: COLORS.warning, backgroundColor: 'rgba(245,158,11,0.08)' },
  diagInfo: { flex: 1 },
  diagDoctor: { color: COLORS.onSurface, fontFamily: FONT_FAMILY.title, fontSize: FONT_SIZE.base },
  diagDate: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body },
  selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.warning },
  filePicker: {
    height: 120, borderRadius: RADIUS.lg, borderWidth: 2, borderStyle: 'dashed',
    borderColor: COLORS.glassBorder, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  filePrompt: { color: 'rgba(229, 235, 253, 0.3)', fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body },
  fileSelected: { color: COLORS.onSurface, fontFamily: FONT_FAMILY.title, fontSize: FONT_SIZE.base },
  fileTap: { color: 'rgba(229, 235, 253, 0.3)', fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.body },
});
