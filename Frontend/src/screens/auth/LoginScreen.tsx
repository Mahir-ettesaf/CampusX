import { useRef, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  getApiErrorMessage,
  loginUser,
  saveAuthSession,
} from "../../services/authservice";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";
import CampusXAtmosphere from "../../components/CampusXAtmosphere";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const passwordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Toast.show({ type: "error", text1: "Missing information", text2: "Email and password are required." });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Toast.show({ type: "error", text1: "Invalid email", text2: "Enter a valid email address." });
      return;
    }

    setIsLoading(true);

    try {
      const session = await loginUser({ email: normalizedEmail, password });
      await saveAuthSession(session);
      navigation.replace("Authenticated", { user: session.user });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: getApiErrorMessage(error, "Please check your connection and try again."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[ui.screen, styles.container]}>
      <CampusXAtmosphere />
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Welcome back. Continue building your future.</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={[ui.input, styles.input]}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        style={[ui.input, styles.input]}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        ref={passwordInputRef}
        autoComplete="password"
        returnKeyType="done"
        onSubmitEditing={() => void handleLogin()}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} disabled={isLoading}>
        <Text style={styles.forgotPassword}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[ui.primaryButton, styles.button, isLoading && ui.disabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={isLoading}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    overflow: "hidden",
  },
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: { ...typography.caption, textAlign: "center", marginBottom: spacing.xxl },
  input: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
  forgotPassword: {
    color: colors.primary,
    fontWeight: "700",
    textAlign: "right",
    marginTop: -spacing.sm,
  },
  link: {
    marginTop: spacing.xl,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
  },
});
