import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { clearAuthSession } from "../../services/authservice";
import { createTeam, getTeamErrorMessage, isUnauthorizedTeamError } from "../../services/team.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

export default function CreateTeamScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const reset = async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };
  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Team name is required."); return; }
    if (trimmed.length > 150 || description.trim().length > 5000) { setError("The team name or description is too long."); return; }
    try {
      setSaving(true); setError("");
      await createTeam({ name: trimmed, description: description.trim() || null });
      Toast.show({ type: "success", text1: "Team created" });
      navigation.goBack();
    } catch (e) {
      setError(getTeamErrorMessage(e));
      if (isUnauthorizedTeamError(e)) await reset();
    } finally { setSaving(false); }
  };

  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity disabled={saving} onPress={() => navigation.goBack()}><Text style={s.back}>‹  Back to Teams</Text></TouchableOpacity>
    <View style={s.hero}><Text style={s.eyebrow}>COLLABORATION WORKSPACE</Text><Text style={s.title}>Create Team</Text><Text style={s.subtitle}>Create a focused project space for eligible CampusX students and graduates.</Text></View>
    <View style={s.formCard}>
      <Text style={s.sectionTitle}>Team details</Text>
      <Text style={s.label}>Team name *</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} maxLength={150} placeholder="e.g. Capstone Research Team" placeholderTextColor={colors.textMuted} />
      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, s.area]} value={description} onChangeText={setDescription} maxLength={5000} multiline placeholder="What will your team work on?" placeholderTextColor={colors.textMuted} />
      {error ? <View style={s.errorBox}><Text style={s.error}>{error}</Text></View> : null}
      <TouchableOpacity style={[s.save, saving && s.disabled]} disabled={saving} onPress={() => void save()}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Create Team</Text>}</TouchableOpacity>
    </View>
  </ScrollView>;
}

const s = StyleSheet.create({
  page: ui.screen,
  content: ui.screenContent,
  back: { ...ui.textButton, marginBottom: spacing.lg },
  hero: { marginBottom: spacing.xl },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.1, marginBottom: spacing.sm },
  title: typography.screenTitle,
  subtitle: { ...typography.caption, marginTop: spacing.sm, maxWidth: 340 },
  formCard: ui.card,
  sectionTitle: { ...typography.cardTitle, marginBottom: spacing.sm },
  label: { color: colors.text, fontWeight: "700", marginBottom: spacing.sm, marginTop: spacing.lg },
  input: ui.input,
  area: { height: 132, paddingTop: 14, textAlignVertical: "top" },
  errorBox: { backgroundColor: "rgba(255,113,128,0.12)", borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,113,128,0.35)", marginTop: spacing.lg, padding: spacing.md },
  error: { color: colors.error, textAlign: "center", lineHeight: 20 },
  save: { ...ui.primaryButton, marginTop: spacing.xl },
  disabled: ui.disabled,
});
