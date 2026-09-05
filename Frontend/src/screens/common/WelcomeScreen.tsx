import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={[ui.screen, styles.container]}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>CX</Text></View>
      <Text style={styles.title}>CampusX</Text>
      <Text style={styles.subtitle}>Your career and campus experience, connected.</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={ui.primaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={ui.primaryButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ui.outlineButton, styles.registerButton]} onPress={() => navigation.navigate("Register")}>
          <Text style={ui.outlineButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  brandMark: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.lg },
  brandMarkText: { color: colors.primary, fontSize: 23, fontWeight: "800", letterSpacing: 1 },
  title: {
    ...typography.screenTitle,
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.textMuted,
    maxWidth: 290,
  },
  actions: {
    width: "100%",
    gap: spacing.md,
    marginTop: 48,
  },
  registerButton: { borderColor: colors.secondary },
});
