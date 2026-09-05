import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { createOpportunity, getOpportunityErrorMessage, OpportunityInput, OpportunityType } from "../../services/opportunity.service";

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
    <Text style={styles.title}>Create Opportunity</Text>
    <Field label="Title" value={form.title} onChangeText={(value) => update("title", value)} />
    <Field label="Description" value={form.description} multiline onChangeText={(value) => update("description", value)} />
    <Text style={styles.label}>Opportunity type</Text><View style={styles.types}>{types.map(([type, label]) => <TouchableOpacity key={type} style={[styles.type, form.opportunity_type === type && styles.typeSelected]} onPress={() => update("opportunity_type", type)}><Text style={form.opportunity_type === type ? styles.typeTextSelected : styles.typeText}>{label}</Text></TouchableOpacity>)}</View>
    <Field label="Deadline (YYYY-MM-DD)" value={form.deadline} placeholder="2027-12-31" onChangeText={(value) => update("deadline", value)} />
    <Field label="Location (optional)" value={form.location} onChangeText={(value) => update("location", value)} />
    <View style={styles.remote}><Text style={styles.label}>Remote opportunity</Text><Switch value={form.is_remote} onValueChange={(value) => update("is_remote", value)} /></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <TouchableOpacity style={[styles.submit, saving && styles.disabled]} disabled={saving} onPress={submit}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Draft</Text>}</TouchableOpacity>
  </ScrollView>;
}

function Field({ label, multiline = false, ...props }: { label: string; value: string; placeholder?: string; multiline?: boolean; onChangeText: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multiline]} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} {...props} /></View>; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24, paddingBottom: 48 }, back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 }, title: { fontSize: 28, fontWeight: "bold", color: "#1E3A8A", marginBottom: 18 }, field: { marginBottom: 14 }, label: { color: "#333", fontWeight: "600", marginBottom: 6 }, input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, color: "#333" }, multiline: { minHeight: 110 }, types: { gap: 8, marginBottom: 14 }, type: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, padding: 11 }, typeSelected: { backgroundColor: "#2563EB" }, typeText: { color: "#2563EB" }, typeTextSelected: { color: "#fff", fontWeight: "600" }, remote: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 16 }, error: { color: "#DC2626", marginBottom: 12 }, submit: { backgroundColor: "#10B981", borderRadius: 10, padding: 15, alignItems: "center" }, submitText: { color: "#fff", fontWeight: "700", fontSize: 16 }, disabled: { opacity: 0.65 } });
