import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getApiErrorMessage, requestPasswordReset } from "../../services/authservice";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";
import CampusXAtmosphere from "../../components/CampusXAtmosphere";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Toast.show({ type: "error", text1: "Invalid email", text2: "Enter a valid email address." });
      return;
    }
    try {
      setIsLoading(true);
      await requestPasswordReset(normalizedEmail);
      setSubmitted(true);
    } catch (error) {
      Toast.show({ type: "error", text1: "Unable to request reset", text2: getApiErrorMessage(error, "Please try again later.") });
    } finally {
      setIsLoading(false);
    }
  };

  return <View style={[ui.screen, styles.container]}>
    <CampusXAtmosphere />
    <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}><Text style={styles.back}>‹  Back to Login</Text></TouchableOpacity>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
      <Text style={styles.title}>Forgot password?</Text>
      <Text style={styles.subtitle}>{submitted ? "If an account exists, we sent a password-reset link to that email address." : "Enter your email and we’ll send a secure password-reset link."}</Text>
      {!submitted && <><TextInput style={ui.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="send" onSubmitEditing={() => void submit()} editable={!isLoading} selectionColor={colors.primary} cursorColor={colors.primary} /><TouchableOpacity style={[ui.primaryButton, styles.button, isLoading && ui.disabled]} onPress={() => void submit()} disabled={isLoading}>{isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Send Reset Link</Text>}</TouchableOpacity></>}
      {submitted && <TouchableOpacity style={[ui.primaryButton, styles.button]} onPress={() => navigation.navigate("Login")}><Text style={ui.primaryButtonText}>Return to Login</Text></TouchableOpacity>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: "center", overflow: "hidden" },
  back: { ...ui.textButton, position: "absolute", top: 64, left: spacing.xl },
  card: ui.card,
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, marginBottom: spacing.sm },
  title: typography.screenTitle,
  subtitle: { ...typography.caption, marginTop: spacing.sm, marginBottom: spacing.xl },
  button: { marginTop: spacing.lg },
});
