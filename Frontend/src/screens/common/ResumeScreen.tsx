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
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import {
  createMyResume,
  deleteMyResume,
  getMyResumes,
  getResumeErrorMessage,
  isUnauthorizedResumeError,
  Resume,
  ResumeAiReview,
  ResumeInput,
  reviewMyResume,
  uploadMyResumeDocument,
  updateMyResume,
} from "../../services/resume.service";

type ResumeForm = {
  title: string;
  summary: string;
  file_url: string;
  is_primary: boolean;
};

const emptyForm: ResumeForm = {
  title: "",
  summary: "",
  file_url: "",
  is_primary: false,
};

const isPrimaryResume = (resume: Resume) => resume.is_primary === true || resume.is_primary === 1;
const isValidHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);
const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;
const isResumeDocument = (name: string, mimeType?: string | null) => {
  const extension = name.toLowerCase().split(".").pop();
  return (extension === "pdf" && mimeType === "application/pdf")
    || (extension === "docx" && mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
};

export default function ResumeScreen() {
  const navigation = useNavigation<any>();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [form, setForm] = useState<ResumeForm>(emptyForm);
  const [editingResumeId, setEditingResumeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canReviewWithAi, setCanReviewWithAi] = useState(false);
  const [reviews, setReviews] = useState<Record<number, ResumeAiReview>>({});
  const [reviewingResumeId, setReviewingResumeId] = useState<number | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewErrorResumeId, setReviewErrorResumeId] = useState<number | null>(null);
  const [uploadingResumeId, setUploadingResumeId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadErrorResumeId, setUploadErrorResumeId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const loadResumes = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setResumes(await getMyResumes());
      setErrorMessage("");
    } catch (error) {
      const message = getResumeErrorMessage(error);
      setErrorMessage(message);
      if (isUnauthorizedResumeError(error)) {
        await handleUnauthorized();
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const load = async () => {
      const session = await getStoredAuthSession();
      setCanReviewWithAi(session?.user.role === "student" || session?.user.role === "graduate");
      await loadResumes();
    };
    void load();
  }, [loadResumes]);

  const updateFormField = (field: keyof ResumeForm, value: string | boolean) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value } as ResumeForm));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Enter a resume title.";
    }
    if (form.title.trim().length > 150) {
      return "Resume title must be 150 characters or fewer.";
    }
    if (form.summary.length > 5000) {
      return "Resume summary must be 5000 characters or fewer.";
    }
    if (form.file_url.trim() && !isValidHttpUrl(form.file_url.trim())) {
      return "Resume file URL must start with http:// or https://.";
    }
    return null;
  };

  const getFormPayload = (): ResumeInput => ({
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    file_url: form.file_url.trim() || null,
    is_primary: form.is_primary,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingResumeId(null);
  };

  const handleSave = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      Toast.show({ type: "error", text1: "Check your resume", text2: validationMessage });
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      if (editingResumeId === null) {
        await createMyResume(getFormPayload());
      } else {
        await updateMyResume(editingResumeId, getFormPayload());
      }
      const wasEditing = editingResumeId !== null;
      setReviews({});
      setExpandedReviewId(null);
      resetForm();
      await loadResumes();
      Toast.show({
        type: "success",
        text1: wasEditing ? "Resume updated" : "Resume created",
        text2: "Your resume information has been saved.",
      });
    } catch (error) {
      const message = getResumeErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to save resume", text2: message });
      if (isUnauthorizedResumeError(error)) {
        await handleUnauthorized();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (resume: Resume) => {
    setEditingResumeId(resume.id);
    setForm({
      title: resume.title,
      summary: resume.summary || "",
      file_url: resume.file_url || "",
      is_primary: isPrimaryResume(resume),
    });
    setErrorMessage("");
  };

  const requestAiReview = async (resume: Resume) => {
    setReviewingResumeId(resume.id);
    setReviewError("");
    setReviewErrorResumeId(null);
    try {
      const review = await reviewMyResume(resume.id);
      setReviews((current) => ({ ...current, [resume.id]: review }));
      setExpandedReviewId(resume.id);
      Toast.show({ type: "success", text1: "AI review ready", text2: "Review the suggestions below." });
    } catch (error) {
      const message = getResumeErrorMessage(error);
      setReviewError(message);
      setReviewErrorResumeId(resume.id);
      if (isUnauthorizedResumeError(error)) await handleUnauthorized();
    } finally {
      setReviewingResumeId(null);
    }
  };

  const uploadResumeDocument = async (resume: Resume) => {
    setUploadError("");
    setUploadErrorResumeId(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (result.canceled) return;
    const document = result.assets[0];
    if (!document || !isResumeDocument(document.name, document.mimeType)) {
      setUploadErrorResumeId(resume.id);
      setUploadError("Choose a PDF or DOCX resume file.");
      return;
    }
    if (document.size !== undefined && document.size !== null && document.size > MAX_RESUME_FILE_SIZE) {
      setUploadErrorResumeId(resume.id);
      setUploadError("Resume files must be 5 MB or smaller.");
      return;
    }
    const mimeType = document.mimeType || (document.name.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    setUploadingResumeId(resume.id);
    try {
      await uploadMyResumeDocument(resume.id, { uri: document.uri, name: document.name, mimeType });
      setReviews((current) => { const { [resume.id]: removed, ...remaining } = current; return remaining; });
      setExpandedReviewId(null);
      await loadResumes();
      Toast.show({ type: "success", text1: "Resume uploaded", text2: "Text was extracted for AI review." });
    } catch (error) {
      const message = getResumeErrorMessage(error);
      setUploadError(message);
      setUploadErrorResumeId(resume.id);
      if (isUnauthorizedResumeError(error)) await handleUnauthorized();
    } finally {
      setUploadingResumeId(null);
    }
  };

  const handleDelete = (resume: Resume) => {
    Alert.alert(
      "Delete resume?",
      `Delete “${resume.title}”? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteResume(resume),
        },
      ],
    );
  };

  const deleteResume = async (resume: Resume) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deleteMyResume(resume.id);
      if (editingResumeId === resume.id) {
        resetForm();
      }
      await loadResumes();
      Toast.show({ type: "success", text1: "Resume deleted", text2: "Your resume was removed." });
    } catch (error) {
      const message = getResumeErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to delete resume", text2: message });
      if (isUnauthorizedResumeError(error)) {
        await handleUnauthorized();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadResumes(true)} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isSaving}>
        <Text style={styles.backText}>Back to Profile</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Resumes</Text>
      <Text style={styles.subtitle}>Create and manage the resumes on your CampusX profile.</Text>

      {!!errorMessage && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadResumes()} disabled={isSaving}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{editingResumeId === null ? "Add Resume" : "Edit Resume"}</Text>
        <FormInput label="Title" value={form.title} onChangeText={(value) => updateFormField("title", value)} editable={!isSaving} />
        <FormInput label="Summary (optional)" value={form.summary} onChangeText={(value) => updateFormField("summary", value)} editable={!isSaving} multiline />
        <FormInput label="File URL (optional)" value={form.file_url} onChangeText={(value) => updateFormField("file_url", value)} editable={!isSaving} autoCapitalize="none" keyboardType="url" />
        <Text style={styles.label}>Primary resume</Text>
        <PrimaryPicker selected={form.is_primary} onSelect={(value) => updateFormField("is_primary", value)} disabled={isSaving} />
        <TouchableOpacity style={[styles.primaryButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingResumeId === null ? "Create Resume" : "Save Resume"}</Text>}
        </TouchableOpacity>
        {editingResumeId !== null && (
          <TouchableOpacity style={styles.cancelButton} onPress={resetForm} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Cancel editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>My Resumes</Text>
      {resumes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No resumes yet</Text>
          <Text style={styles.emptyText}>Add your first resume above to start building your CampusX profile.</Text>
        </View>
      ) : (
        resumes.map((resume) => (
          <View key={resume.id} style={styles.resumeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.resumeTitle}>{resume.title}</Text>
              {isPrimaryResume(resume) && <Text style={styles.primaryBadge}>Primary</Text>}
            </View>
            {!!resume.summary && <Text style={styles.summary}>{resume.summary}</Text>}
            {!!resume.file_url && <Text style={styles.fileUrl} numberOfLines={2}>File: {resume.file_url}</Text>}
            {!isPrimaryResume(resume) && <Text style={styles.secondaryLabel}>Non-primary resume</Text>}
            {canReviewWithAi && <TouchableOpacity style={[styles.uploadButton, (isSaving || uploadingResumeId !== null) && styles.disabledButton]} onPress={() => void uploadResumeDocument(resume)} disabled={isSaving || uploadingResumeId !== null}><Text style={styles.uploadButtonText}>{uploadingResumeId === resume.id ? "Uploading resume…" : "Upload Resume (PDF or DOCX)"}</Text></TouchableOpacity>}
            {uploadErrorResumeId === resume.id && <Text style={styles.reviewError}>{uploadError}</Text>}
            {canReviewWithAi && <TouchableOpacity style={[styles.aiButton, (isSaving || reviewingResumeId !== null) && styles.disabledButton]} onPress={() => void requestAiReview(resume)} disabled={isSaving || reviewingResumeId !== null}><Text style={styles.aiButtonText}>{reviewingResumeId === resume.id ? "Reviewing with AI…" : reviews[resume.id] ? "Refresh AI Review" : "Review with AI"}</Text></TouchableOpacity>}
            {reviewErrorResumeId === resume.id && <Text style={styles.reviewError}>{reviewError}</Text>}
            {reviews[resume.id] && <><TouchableOpacity onPress={() => setExpandedReviewId((current) => current === resume.id ? null : resume.id)}><Text style={styles.reviewToggle}>{expandedReviewId === resume.id ? "Hide AI Review" : "View AI Review"}</Text></TouchableOpacity>{expandedReviewId === resume.id && <ResumeReview review={reviews[resume.id]} />}</>}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editButton} onPress={() => startEditing(resume)} disabled={isSaving}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(resume)} disabled={isSaving}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ResumeReview({ review }: { review: ResumeAiReview }) {
  const sections: Array<[string, string[]]> = [
    ["Strengths", review.strengths],
    ["Improve", review.improvement_suggestions],
    ["Missing sections", review.missing_sections],
    ["Keywords", review.keyword_suggestions],
    ["ATS considerations", review.ats_considerations],
  ];
  return <View style={styles.reviewCard}><Text style={styles.reviewHeading}>AI Resume Review</Text><Text style={styles.reviewText}>{review.overall_assessment}</Text>{sections.map(([title, items]) => <View key={title} style={styles.reviewSection}><Text style={styles.reviewSectionTitle}>{title}</Text>{items.length ? items.map((item) => <Text key={item} style={styles.reviewText}>• {item}</Text>) : <Text style={styles.reviewText}>• None identified from the supplied resume content.</Text>}</View>)}<Text style={styles.reviewDisclaimer}>Guidance uses uploaded document text when available, otherwise your summary; not a hiring decision.</Text></View>;
}

function FormInput({
  label,
  multiline = false,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
  multiline?: boolean;
  autoCapitalize?: "none";
  keyboardType?: "url";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
    </View>
  );
}

function PrimaryPicker({ selected, onSelect, disabled }: { selected: boolean; onSelect: (value: boolean) => void; disabled: boolean }) {
  return (
    <View style={styles.primaryPicker}>
      <TouchableOpacity style={[styles.primaryOption, selected && styles.selectedPrimaryOption, disabled && styles.disabledButton]} onPress={() => onSelect(true)} disabled={disabled}>
        <Text style={[styles.primaryOptionText, selected && styles.selectedPrimaryOptionText]}>Make primary</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryOption, !selected && styles.selectedPrimaryOption, disabled && styles.disabledButton]} onPress={() => onSelect(false)} disabled={disabled}>
        <Text style={[styles.primaryOptionText, !selected && styles.selectedPrimaryOptionText]}>Not primary</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 48 },
  backButton: { alignSelf: "flex-start", marginBottom: 16 },
  backText: { color: "#2563EB", fontWeight: "600" },
  title: { color: "#1E3A8A", fontSize: 30, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: "#666", fontSize: 16, marginBottom: 22 },
  sectionTitle: { color: "#1E3A8A", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  formSection: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 24, paddingBottom: 24 },
  inputGroup: { marginBottom: 14 },
  label: { color: "#333", fontSize: 15, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontSize: 16, color: "#333" },
  multilineInput: { minHeight: 96 },
  primaryPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  primaryOption: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  selectedPrimaryOption: { backgroundColor: "#2563EB" },
  primaryOptionText: { color: "#2563EB", fontWeight: "600" },
  selectedPrimaryOptionText: { color: "#fff" },
  primaryButton: { backgroundColor: "#10B981", padding: 15, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cancelButton: { borderWidth: 1, borderColor: "#666", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 10 },
  cancelButtonText: { color: "#666", fontWeight: "600" },
  disabledButton: { opacity: 0.7 },
  errorSection: { alignItems: "center", marginBottom: 14 },
  errorText: { color: "#DC2626", textAlign: "center", marginBottom: 10 },
  retryButton: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  retryButtonText: { color: "#2563EB", fontWeight: "600" },
  emptyState: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 18 },
  emptyTitle: { color: "#333", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptyText: { color: "#666", fontSize: 16, lineHeight: 22 },
  resumeCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  resumeTitle: { color: "#333", fontSize: 18, fontWeight: "700", flex: 1 },
  primaryBadge: { color: "#047857", backgroundColor: "#D1FAE5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: "700" },
  summary: { color: "#4B5563", fontSize: 15, lineHeight: 21, marginTop: 10 },
  fileUrl: { color: "#2563EB", fontSize: 14, marginTop: 10 },
  secondaryLabel: { color: "#666", fontSize: 14, marginTop: 8 },
  uploadButton: { borderWidth: 1, borderColor: "#0F766E", borderRadius: 8, padding: 11, alignItems: "center", marginTop: 14 },
  uploadButtonText: { color: "#0F766E", fontWeight: "600" },
  aiButton: { borderWidth: 1, borderColor: "#7C3AED", borderRadius: 8, padding: 11, alignItems: "center", marginTop: 14 },
  aiButtonText: { color: "#6D28D9", fontWeight: "600" },
  reviewError: { color: "#DC2626", lineHeight: 20, marginTop: 10 },
  reviewToggle: { color: "#6D28D9", fontWeight: "600", marginTop: 12 },
  reviewCard: { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE", borderWidth: 1, borderRadius: 8, padding: 13, marginTop: 10 },
  reviewHeading: { color: "#312E81", fontSize: 16, fontWeight: "700" },
  reviewSection: { marginTop: 12 },
  reviewSectionTitle: { color: "#312E81", fontWeight: "700", marginBottom: 3 },
  reviewText: { color: "#4B5563", lineHeight: 20 },
  reviewDisclaimer: { color: "#6B7280", fontSize: 12, fontStyle: "italic", lineHeight: 18, marginTop: 14 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  editButton: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  editButtonText: { color: "#2563EB", fontWeight: "600" },
  deleteButton: { borderWidth: 1, borderColor: "#DC2626", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  deleteButtonText: { color: "#DC2626", fontWeight: "600" },
});
