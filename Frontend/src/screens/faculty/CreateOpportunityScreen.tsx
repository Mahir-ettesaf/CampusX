import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { createOpportunity, getOpportunityErrorMessage, OpportunityInput, OpportunityType } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const types: Array<[OpportunityType, string]> = [["ra", "Research Assistant (RA)"], ["ta", "Teaching Assistant (TA)"], ["research", "Research"]];
const initial = { title: "", description: "", opportunity_type: "ra" as OpportunityType, deadline: "", location: "", is_remote: false };

const validate = (form: typeof initial) => {
  if (!form.title.trim()) return "Title is required.";
  if (!form.description.trim()) return "Description is required.";
  if (!types.some(([type]) => type === form.opportunity_type)) return "Select a valid faculty opportunity type.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.deadline) || new Date(`${form.deadline}T23:59:59`).getTime() < Date.now()) return "Deadline must be a current or future date in YYYY-MM-DD format.";
  return "";
};

export default function CreateOpportunityScreen() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof typeof initial>(key: K, value: typeof initial[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    const validation = validate(form);
    if (validation) { setError(validation); return; }
    try {
      setSaving(true); setError("");
      const input: OpportunityInput = { ...form, title: form.title.trim(), description: form.description.trim(), location: form.location.trim() || null };
      const opportunity = await createOpportunity(input);
      Toast.show({ type: "success", text1: "Draft created", text2: "Publish it when it is ready." });
      navigation.replace("FacultyOpportunityDetails", { opportunityId: opportunity.id });
    } catch (requestError) { setError(getOpportunityErrorMessage(requestError)); }
    finally { setSaving(false); }
  };
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Opportunities</Text></TouchableOpacity>
    <Text style={styles.title}>Create Opportunity</Text><Text style={styles.subtitle}>Create a focused academic or research opportunity for CampusX students.</Text><View style={styles.formCard}>
    <Field label="Title" value={form.title} onChangeText={(value) => update("title", value)} />
    <Field label="Description" value={form.description} multiline onChangeText={(value) => update("description", value)} />
    <Text style={styles.label}>Opportunity type</Text><View style={styles.types}>{types.map(([type, label]) => <TouchableOpacity key={type} style={[styles.type, form.opportunity_type === type && styles.typeSelected]} onPress={() => update("opportunity_type", type)}><Text style={form.opportunity_type === type ? styles.typeTextSelected : styles.typeText}>{label}</Text></TouchableOpacity>)}</View>
    <Field label="Deadline (YYYY-MM-DD)" value={form.deadline} placeholder="2027-12-31" onChangeText={(value) => update("deadline", value)} />
    <Field label="Location (optional)" value={form.location} onChangeText={(value) => update("location", value)} />
    <View style={styles.remote}><Text style={styles.label}>Remote opportunity</Text><Switch value={form.is_remote} onValueChange={(value) => update("is_remote", value)} /></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <TouchableOpacity style={[styles.submit, saving && styles.disabled]} disabled={saving} onPress={submit}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.submitText}>Save Draft</Text>}</TouchableOpacity></View>
  </ScrollView>;
}

function Field({ label, multiline = false, ...props }: { label: string; value: string; placeholder?: string; multiline?: boolean; onChangeText: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multiline]} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} {...props} /></View>; }
const styles = StyleSheet.create({ page: ui.screen, content: ui.screenContent, back: { ...ui.textButton, marginBottom: spacing.lg }, title: typography.screenTitle, subtitle: { ...typography.caption, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing.lg }, formCard: ui.card, field: { marginBottom: spacing.md }, label: { color: colors.text, fontWeight: "700", marginBottom: spacing.sm }, input: ui.input, multiline: { minHeight: 110 }, types: { gap: spacing.sm, marginBottom: spacing.md }, type: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.input }, typeSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary }, typeText: { color: colors.textMuted }, typeTextSelected: { color: colors.onDark, fontWeight: "700" }, remote: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs, marginBottom: spacing.lg }, error: { color: colors.error, marginBottom: spacing.md }, submit: ui.primaryButton, submitText: ui.primaryButtonText, disabled: ui.disabled });
