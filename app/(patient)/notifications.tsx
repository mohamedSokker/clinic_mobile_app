import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, CheckCheck } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  subscribeToNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import { useAuthStore } from "@/stores/authStore";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import type { AppNotification } from "@/types/notification";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

const TYPE_ICONS: Record<string, string> = {
  queue_shift: "⬆️",
  emergency_insert: "⚠️",
  cancellation: "❌",
  time_slot_taken: "🔒",
  reservation_confirmed: "✅",
  analysis_uploaded: "🔬",
  transfer: "🔄",
  reminder: "🔔",
};

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setNotifs);
  }, [user]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  };

  const handleNotifPress = async (notif: AppNotification) => {
    if (!notif.read) await markNotificationRead(notif.id);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>ALERTS & UPDATES</Text>
            <Text style={styles.title}>InBox</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.markAllBtn}
            >
              <CheckCheck size={14} color={COLORS.primary} />
              <Text style={styles.markAllLabel}>CLEAR {unreadCount}</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotifPress(item)}
              style={styles.notifWrapper}
              activeOpacity={0.8}
            >
              <GlassCard
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                variant="subtle"
                shadow={!item.read}
              >
                <View
                  style={[
                    styles.notifIconWrapper,
                    !item.read && styles.notifIconWrapperUnread,
                  ]}
                >
                  <Text style={styles.notifIcon}>
                    {TYPE_ICONS[item.type] ?? "🔔"}
                  </Text>
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifBody} numberOfLines={3}>
                    {item.body}
                  </Text>
                  <Text style={styles.notifTime}>
                    {item.createdAt instanceof Date
                      ? item.createdAt
                          .toLocaleString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "2-digit",
                          })
                          .toUpperCase()
                      : "--"}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrapper}>
                <Bell size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>All Caught Up</Text>
              <Text style={styles.emptySubtext}>
                Your inbox is pristine. New updates will appear here as they
                manifest.
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
  },
  title: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE["4xl"],
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1.5,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
  },
  markAllLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  notifWrapper: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: SPACING.md,
    gap: SPACING.md,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  notifCardUnread: { backgroundColor: "rgba(64, 206, 243, 0.03)" },
  notifIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifIconWrapperUnread: { backgroundColor: "rgba(64, 206, 243, 0.1)" },
  notifIcon: { fontSize: 20 },
  notifContent: { flex: 1, gap: 2 },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitle: {
    color: COLORS.onSurface,
    fontFamily: FONT_FAMILY.title,
    fontSize: FONT_SIZE.base,
  },
  notifBody: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
    opacity: 0.7,
  },
  notifTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    marginTop: 6,
    opacity: 0.4,
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: SPACING.xl,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.onSurface,
    fontSize: FONT_SIZE.xl,
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    opacity: 0.5,
    lineHeight: 20,
  },
});
