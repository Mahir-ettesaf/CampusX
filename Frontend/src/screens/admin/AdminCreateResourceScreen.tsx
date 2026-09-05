import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { clearAuthSession } from "../../services/authservice";
import { AcademicResourceStatus, AcademicResourceType, createResource, getAcademicResourceErrorMessage, isUnauthorizedAcademicResourceError } from "../../services/academic-resource.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const types: AcademicResourceType[] = ["lecture_notes", "slides", "lab_manual", "previous_questions", "research_material", "other"];
const statuses: AcademicResourceStatus[] = ["draft", "published", "archived"];

export default function AdminCreateResourceScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [subject, setSubject] = useState(""); const [url, setUrl] = useState("");
  const [type, setType] = useState<AcademicResourceType>("lecture_notes"); const [status, setStatus] = useState<AcademicResourceStatus>("draft"); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const save = async () => {
    if (!title.trim() || title.trim().length > 200 || description.length > 5000 || subject.length > 150 || url.length > 2048 || (url && !/^https?:\/\/\S+$/i.test(url))) { setError("Enter a title and valid optional fields (URL must be HTTP/HTTPS)."); return; }
    try { setSaving(true); await createResource({ title: title.trim(), description: description.trim() || null, subject: subject.trim() || null, resource_url: url.trim() || null, resource_type: type, status }); Toast.show({ type: "success", text1: "Resource created" }); navigation.goBack(); }
    catch (requestError) { setError(getAcademicResourceErrorMessage(requestError)); if (isUnauthorizedAcademicResourceError(requestError)) { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); } }
    finally { setSaving(false); }
  };
  return <Form title="Create Resource" values={{ title, description, subject, url, type, status }} setters={{ setTitle, setDescription, setSubject, setUrl, setType, setStatus }} saving={saving} error={error} save={save} back={() => navigation.goBack()} />;
}

export function Form({ title, values, setters, saving, error, save, back }: { title: string; values: any; setters: any; saving: boolean; error: string; save: () => void; back: () => void }) {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity disabled={saving} onPress={back}><Text style={styles.back}>Back to Resources</Text></TouchableOpacity>
    <Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>Add a polished resource entry for the CampusX academic library.</Text>
    <View style={styles.form}>
      <TextInput style={styles.input} placeholder="Title" placeholderTextColor={colors.textMuted} value={values.title} onChangeText={setters.setTitle} editable={!saving} />
      <TextInput style={[styles.input, styles.area]} placeholder="Description (optional)" placeholderTextColor={colors.textMuted} value={values.description} onChangeText={setters.setDescription} editable={!saving} multiline />
      <TextInput style={styles.input} placeholder="Subject (optional)" placeholderTextColor={colors.textMuted} value={values.subject} onChangeText={setters.setSubject} editable={!saving} />
      <TextInput style={styles.input} placeholder="External URL (optional)" placeholderTextColor={colors.textMuted} value={values.url} onChangeText={setters.setUrl} editable={!saving} autoCapitalize="none" />
      <Text style={styles.label}>Type</Text><View style={styles.row}>{types.map((item) => <Choice key={item} value={item} selected={values.type === item} onPress={() => setters.setType(item)} />)}</View>
      <Text style={styles.label}>Status</Text><View style={styles.row}>{statuses.map((item) => <Choice key={item} value={item} selected={values.status === item} onPress={() => setters.setStatus(item)} />)}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={[styles.save, saving && ui.disabled]} disabled={saving} onPress={save}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveText}>Save Resource</Text>}</TouchableOpacity>
    </View>
  </ScrollView>;
}

function Choice({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) { return <TouchableOpacity style={[styles.choice, selected && styles.selected]} onPress={onPress}><Text style={selected ? styles.selectedText : styles.choiceText}>{value.replace(/_/g, " ")}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  page: ui.screen, content: ui.screenContent, back: { ...ui.textButton, marginBottom: spacing.lg }, title: typography.screenTitle,
  subtitle: { ...typography.caption, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing.lg }, form: ui.card, input: { ...ui.input, marginBottom: spacing.sm }, area: { minHeight: 104, textAlignVertical: "top" }, label: { color: colors.text, fontSize: 14, fontWeight: "800", marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, choice: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.input }, selected: { backgroundColor: colors.secondary, borderColor: colors.secondary }, choiceText: { color: colors.textMuted, textTransform: "capitalize", fontSize: 12, fontWeight: "700" }, selectedText: { color: colors.onDark, textTransform: "capitalize", fontSize: 12, fontWeight: "700" },
  save: { ...ui.primaryButton, marginTop: spacing.xl }, saveText: ui.primaryButtonText, error: { color: colors.error, textAlign: "center", marginTop: spacing.lg },
});
