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
import { getApiErrorMessage, registerUser } from "../../services/authservice";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";
import CampusXAtmosphere from "../../components/CampusXAtmosphere";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showError = (title: string, message: string) => {
    setErrorMessage(message);
    Toast.show({ type: "error", text1: title, text2: message });
  };

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    setErrorMessage("");

    if (!trimmedName || !normalizedEmail || !password || !confirmPassword || !role) {
      showError("Missing information", "Please complete every field and select a role.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      showError("Invalid email", "Enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match", "Confirm the same password in both fields.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser({
        full_name: trimmedName,
        email: normalizedEmail,
        password,
        role,
      });
      Toast.show({ type: "success", text1: "Account created", text2: response.message || "You can now log in." });
      navigation.replace("Login");
    } catch (error) {
      showError(
        "Registration failed",
        getApiErrorMessage(error, "Please check your connection and try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[ui.screen, styles.container]}>
      <CampusXAtmosphere />
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join the CampusX career community.</Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor={colors.textMuted}
        style={[ui.input, styles.input]}
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => emailInputRef.current?.focus()}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        style={[ui.input, styles.input]}
        value={email}
        onChangeText={setEmail}
        ref={emailInputRef}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
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
        autoComplete="new-password"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor={colors.textMuted}
        style={[ui.input, styles.input]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        ref={confirmPasswordInputRef}
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={() => void handleRegister()}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />

      <Text style={styles.roleTitle}>Select Your Role</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "student" && styles.selectedRole]}
          onPress={() => setRole("student")}
        >
          <Text
            style={[
              styles.roleText,
              role === "student" && styles.selectedRoleText,
            ]}
          >
            Student
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "graduate" && styles.selectedRole,
          ]}
          onPress={() => setRole("graduate")}
        >
          <Text
            style={[
              styles.roleText,
              role === "graduate" && styles.selectedRoleText,
            ]}
          >
            Graduate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "faculty" && styles.selectedRole]}
          onPress={() => setRole("faculty")}
        >
          <Text
            style={[
              styles.roleText,
              role === "faculty" && styles.selectedRoleText,
            ]}
          >
            Faculty
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "recruiter" && styles.selectedRole,
          ]}
          onPress={() => setRole("recruiter")}
        >
          <Text
            style={[
              styles.roleText,
              role === "recruiter" && styles.selectedRoleText,
            ]}
          >
            Recruiter
          </Text>
        </TouchableOpacity>
      </View>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <TouchableOpacity
        style={[ui.primaryButton, styles.button, isLoading && ui.disabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")} disabled={isLoading}>
        <Text style={styles.link}>Already have an account? Login</Text>
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
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: { ...typography.caption, textAlign: "center", marginBottom: spacing.xl },
  input: {
    marginBottom: spacing.md,
  },
  roleTitle: {
    ...typography.cardTitle,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  roleButton: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  selectedRole: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 16,
  },

  selectedRoleText: {
    color: colors.onPrimary,
  },
  button: {
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  link: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
  },
});
