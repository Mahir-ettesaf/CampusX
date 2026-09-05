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

  if (loading && !companyData) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  if (!companyData) return <View style={styles.center}><Text style={styles.error}>{error || "Company not found."}</Text><TouchableOpacity onPress={() => load()}><Text style={styles.link}>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Recruiter Profile</Text></TouchableOpacity></View>;

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Recruiter Profile</Text></TouchableOpacity>
    <Text style={styles.title}>Company Details</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.card}>
      <Text style={styles.status}>{approvalLabel(companyData.approval_status)}</Text>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }, page: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24 },
  link: { color: "#2563EB", fontWeight: "600", marginBottom: 16 }, title: { fontSize: 28, fontWeight: "bold", color: "#1E3A8A" }, card: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginTop: 20 },
  status: { color: "#047857", fontWeight: "700" }, note: { color: "#4B5563", marginTop: 6 }, name: { fontSize: 22, fontWeight: "700", color: "#111827", marginTop: 18 }, label: { fontWeight: "700", color: "#374151", marginTop: 16 }, value: { color: "#4B5563", marginTop: 5 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 11, marginTop: 6 }, multiline: { minHeight: 100, textAlignVertical: "top" }, error: { color: "#DC2626", marginTop: 12, textAlign: "center" },
  primary: { backgroundColor: "#2563EB", padding: 14, borderRadius: 9, alignItems: "center", marginTop: 20 }, primaryText: { color: "#fff", fontWeight: "700" }, secondary: { borderWidth: 1, borderColor: "#2563EB", padding: 13, borderRadius: 9, alignItems: "center", marginTop: 10 }, secondaryText: { color: "#2563EB", fontWeight: "700" }, disabled: { opacity: 0.6 },
});
