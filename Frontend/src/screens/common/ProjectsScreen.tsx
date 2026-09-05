import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { clearAuthSession } from "../../services/authservice";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";
import {
  createMyProject,
  deleteMyProject,
  getMyProjects,
  getProjectErrorMessage,
  isUnauthorizedProjectError,
  PortfolioProject,
  ProjectInput,
  ProjectType,
  PROJECT_TYPES,
  updateMyProject,
  uploadMyProjectFile,
} from "../../services/project.service";

type ProjectForm = {
  title: string;
  description: string;
  project_type: ProjectType;
  start_date: string;
  end_date: string;
  project_url: string;
  github_url: string;
  technologies: string;
};

const emptyForm: ProjectForm = {
  title: "",
  description: "",
  project_type: "academic",
  start_date: "",
  end_date: "",
  project_url: "",
  github_url: "",
  technologies: "",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (value: string) => {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const isValidHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);
const displayDate = (value: string | null) => value?.slice(0, 10) || null;

export default function ProjectsScreen() {
  const navigation = useNavigation<any>();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingProjectId, setUploadingProjectId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const loadProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      setProjects(await getMyProjects());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getProjectErrorMessage(error));
      if (isUnauthorizedProjectError(error)) await handleUnauthorized();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const updateFormField = (field: keyof ProjectForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value } as ProjectForm));
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Enter a project title.";
    if (form.title.trim().length > 150) return "Project title must be 150 characters or fewer.";
    if (form.description.length > 5000) return "Description must be 5000 characters or fewer.";
    if (form.technologies.length > 2000) return "Technologies must be 2000 characters or fewer.";
    if (form.start_date.trim() && !isValidDate(form.start_date.trim())) return "Start date must use YYYY-MM-DD.";
    if (form.end_date.trim() && !isValidDate(form.end_date.trim())) return "End date must use YYYY-MM-DD.";
    if (form.start_date.trim() && form.end_date.trim() && form.end_date.trim() < form.start_date.trim()) return "End date cannot be earlier than start date.";
    if (form.project_url.trim() && !isValidHttpUrl(form.project_url.trim())) return "Project URL must start with http:// or https://.";
    if (form.github_url.trim() && !isValidHttpUrl(form.github_url.trim())) return "GitHub URL must start with http:// or https://.";
    if (form.project_url.trim().length > 2048 || form.github_url.trim().length > 2048) return "URLs must be 2048 characters or fewer.";
    return null;
  };

  const getFormPayload = (): ProjectInput => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    project_type: form.project_type,
    start_date: form.start_date.trim() || null,
    end_date: form.end_date.trim() || null,
    project_url: form.project_url.trim() || null,
    github_url: form.github_url.trim() || null,
    technologies: form.technologies.trim() || null,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProjectId(null);
  };

  const handleSave = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      Toast.show({ type: "error", text1: "Check your project", text2: validationMessage });
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      if (editingProjectId === null) await createMyProject(getFormPayload());
      else await updateMyProject(editingProjectId, getFormPayload());
      const wasEditing = editingProjectId !== null;
      resetForm();
      await loadProjects();
      Toast.show({ type: "success", text1: wasEditing ? "Project updated" : "Project created", text2: "Your project information has been saved." });
    } catch (error) {
      const message = getProjectErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to save project", text2: message });
      if (isUnauthorizedProjectError(error)) await handleUnauthorized();
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (project: PortfolioProject) => {
    setEditingProjectId(project.id);
    setForm({
      title: project.title,
      description: project.description || "",
      project_type: project.project_type,
      start_date: displayDate(project.start_date) || "",
      end_date: displayDate(project.end_date) || "",
      project_url: project.project_url || "",
      github_url: project.github_url || "",
      technologies: project.technologies || "",
    });
    setErrorMessage("");
  };

  const handleDelete = (project: PortfolioProject) => {
    Alert.alert("Delete project?", `Delete “${project.title}”? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void deleteProject(project) },
    ]);
  };
  const uploadFile = async (project: PortfolioProject) => { const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"], copyToCacheDirectory: true }); if (result.canceled) return; const file = result.assets[0]; if (!file || (file.size !== undefined && file.size > 10 * 1024 * 1024)) { setErrorMessage("Choose a PDF, DOCX, JPG, or PNG file no larger than 10 MB."); return; } try { setUploadingProjectId(project.id); setErrorMessage(""); await uploadMyProjectFile(project.id, { uri: file.uri, name: file.name, mimeType: file.mimeType || "application/pdf" }); await loadProjects(); Toast.show({ type: "success", text1: "Project evidence uploaded" }); } catch (error) { const message = getProjectErrorMessage(error); setErrorMessage(message); if (isUnauthorizedProjectError(error)) await handleUnauthorized(); } finally { setUploadingProjectId(null); } };

  const deleteProject = async (project: PortfolioProject) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deleteMyProject(project.id);
      if (editingProjectId === project.id) resetForm();
      await loadProjects();
      Toast.show({ type: "success", text1: "Project deleted", text2: "Your project was removed." });
    } catch (error) {
      const message = getProjectErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to delete project", text2: message });
      if (isUnauthorizedProjectError(error)) await handleUnauthorized();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadProjects(true)} tintColor={colors.primary} />}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isSaving}><Text style={styles.backText}>Back to Profile</Text></TouchableOpacity>
      <Text style={styles.title}>Projects</Text>
      <Text style={styles.subtitle}>Build a portfolio of academic, professional, and personal work.</Text>

      {!!errorMessage && <View style={styles.errorSection}><Text style={styles.errorText}>{errorMessage}</Text><TouchableOpacity style={styles.retryButton} onPress={() => loadProjects()} disabled={isSaving}><Text style={styles.retryButtonText}>Retry</Text></TouchableOpacity></View>}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{editingProjectId === null ? "Add Project" : "Edit Project"}</Text>
        <FormInput label="Title" value={form.title} onChangeText={(value) => updateFormField("title", value)} editable={!isSaving} />
        <FormInput label="Description (optional)" value={form.description} onChangeText={(value) => updateFormField("description", value)} editable={!isSaving} multiline />
        <Text style={styles.label}>Project type</Text>
        <ProjectTypePicker selected={form.project_type} onSelect={(value) => setForm((currentForm) => ({ ...currentForm, project_type: value }))} disabled={isSaving} />
        <FormInput label="Start date (optional, YYYY-MM-DD)" value={form.start_date} onChangeText={(value) => updateFormField("start_date", value)} editable={!isSaving} autoCapitalize="none" />
        <FormInput label="End date (optional, YYYY-MM-DD)" value={form.end_date} onChangeText={(value) => updateFormField("end_date", value)} editable={!isSaving} autoCapitalize="none" />
        <FormInput label="Project URL (optional)" value={form.project_url} onChangeText={(value) => updateFormField("project_url", value)} editable={!isSaving} autoCapitalize="none" keyboardType="url" />
        <FormInput label="GitHub URL (optional)" value={form.github_url} onChangeText={(value) => updateFormField("github_url", value)} editable={!isSaving} autoCapitalize="none" keyboardType="url" />
        <FormInput label="Technologies (optional)" value={form.technologies} onChangeText={(value) => updateFormField("technologies", value)} editable={!isSaving} multiline />
        <TouchableOpacity style={[styles.primaryButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingProjectId === null ? "Create Project" : "Save Project"}</Text>}
        </TouchableOpacity>
        {editingProjectId !== null && <TouchableOpacity style={styles.cancelButton} onPress={resetForm} disabled={isSaving}><Text style={styles.cancelButtonText}>Cancel editing</Text></TouchableOpacity>}
      </View>

      <Text style={styles.sectionTitle}>My Projects</Text>
      {projects.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No projects yet</Text><Text style={styles.emptyText}>Add a project above to build your academic and professional portfolio.</Text></View> : projects.map((project) => (
        <View key={project.id} style={styles.projectCard}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <Text style={styles.projectType}>{project.project_type}</Text>
          {project.description && <Text style={styles.description}>{project.description}</Text>}
          {(project.start_date || project.end_date) && <Text style={styles.details}>Dates: {displayDate(project.start_date) || "Not provided"} – {displayDate(project.end_date) || "Present"}</Text>}
          {project.technologies && <Text style={styles.details}>Technologies: {project.technologies}</Text>}
          {project.project_url && <Text style={styles.linkText} numberOfLines={2}>Project: {project.project_url}</Text>}
          {project.github_url && <Text style={styles.linkText} numberOfLines={2}>GitHub: {project.github_url}</Text>}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton} onPress={() => void uploadFile(project)} disabled={isSaving || uploadingProjectId !== null}><Text style={styles.editButtonText}>{uploadingProjectId === project.id ? "Uploading…" : "Upload evidence"}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => startEditing(project)} disabled={isSaving}><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(project)} disabled={isSaving}><Text style={styles.deleteButtonText}>Delete</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function FormInput({ label, multiline = false, ...inputProps }: { label: string; value: string; onChangeText: (value: string) => void; editable: boolean; multiline?: boolean; autoCapitalize?: "none"; keyboardType?: "url" }) {
  return <View style={styles.inputGroup}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multilineInput]} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} {...inputProps} /></View>;
}

function ProjectTypePicker({ selected, onSelect, disabled }: { selected: ProjectType; onSelect: (type: ProjectType) => void; disabled: boolean }) {
  return <View style={styles.typePicker}>{PROJECT_TYPES.map((type) => <TouchableOpacity key={type} style={[styles.typeOption, selected === type && styles.selectedTypeOption, disabled && styles.disabledButton]} onPress={() => onSelect(type)} disabled={disabled}><Text style={[styles.typeOptionText, selected === type && styles.selectedTypeOptionText]}>{type}</Text></TouchableOpacity>)}</View>;
}

const styles = StyleSheet.create({
  loadingContainer: ui.centered, container: ui.screen, content: ui.screenContent, backButton: { alignSelf: "flex-start", marginBottom: spacing.lg }, backText: ui.textButton,
  title: typography.screenTitle, subtitle: { ...typography.caption, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing.xl }, sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.md },
  formSection: { ...ui.card, marginBottom: spacing.xl }, inputGroup: { marginBottom: spacing.md }, label: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: spacing.sm }, input: ui.input, multilineInput: { minHeight: 104 },
  typePicker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }, typeOption: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.input }, selectedTypeOption: { backgroundColor: colors.secondary, borderColor: colors.secondary }, typeOptionText: { color: colors.textMuted, fontWeight: "700", textTransform: "capitalize" }, selectedTypeOptionText: { color: colors.onDark },
  primaryButton: ui.primaryButton, primaryButtonText: ui.primaryButtonText, cancelButton: { ...ui.outlineButton, marginTop: spacing.sm, borderColor: colors.textMuted }, cancelButtonText: { ...ui.outlineButtonText, color: colors.textMuted }, disabledButton: ui.disabled,
  errorSection: { ...ui.errorState, ...ui.card, marginBottom: spacing.lg }, errorText: { color: colors.error, textAlign: "center", marginBottom: spacing.sm }, retryButton: ui.outlineButton, retryButtonText: ui.outlineButtonText,
  emptyState: { ...ui.emptyState, ...ui.card }, emptyTitle: typography.cardTitle, emptyText: typography.caption, projectCard: { ...ui.card, marginBottom: spacing.md }, projectTitle: typography.cardTitle, projectType: { alignSelf: "flex-start", color: colors.primary, fontWeight: "700", textTransform: "capitalize", marginTop: spacing.sm, backgroundColor: colors.input, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  description: { ...typography.body, color: colors.textMuted, marginTop: spacing.md }, details: { ...typography.caption, marginTop: spacing.sm }, linkText: { color: colors.primary, fontSize: 14, marginTop: spacing.sm }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg }, editButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 }, editButtonText: { color: colors.primary, fontWeight: "700" }, deleteButton: { borderWidth: 1, borderColor: colors.error, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 }, deleteButtonText: { color: colors.error, fontWeight: "700" },
});
