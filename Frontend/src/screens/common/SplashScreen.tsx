import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getStoredAuthSession } from "../../services/authservice";
import { colors, spacing, typography } from "../../theme/CampusXTheme";

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useFocusEffect(useCallback(() => {
    let isActive = true;

    const restoreSession = async () => {
      try {
        const session = await getStoredAuthSession();
        if (!isActive) return;

        navigation.replace(
          session ? "Authenticated" : "Welcome",
          session ? { user: session.user } : undefined,
        );
      } catch {
        if (!isActive) return;
        navigation.replace("Welcome");
      }
    };

    void restoreSession();
    return () => { isActive = false; };
  }, [navigation]));

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={require("../../../assets/icon.png")} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>CampusX</Text>
        <Text style={styles.tagline}>Integrated Student Career & Academic Platform</Text>
        <ActivityIndicator color={colors.secondary} style={styles.loader} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, overflow: "hidden" },
  content: { alignItems: "center", paddingHorizontal: spacing.xl, zIndex: 1 },
  glowTop: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: colors.accentSoft, opacity: 0.55, top: -130, right: -80 },
  glowBottom: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: colors.secondary, opacity: 0.1, bottom: -120, left: -80 },
  logoWrap: { width: 104, height: 104, borderRadius: 52, overflow: "hidden", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.primary, elevation: 5, shadowColor: colors.secondary, shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 7 } },
  logo: { width: "100%", height: "100%" },
  brand: { ...typography.screenTitle, fontSize: 34, marginTop: spacing.lg },
  tagline: { ...typography.caption, textAlign: "center", marginTop: spacing.sm, maxWidth: 260 },
  loader: { marginTop: spacing.xxl },
});
