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
import {
  Certificate,
  CertificateInput,
  createMyCertificate,
  deleteMyCertificate,
  getCertificateErrorMessage,
  getMyCertificates,
  isUnauthorizedCertificateError,
  updateMyCertificate,
  uploadMyCertificateFile,
} from "../../services/certificate.service";

type CertificateForm = {
  title: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  description: string;
};

const emptyForm: CertificateForm = {
  title: "",
  issuing_organization: "",
  issue_date: "",
  expiry_date: "",
  credential_id: "",
  credential_url: "",
  description: "",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (value: string) => {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const isValidHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);
const displayDate = (value: string | null) => value?.slice(0, 10) || "Not provided";

export default function CertificatesScreen() {
  const navigation = useNavigation<any>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [form, setForm] = useState<CertificateForm>(emptyForm);
  const [editingCertificateId, setEditingCertificateId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCertificateId, setUploadingCertificateId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const loadCertificates = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setCertificates(await getMyCertificates());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getCertificateErrorMessage(error));
      if (isUnauthorizedCertificateError(error)) {
        await handleUnauthorized();
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const updateFormField = (field: keyof CertificateForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Enter a certificate title.";
    if (form.title.trim().length > 150) return "Certificate title must be 150 characters or fewer.";
    if (!form.issuing_organization.trim()) return "Enter the issuing organization.";
    if (form.issuing_organization.trim().length > 150) return "Issuing organization must be 150 characters or fewer.";
    if (!isValidDate(form.issue_date.trim())) return "Issue date must use YYYY-MM-DD.";
    if (form.expiry_date.trim() && !isValidDate(form.expiry_date.trim())) return "Expiry date must use YYYY-MM-DD.";
    if (form.expiry_date.trim() && form.expiry_date.trim() < form.issue_date.trim()) return "Expiry date cannot be earlier than issue date.";
    if (form.credential_id.trim().length > 150) return "Credential ID must be 150 characters or fewer.";
    if (form.credential_url.trim() && !isValidHttpUrl(form.credential_url.trim())) return "Credential URL must start with http:// or https://.";
    if (form.credential_url.trim().length > 2048) return "Credential URL must be 2048 characters or fewer.";
    if (form.description.length > 5000) return "Description must be 5000 characters or fewer.";
    return null;
  };

  const getFormPayload = (): CertificateInput => ({
    title: form.title.trim(),
    issuing_organization: form.issuing_organization.trim(),
    issue_date: form.issue_date.trim(),
    expiry_date: form.expiry_date.trim() || null,
    credential_id: form.credential_id.trim() || null,
    credential_url: form.credential_url.trim() || null,
    description: form.description.trim() || null,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCertificateId(null);
  };

  const handleSave = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      Toast.show({ type: "error", text1: "Check your certificate", text2: validationMessage });
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      if (editingCertificateId === null) {
        await createMyCertificate(getFormPayload());
      } else {
        await updateMyCertificate(editingCertificateId, getFormPayload());
      }
      const wasEditing = editingCertificateId !== null;
      resetForm();
      await loadCertificates();
      Toast.show({
        type: "success",
        text1: wasEditing ? "Certificate updated" : "Certificate created",
        text2: "Your certificate information has been saved.",
      });
    } catch (error) {
      const message = getCertificateErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to save certificate", text2: message });
      if (isUnauthorizedCertificateError(error)) {
        await handleUnauthorized();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (certificate: Certificate) => {
    setEditingCertificateId(certificate.id);
    setForm({
      title: certificate.title,
      issuing_organization: certificate.issuing_organization,
      issue_date: displayDate(certificate.issue_date),
      expiry_date: certificate.expiry_date ? displayDate(certificate.expiry_date) : "",
      credential_id: certificate.credential_id || "",
      credential_url: certificate.credential_url || "",
      description: certificate.description || "",
    });
    setErrorMessage("");
  };

  const handleDelete = (certificate: Certificate) => {
    Alert.alert(
      "Delete certificate?",
      `Delete “${certificate.title}”? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void deleteCertificate(certificate) },
      ],
    );
  };

  const deleteCertificate = async (certificate: Certificate) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deleteMyCertificate(certificate.id);
      if (editingCertificateId === certificate.id) resetForm();
      await loadCertificates();
      Toast.show({ type: "success", text1: "Certificate deleted", text2: "Your certificate was removed." });
    } catch (error) {
      const message = getCertificateErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to delete certificate", text2: message });
      if (isUnauthorizedCertificateError(error)) {
        await handleUnauthorized();
      }
    } finally {
      setIsSaving(false);
    }
  };
  const uploadFile = async (certificate: Certificate) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"], copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!file || (file.size !== undefined && file.size > 10 * 1024 * 1024)) { setErrorMessage("Choose a PDF, DOCX, JPG, or PNG file no larger than 10 MB."); return; }
    try { setUploadingCertificateId(certificate.id); setErrorMessage(""); await uploadMyCertificateFile(certificate.id, { uri: file.uri, name: file.name, mimeType: file.mimeType || "application/pdf" }); await loadCertificates(); Toast.show({ type: "success", text1: "Certificate file uploaded" }); } catch (error) { const message = getCertificateErrorMessage(error); setErrorMessage(message); if (isUnauthorizedCertificateError(error)) await handleUnauthorized(); } finally { setUploadingCertificateId(null); }
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadCertificates(true)} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isSaving}>
        <Text style={styles.backText}>Back to Profile</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Certificates</Text>
      <Text style={styles.subtitle}>Add and manage the certificates on your CampusX profile.</Text>

      {!!errorMessage && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadCertificates()} disabled={isSaving}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>{editingCertificateId === null ? "Add Certificate" : "Edit Certificate"}</Text>
        <FormInput label="Title" value={form.title} onChangeText={(value) => updateFormField("title", value)} editable={!isSaving} />
        <FormInput label="Issuing organization" value={form.issuing_organization} onChangeText={(value) => updateFormField("issuing_organization", value)} editable={!isSaving} />
        <FormInput label="Issue date (YYYY-MM-DD)" value={form.issue_date} onChangeText={(value) => updateFormField("issue_date", value)} editable={!isSaving} autoCapitalize="none" />
        <FormInput label="Expiry date (optional, YYYY-MM-DD)" value={form.expiry_date} onChangeText={(value) => updateFormField("expiry_date", value)} editable={!isSaving} autoCapitalize="none" />
        <FormInput label="Credential ID (optional)" value={form.credential_id} onChangeText={(value) => updateFormField("credential_id", value)} editable={!isSaving} />
        <FormInput label="Credential URL (optional)" value={form.credential_url} onChangeText={(value) => updateFormField("credential_url", value)} editable={!isSaving} autoCapitalize="none" keyboardType="url" />
        <FormInput label="Description (optional)" value={form.description} onChangeText={(value) => updateFormField("description", value)} editable={!isSaving} multiline />
        <TouchableOpacity style={[styles.primaryButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{editingCertificateId === null ? "Create Certificate" : "Save Certificate"}</Text>}
        </TouchableOpacity>
        {editingCertificateId !== null && (
          <TouchableOpacity style={styles.cancelButton} onPress={resetForm} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>Cancel editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>My Certificates</Text>
      {certificates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No certificates yet</Text>
          <Text style={styles.emptyText}>Add a certificate above to highlight your achievements.</Text>
        </View>
      ) : certificates.map((certificate) => (
        <View key={certificate.id} style={styles.certificateCard}>
          <Text style={styles.certificateTitle}>{certificate.title}</Text>
          <Text style={styles.organization}>{certificate.issuing_organization}</Text>
          <Text style={styles.details}>Issued: {displayDate(certificate.issue_date)}</Text>
          {certificate.expiry_date && <Text style={styles.details}>Expires: {displayDate(certificate.expiry_date)}</Text>}
          {certificate.credential_id && <Text style={styles.details}>Credential ID: {certificate.credential_id}</Text>}
          {certificate.credential_url && <Text style={styles.credentialUrl} numberOfLines={2}>Credential: {certificate.credential_url}</Text>}
          {certificate.description && <Text style={styles.description}>{certificate.description}</Text>}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton} onPress={() => void uploadFile(certificate)} disabled={isSaving || uploadingCertificateId !== null}><Text style={styles.editButtonText}>{uploadingCertificateId === certificate.id ? "Uploading…" : "Upload file"}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => startEditing(certificate)} disabled={isSaving}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(certificate)} disabled={isSaving}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
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
      <TextInput style={[styles.input, multiline && styles.multilineInput]} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} {...inputProps} />
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
  certificateCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginBottom: 12 },
  certificateTitle: { color: "#333", fontSize: 18, fontWeight: "700" },
  organization: { color: "#2563EB", fontWeight: "600", marginTop: 4 },
  details: { color: "#4B5563", fontSize: 14, marginTop: 8 },
  credentialUrl: { color: "#2563EB", fontSize: 14, marginTop: 8 },
  description: { color: "#4B5563", fontSize: 15, lineHeight: 21, marginTop: 10 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  editButton: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  editButtonText: { color: "#2563EB", fontWeight: "600" },
  deleteButton: { borderWidth: 1, borderColor: "#DC2626", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  deleteButtonText: { color: "#DC2626", fontWeight: "600" },
});
