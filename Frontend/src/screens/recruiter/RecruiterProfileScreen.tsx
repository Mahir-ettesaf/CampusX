import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getProfile, getProfileErrorMessage, ProfileResponse, updateRecruiterProfile } from "../../services/profile.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

export default function RecruiterProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await getProfile();
      if (data.user.role !== "recruiter") {
        setError("Recruiter access is required.");
        return;
      }
      setProfile(data);
      setJobTitle(data.recruiter_profile?.job_title || "");
      setError("");
    } catch (requestError) {
      setError(getProfileErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!profile?.recruiter_profile) return;
    if (!jobTitle.trim()) {
      setError("Job title is required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await updateRecruiterProfile(profile.recruiter_profile.company_id, jobTitle.trim());
      await load();
      Toast.show({ type: "success", text1: "Recruiter profile updated" });
    } catch (requestError) {
      setError(getProfileErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return <View style={ui.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading recruiter profile…</Text></View>;
  if (!profile) return <View style={ui.centered}><View style={styles.errorCard}><Text style={styles.error}>{error || "Unable to load recruiter profile."}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.link}>Retry</Text></TouchableOpacity></View></View>;

  const recruiter = profile.recruiter_profile;
  const initials = profile.user.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Home</Text></TouchableOpacity>
    <View style={styles.identityCard}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.identityCopy}><Text style={typography.screenTitle}>Recruiter Profile</Text><Text style={styles.name}>{profile.user.full_name}</Text><Text style={styles.email}>{profile.user.email}</Text><View style={styles.roleBadge}><Text style={styles.roleText}>{profile.user.role}</Text></View></View></View>
    {error ? <View style={styles.inlineError}><Text style={styles.error}>{error}</Text></View> : null}

    {recruiter ? <View style={styles.card}><View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>COMPANY ASSOCIATION</Text><Text style={styles.heading}>Associated Company</Text></View><StatusBadge status={recruiter.company_approval_status} /></View><Text style={styles.company}>{recruiter.company_name}</Text><View style={styles.companyDetails}><Text style={styles.detail}>{recruiter.company_website || "No website"}</Text><Text style={styles.detail}>{recruiter.company_location || "No location"}</Text></View><Text style={styles.label}>Job title</Text><TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} editable={!saving} placeholder="Your role at the company" placeholderTextColor={colors.textMuted} /><TouchableOpacity style={[ui.primaryButton, saving && ui.disabled]} disabled={saving} onPress={save}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Edit Recruiter Profile</Text>}</TouchableOpacity><TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate("CompanyDetails", { companyId: recruiter.company_id })}><Text style={styles.manageButtonText}>View / Manage Company</Text><Ionicons name="arrow-forward" size={18} color={colors.primary} /></TouchableOpacity></View> : <View style={styles.emptyCard}><Ionicons name="business-outline" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>No company associated</Text><Text style={styles.empty}>No approved company associated yet.</Text></View>}
    <View style={styles.actions}><TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("CreateCompany")}><Ionicons name="add-circle-outline" size={21} color={colors.primary} /><View style={styles.actionCopy}><Text style={styles.actionTitle}>Create Company</Text><Text style={styles.actionCaption}>Register a new company for approval.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></TouchableOpacity><TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("SelectCompany")}><Ionicons name="business-outline" size={21} color={colors.secondary} /><View style={styles.actionCopy}><Text style={styles.actionTitle}>Select Company</Text><Text style={styles.actionCaption}>Associate with an approved company.</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></TouchableOpacity></View>
  </ScrollView>;
}

function StatusBadge({ status }: { status?: string | null }) {
  const label = status === "approved" ? "Company Approved" : status === "pending" ? "Pending Approval" : "Company Rejected";
  return <View style={[styles.status, status === "approved" && styles.approvedStatus, status === "rejected" && styles.rejectedStatus]}><Text style={[styles.statusText, status === "approved" && styles.approvedText, status === "rejected" && styles.rejectedText]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { ...ui.screenContent }, loadingText: { ...typography.caption, marginTop: spacing.md }, link: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md },
  identityCard: { ...ui.card, flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.backgroundElevated, marginBottom: spacing.md }, avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" }, avatarText: { color: colors.primary, fontSize: 20, fontWeight: "800" }, identityCopy: { flex: 1, minWidth: 0 }, name: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: spacing.xs }, email: { color: colors.textMuted, fontSize: 13, marginTop: 2 }, roleBadge: { alignSelf: "flex-start", backgroundColor: "#292750", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginTop: spacing.sm }, roleText: { color: colors.secondary, fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  card: { ...ui.card, marginTop: spacing.md }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, alignItems: "flex-start" }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginBottom: spacing.xs }, heading: { ...typography.cardTitle }, company: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: spacing.lg }, companyDetails: { marginTop: spacing.sm, gap: 3 }, detail: { color: colors.textMuted, fontSize: 14 }, status: { alignSelf: "flex-start", backgroundColor: "#3B301A", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, statusText: { color: colors.warning, fontSize: 10, fontWeight: "800" }, approvedStatus: { backgroundColor: "#123A34" }, approvedText: { color: colors.success }, rejectedStatus: { backgroundColor: "#3A2028" }, rejectedText: { color: colors.error },
  label: { color: colors.text, fontSize: 14, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.xs }, input: { ...ui.input, marginBottom: spacing.md }, manageButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.sm, minHeight: 48, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, marginTop: spacing.sm }, manageButtonText: { color: colors.primary, fontWeight: "800" },
  emptyCard: { ...ui.card, alignItems: "center", gap: spacing.sm, marginTop: spacing.md }, emptyTitle: { ...typography.cardTitle }, empty: { ...typography.caption, textAlign: "center" }, actions: { gap: spacing.md, marginTop: spacing.lg }, actionCard: { ...ui.card, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md }, actionCopy: { flex: 1 }, actionTitle: { color: colors.text, fontSize: 16, fontWeight: "800" }, actionCaption: { color: colors.textMuted, fontSize: 12, marginTop: 2 }, inlineError: { ...ui.card, backgroundColor: "#321C2A", borderColor: "#5A2D38", marginTop: spacing.md }, errorCard: { ...ui.card, alignItems: "center", gap: spacing.md, width: "100%" }, error: { color: colors.error, textAlign: "center", lineHeight: 21 },
});
