import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Bell, ArrowLeft } from "lucide-react-native";
import { COLORS, FONT_FAMILY } from "@/lib/theme";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  hideBrand?: boolean;
  rightContent?: React.ReactNode;
}

export function TopAppBar({ title, showBack, hideBrand, rightContent }: TopAppBarProps) {
  const { profile, role } = useAuthStore();
  const router = useRouter();

  const handleAvatarPress = () => {
    if (role === "patient") {
      router.push("/(patient)/profile" as any);
    }
  };

  const handleSearchPress = () => {
    if (role === "patient") {
      router.push("/(patient)/explore" as any);
    }
  };

  const handleBellPress = () => {
    if (role === "patient") {
      router.push("/(patient)/notifications" as any);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <ArrowLeft size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              <Avatar uri={profile?.photoURL} name={profile?.name} size={40} />
            </TouchableOpacity>
          )}
          
          <View>
            {!hideBrand && <Text style={styles.brandTitle}>VITREOUS CLINIC</Text>}
            {title && <Text style={styles.screenTitle}>{title}</Text>}
          </View>
        </View>

        <View style={styles.appBarRight}>
          {rightContent || (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={handleSearchPress}>
                <Search size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleBellPress}>
                <Bell size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#070e1a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -0.5,
  },
  screenTitle: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  appBarRight: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
