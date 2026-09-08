import { Image, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";
import CampusXAtmosphere from "../../components/CampusXAtmosphere";

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={[ui.screen, styles.container]}>
      <CampusXAtmosphere />
      <View style={styles.brandMark}><Image source={require("../../../assets/icon.png")} style={styles.brandMarkImage} resizeMode="contain" /></View>
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
    overflow: "hidden",
  },
  brandMark: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", overflow: "hidden", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.primary, marginBottom: spacing.lg },
  brandMarkImage: { width: "100%", height: "100%" },
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
