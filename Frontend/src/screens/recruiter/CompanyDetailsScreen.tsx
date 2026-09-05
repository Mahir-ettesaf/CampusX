import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import axios from "axios";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import {
  company,
  companyError,
  Company,
  CompanyInput,
  updateCompany,
} from "../../services/company.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

type Form = { name: string; description: string; website: string; logo: string; location: string };

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const formFromCompany = (value: Company): Form => ({
  name: value.name,
  description: value.description || "",
  website: value.website || "",
  logo: value.logo || "",
  location: value.location || "",
});

const approvalLabel = (status?: Company["approval_status"]) => {
  if (status === "approved") return "Company Approved";
  if (status === "rejected") return "Company Rejected";
  return "Pending Admin Approval";
};

const approvalMessage = (status?: Company["approval_status"]) => {
  if (status === "approved") return "Your company has been approved.";
  if (status === "rejected") return "Your company was rejected by Admin.";
  return "Your company is waiting for Admin approval.";
};

export default function CompanyDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const companyId = Number(route.params?.companyId);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [form, setForm] = useState<Form>({ name: "", description: "", website: "", logo: "", location: "" });
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleRequestError = useCallback(async (requestError: unknown) => {
    if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
      await clearAuthSession();
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      return;
    }
    setError(companyError(requestError));
  }, [navigation]);

  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(companyId) || companyId <= 0) {
      setError("The company could not be found.");
      setLoading(false);
      return;
    }
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [loadedCompany, session] = await Promise.all([company(companyId), getStoredAuthSession()]);
      setCompanyData(loadedCompany);
      setForm(formFromCompany(loadedCompany));
      setCanEdit(loadedCompany.created_by === session?.user.id);
      setEditing(false);
      setError("");
    } catch (requestError) {
      await handleRequestError(requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId, handleRequestError]);

  useEffect(() => { load(); }, [load]);

  const updateField = (field: keyof Form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const cancelEdit = () => {
    if (companyData) setForm(formFromCompany(companyData));
    setError("");
    setEditing(false);
  };

  const save = async () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const website = form.website.trim();
    const logo = form.logo.trim();
    const location = form.location.trim();
    if (!name || name.length > 150) return setError("Company name is required and must be 150 characters or fewer.");
    if (description.length > 5000) return setError("Description is too long.");
    if (location.length > 150) return setError("Location must be 150 characters or fewer.");
    if (website && !isHttpUrl(website)) return setError("Website must be a valid HTTP or HTTPS URL.");
    if (logo && !isHttpUrl(logo)) return setError("Logo URL must be a valid HTTP or HTTPS URL.");
    if (!companyData) return;

    const payload: CompanyInput = { name, description: description || null, website: website || null, logo: logo || null, location: location || null };
    try {
      setSaving(true);
      setError("");
      await updateCompany(companyData.id, payload);
      await load();
      Toast.show({ type: "success", text1: "Company updated" });
    } catch (requestError) {
      await handleRequestError(requestError);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !companyData) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading company details…</Text></View>;
  if (!companyData) return <View style={styles.center}><Text style={styles.error}>{error || "Company not found."}</Text><TouchableOpacity onPress={() => load()}><Text style={styles.link}>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Recruiter Profile</Text></TouchableOpacity></View>;

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Recruiter Profile</Text></TouchableOpacity>
    <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="business-outline" size={23} color={colors.primary} /></View><View><Text style={styles.title}>Company Details</Text><Text style={styles.headerSubtitle}>Manage your company information.</Text></View></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.card}>
      <Text style={[styles.status, companyData.approval_status === "approved" && styles.approvedStatus, companyData.approval_status === "rejected" && styles.rejectedStatus]}>{approvalLabel(companyData.approval_status)}</Text>
      <Text style={styles.note}>{approvalMessage(companyData.approval_status)}</Text>
      {editing ? <>
        <Text style={styles.label}>Company Name</Text><TextInput style={styles.input} value={form.name} onChangeText={(value) => updateField("name", value)} editable={!saving} />
        <Text style={styles.label}>Description</Text><TextInput style={[styles.input, styles.multiline]} value={form.description} onChangeText={(value) => updateField("description", value)} editable={!saving} multiline />
        <Text style={styles.label}>Website</Text><TextInput style={styles.input} value={form.website} onChangeText={(value) => updateField("website", value)} editable={!saving} autoCapitalize="none" />
        <Text style={styles.label}>Logo URL</Text><TextInput style={styles.input} value={form.logo} onChangeText={(value) => updateField("logo", value)} editable={!saving} autoCapitalize="none" />
        <Text style={styles.label}>Location</Text><TextInput style={styles.input} value={form.location} onChangeText={(value) => updateField("location", value)} editable={!saving} />
        <TouchableOpacity style={[styles.primary, saving && styles.disabled]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}</TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={cancelEdit} disabled={saving}><Text style={styles.secondaryText}>Cancel</Text></TouchableOpacity>
      </> : <>
        <Text style={styles.name}>{companyData.name}</Text>
        <Text style={styles.label}>Description</Text><Text style={styles.value}>{companyData.description || "Not provided"}</Text>
        <Text style={styles.label}>Website</Text><Text style={styles.value}>{companyData.website || "Not provided"}</Text>
        <Text style={styles.label}>Logo URL</Text><Text style={styles.value}>{companyData.logo || "Not provided"}</Text>
        <Text style={styles.label}>Location</Text><Text style={styles.value}>{companyData.location || "Not provided"}</Text>
        {canEdit ? <TouchableOpacity style={styles.primary} onPress={() => { setError(""); setEditing(true); }}><Text style={styles.primaryText}>Edit</Text></TouchableOpacity> : null}
      </>}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, page: { ...ui.screen }, content: { ...ui.screenContent },
  loadingText: { ...typography.caption, marginTop: spacing.md }, link: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md }, header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg }, headerIcon: { width: 46, height: 46, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, title: { ...typography.screenTitle }, headerSubtitle: { ...typography.caption, marginTop: spacing.xs }, card: { ...ui.card, marginTop: spacing.md },
  status: { alignSelf: "flex-start", color: colors.warning, backgroundColor: "#3B301A", fontSize: 12, fontWeight: "800", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, overflow: "hidden" }, approvedStatus: { color: colors.success, backgroundColor: "#123A34" }, rejectedStatus: { color: colors.error, backgroundColor: "#3A2028" }, note: { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 }, name: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: spacing.lg }, label: { color: colors.text, fontSize: 14, fontWeight: "800", marginTop: spacing.lg }, value: { color: colors.textMuted, marginTop: spacing.xs, lineHeight: 20 },
  input: { ...ui.input, marginTop: spacing.xs }, multiline: { minHeight: 104, textAlignVertical: "top" }, error: { color: colors.error, marginTop: spacing.md, textAlign: "center", lineHeight: 20 },
  primary: { ...ui.primaryButton, marginTop: spacing.xl }, primaryText: { ...ui.primaryButtonText }, secondary: { ...ui.outlineButton, minHeight: 48, marginTop: spacing.sm }, secondaryText: { ...ui.outlineButtonText }, disabled: { ...ui.disabled },
});
