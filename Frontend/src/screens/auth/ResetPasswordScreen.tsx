import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getApiErrorMessage, resetPassword } from "../../services/authservice";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";
import CampusXAtmosphere from "../../components/CampusXAtmosphere";

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const token = typeof route.params?.token === "string" ? route.params.token : "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    if (!token) { Toast.show({ type: "error", text1: "Invalid reset link", text2: "Request a new password-reset link." }); return; }
    if (password.length < 8) { Toast.show({ type: "error", text1: "Password too short", text2: "Use at least 8 characters." }); return; }
    if (password !== confirmation) { Toast.show({ type: "error", text1: "Passwords do not match", text2: "Enter the same password twice." }); return; }
    try {
      setIsLoading(true);
      await resetPassword(token, password);
      Toast.show({ type: "success", text1: "Password reset successful", text2: "You can now log in with your new password." });
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      Toast.show({ type: "error", text1: "Unable to reset password", text2: getApiErrorMessage(error, "Please request a new reset link.") });
    } finally {
      setIsLoading(false);
    }
  };

  return <View style={[ui.screen, styles.container]}><CampusXAtmosphere /><View style={styles.card}><Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text><Text style={styles.title}>Set a new password</Text><Text style={styles.subtitle}>Choose a secure password for your CampusX account.</Text><TextInput style={ui.input} value={password} onChangeText={setPassword} placeholder="New password" placeholderTextColor={colors.textMuted} secureTextEntry autoComplete="new-password" returnKeyType="next" editable={!isLoading} selectionColor={colors.primary} cursorColor={colors.primary} /><TextInput style={[ui.input, styles.confirmation]} value={confirmation} onChangeText={setConfirmation} placeholder="Confirm new password" placeholderTextColor={colors.textMuted} secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={() => void submit()} editable={!isLoading} selectionColor={colors.primary} cursorColor={colors.primary} /><TouchableOpacity style={[ui.primaryButton, styles.button, isLoading && ui.disabled]} onPress={() => void submit()} disabled={isLoading}>{isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Reset Password</Text>}</TouchableOpacity></View></View>;
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: "center", overflow: "hidden" }, card: ui.card,
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, marginBottom: spacing.sm }, title: typography.screenTitle,
  subtitle: { ...typography.caption, marginTop: spacing.sm, marginBottom: spacing.xl }, confirmation: { marginTop: spacing.md }, button: { marginTop: spacing.lg },
});
