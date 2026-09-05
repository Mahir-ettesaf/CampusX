import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { companyError, createCompany } from "../../services/company.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const isHttpUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } };
const fields = [{ key: "name", label: "Company Name", placeholder: "Enter company name" }, { key: "description", label: "Description", placeholder: "Tell students about your company" }, { key: "website", label: "Website", placeholder: "https://yourcompany.com" }, { key: "logo", label: "Logo URL", placeholder: "https://…" }, { key: "location", label: "Location", placeholder: "City or work location" }] as const;

export default function CreateCompanyScreen() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({ name: "", description: "", website: "", logo: "", location: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    const name = form.name.trim(), website = form.website.trim(), logo = form.logo.trim();
    if (!name || name.length > 150) return setError("Company name is required and must be 150 characters or fewer.");
    if (form.description.length > 5000) return setError("Description is too long.");
    if (form.location.length > 150) return setError("Location must be 150 characters or fewer.");
    if (website && !isHttpUrl(website)) return setError("Website must be a valid HTTP or HTTPS URL.");
    if (logo && !isHttpUrl(logo)) return setError("Logo URL must be a valid HTTP or HTTPS URL.");
    try {
      setSaving(true); setError("");
      await createCompany({ name, description: form.description.trim() || null, website: website || null, logo: logo || null, location: form.location.trim() || null });
      Toast.show({ type: "success", text1: "Pending Admin Approval", text2: "Your company has been submitted for review." });
      navigation.goBack();
    } catch (requestError) { setError(companyError(requestError)); } finally { setSaving(false); }
  };
  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Recruiter Profile</Text></TouchableOpacity>
    <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="business-outline" size={23} color={colors.primary} /></View><View style={styles.headerCopy}><Text style={typography.screenTitle}>Create Company</Text><Text style={typography.caption}>Build your employer presence on CampusX.</Text></View></View>
    <View style={styles.notice}><Ionicons name="time-outline" size={20} color={colors.warning} /><Text style={styles.note}>New companies remain pending until an administrator approves them.</Text></View>
    <View style={styles.formCard}>{fields.map((field) => <View key={field.key} style={styles.inputGroup}><Text style={styles.label}>{field.label}</Text><TextInput style={[styles.input, field.key === "description" && styles.multiline]} multiline={field.key === "description"} placeholder={field.placeholder} placeholderTextColor={colors.textMuted} value={form[field.key]} onChangeText={(value) => set(field.key, value)} editable={!saving} autoCapitalize={field.key === "website" || field.key === "logo" ? "none" : "sentences"} /></View>)}{error ? <Text style={styles.error}>{error}</Text> : null}<TouchableOpacity style={[ui.primaryButton, saving && ui.disabled]} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Submit for Approval</Text>}</TouchableOpacity></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { ...ui.screenContent }, back: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md }, header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }, headerIcon: { width: 46, height: 46, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, headerCopy: { flex: 1, gap: spacing.xs }, notice: { ...ui.card, flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, marginBottom: spacing.lg, backgroundColor: "#302817", borderColor: "#635022" }, note: { flex: 1, color: colors.warning, fontSize: 13, lineHeight: 19 }, formCard: { ...ui.card }, inputGroup: { marginBottom: spacing.md }, label: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: spacing.xs }, input: { ...ui.input }, multiline: { minHeight: 108, textAlignVertical: "top" }, error: { color: colors.error, marginBottom: spacing.md, lineHeight: 20 },
});
