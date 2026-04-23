import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, ArrowRightLeft } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { GradientButton } from "@/components/ui/GradientButton";
import { getAllDoctors } from "@/services/doctorService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import type { Doctor } from "@/types/doctor";
import Toast from "react-native-toast-message";

export default function TransferScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const all = await getAllDoctors();
      setDoctors(
        all.filter(
          (d) =>
            d.doctorName.toLowerCase().includes(search.toLowerCase()) ||
            d.specialization.toLowerCase().includes(search.toLowerCase()) ||
            d.clinicName.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = () => {
    if (!selected) return;
    Toast.show({
      type: "success",
      text1: `Patient transferred to Dr. ${selected.doctorName}`,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={20} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.title}>Transfer Patient</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Search size={16} color="rgba(229, 235, 253, 0.3)" />
            <TextInput
              style={styles.input}
              placeholder="Search doctor or specialization..."
              placeholderTextColor="rgba(229, 235, 253, 0.25)"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              selectionColor={COLORS.primary}
            />
          </View>
          <GradientButton
            onPress={handleSearch}
            label="Search"
            size="sm"
            loading={loading}
          />
        </View>

        <FlatList
          data={doctors}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelected(item)}
              style={[
                styles.doctorRow,
                selected?.id === item.id && styles.doctorRowSelected,
              ]}
            >
              <Avatar uri={item.photoURL} name={item.doctorName} size={44} />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{item.doctorName}</Text>
                <Text style={styles.doctorSpec}>
                  {item.specialization} · {item.clinicName}
                </Text>
              </View>
              {selected?.id === item.id && <View style={styles.selectedDot} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />

        {selected && (
          <View style={styles.confirmBar}>
            <GradientButton
              onPress={handleTransfer}
              label={`Transfer to Dr. ${selected.doctorName}`}
              size="lg"
              icon={<ArrowRightLeft size={18} color="#fff" />}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.headline,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  input: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.body,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  doctorRowSelected: { backgroundColor: "rgba(64, 206, 243, 0.05)" },
  doctorInfo: { flex: 1 },
  doctorName: {
    color: COLORS.onSurface,
    fontFamily: FONT_FAMILY.title,
    fontSize: FONT_SIZE.base,
  },
  doctorSpec: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.body,
    marginTop: 2,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  confirmBar: {
    padding: SPACING.xl,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
});
