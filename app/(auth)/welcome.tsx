import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const selectRole = (role: string) => {
    router.push({ pathname: "/(auth)/login", params: { role } });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />



      <BackgroundDecor />

      {/* Decorative Abstract Image */}
      <View style={styles.abstractWrapper}>
        <Image
          source={require("../../assets/images/welcome_abstract.png")}
          style={styles.abstractImage}
          resizeMode="contain"
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <View style={styles.badgePulse} />
                <Text style={styles.badgeText}>PRECISION DIAGNOSTICS</Text>
              </View>
              <Text style={styles.title}>Welcome to{"\n"}Vitreous</Text>
              <Text style={styles.subtitle}>
                Experience the next generation of medical diagnostics.
                <Text style={styles.subtitleItalic}>
                  {"\n"}Select your gateway to begin.
                </Text>
              </Text>
            </View>

            {/* Asymmetric Role Grid */}
            <View style={styles.grid}>
              {/* Doctor Role */}
              <TouchableOpacity
                style={styles.roleCard}
                onPress={() => selectRole("doctor")}
                activeOpacity={0.8}
              >
                <View style={styles.cardIconBg}>
                  <MaterialIcons name="medical-services" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.roleName}>Doctor</Text>
                  <Text style={styles.roleDesc}>
                    Review patient history, order tests, and interpret results
                    with precision tools.
                  </Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.getStarted}>Get Started</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>

              {/* Lab Role (Elevated) */}
              <TouchableOpacity
                style={[styles.roleCard, styles.labCard]}
                onPress={() => selectRole("lab")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    "rgba(64, 206, 243, 0.15)",
                    "rgba(64, 206, 243, 0.05)",
                  ]}
                  style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: RADIUS["2xl"] },
                  ]}
                />
                <View style={[styles.cardIconBg, styles.labIconBg]}>
                  <MaterialIcons name="biotech" size={32} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.roleName}>Laboratory</Text>
                  <Text style={styles.roleDesc}>
                    Manage clinical samples, process bio-data, and deliver
                    secure digital results.
                  </Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.getStarted}>Enter Portal</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>

              {/* Patient Role */}
              <TouchableOpacity
                style={styles.roleCard}
                onPress={() => selectRole("patient")}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIconBg, styles.patientIconBg]}>
                  <MaterialIcons name="person" size={32} color={COLORS.secondary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.roleName}>Patient</Text>
                  <Text style={styles.roleDesc}>
                    Access your health records, schedule tests, and consult with
                    specialists.
                  </Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text
                    style={[styles.getStarted, { color: COLORS.secondary }]}
                  >
                    Join Vitreous
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color={COLORS.secondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <View style={styles.footerLine} />
              <Text style={styles.footerLabel}>
                SECURE • ENCRYPTED • TRANSPARENT
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  meshContainer: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },

  abstractWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -height * 0.1,
    alignItems: "center",
    opacity: 0.2,
  },
  abstractImage: { width: width * 1.2, height: width * 1.2 },

  scroll: { paddingBottom: 60 },
  content: { paddingHorizontal: 32, paddingTop: 40 },

  header: { alignItems: "center", marginBottom: 48 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 24,
  },
  badgePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    fontWeight: "700",
  },

  title: {
    color: COLORS.onSurface,
    fontSize: 48,
    fontFamily: FONT_FAMILY.display,
    textAlign: "center",
    letterSpacing: -2,
    lineHeight: 52,
    marginBottom: 20,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
  subtitleItalic: { fontStyle: "italic", opacity: 0.6, fontWeight: "300" },

  grid: { gap: 20 },
  roleCard: {
    backgroundColor: "rgba(7, 14, 26, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(65, 72, 86, 0.2)",
    padding: 32,
    borderRadius: RADIUS["2xl"],
    minHeight: 340,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  labCard: {
    marginTop: 10,
    marginBottom: 10,
    borderColor: "rgba(64, 206, 243, 0.3)",
  },

  cardIconBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  labIconBg: { backgroundColor: COLORS.primary },
  patientIconBg: { backgroundColor: "rgba(197, 126, 255, 0.1)" },

  cardContent: { gap: 8 },
  roleName: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "800",
  },
  roleDesc: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
    opacity: 0.6,
    maxWidth: 200,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 32,
  },
  getStarted: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
  },

  footerSection: { alignItems: "center", marginTop: 60 },
  footerLine: {
    width: 1,
    height: 64,
    backgroundColor: "rgba(64, 206, 243, 0.2)",
    marginBottom: 32,
  },
  footerLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 4,
  },
});
