import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
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

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1E3A8A",
    marginBottom: 30,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },

  roleTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },

  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  roleButton: {
    width: "48%",
    borderWidth: 1.5,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  selectedRole: {
    backgroundColor: "#2563EB",
  },

  roleText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 16,
  },

  selectedRoleText: {
    color: "#fff",
  },

  button: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#2563EB",
    fontWeight: "500",
  },
});
