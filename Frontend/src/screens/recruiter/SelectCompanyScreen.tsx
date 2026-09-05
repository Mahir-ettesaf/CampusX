import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { companies, companyError, Company } from "../../services/company.service";
import { getProfile, getProfileErrorMessage, updateRecruiterProfile } from "../../services/profile.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

export default function SelectCompanyScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Company[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [available, profile] = await Promise.all([companies(), getProfile()]);
      if (profile.user.role !== "recruiter") { setError("Recruiter access is required."); return; }
      const title = profile.recruiter_profile?.job_title?.trim();
      if (!title) { setError("Set your recruiter job title before selecting a company."); return; }
      setItems(available); setJobTitle(title); setError("");
    } catch (requestError) { setError(companyError(requestError) || getProfileErrorMessage(requestError)); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const select = async (item: Company) => {
    if (item.approval_status !== "approved") return;
    try {
      setSelecting(item.id); setError("");
      await updateRecruiterProfile(item.id, jobTitle);
      Toast.show({ type: "success", text1: "Company selected", text2: "Your recruiter profile has been updated." });
      navigation.reset({ index: 0, routes: [{ name: "RecruiterProfile" }] });
    } catch (requestError) { setError(getProfileErrorMessage(requestError)); } finally { setSelecting(null); }
  };
  if (loading) return <View style={ui.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading available companies…</Text></View>;
  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Recruiter Profile</Text></TouchableOpacity>
    <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="business-outline" size={23} color={colors.primary} /></View><View style={styles.headerCopy}><Text style={typography.screenTitle}>Select Company</Text><Text style={typography.caption}>Associate your recruiter profile with an approved company.</Text></View></View>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {!error && items.length === 0 ? <View style={styles.empty}><Ionicons name="business-outline" size={32} color={colors.primary} /><Text style={styles.emptyTitle}>No companies available</Text><Text style={styles.emptyText}>No companies are available right now.</Text></View> : null}
    {!error && items.length > 0 ? <Text style={styles.listTitle}>Available companies</Text> : null}
    {items.map((item) => { const approved = item.approval_status === "approved"; const actionLabel = approved ? "Select" : item.approval_status === "pending" ? "Pending Admin Approval" : "Rejected"; return <View key={item.id} style={[styles.card, approved && styles.approvedCard]}><View style={styles.cardTop}><View style={styles.companyIcon}><Ionicons name="business-outline" size={20} color={approved ? colors.primary : colors.textMuted} /></View><View style={styles.companyCopy}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.location || "Location not provided"}</Text></View><StatusBadge status={item.approval_status} /></View>{item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}<TouchableOpacity style={[styles.button, !approved && styles.disabled]} disabled={!approved || selecting !== null} onPress={() => void select(item)}>{selecting === item.id ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>{actionLabel}</Text>}</TouchableOpacity></View>; })}
  </ScrollView>;
}

function StatusBadge({ status }: { status?: Company["approval_status"] }) { const approved = status === "approved"; const rejected = status === "rejected"; return <View style={[styles.status, approved && styles.approvedStatus, rejected && styles.rejectedStatus]}><Text style={[styles.statusText, approved && styles.approvedText, rejected && styles.rejectedText]}>{approved ? "Approved" : rejected ? "Rejected" : "Pending"}</Text></View>; }

const styles = StyleSheet.create({
  content: { ...ui.screenContent }, loadingText: { ...typography.caption, marginTop: spacing.md }, back: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md }, header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl }, headerIcon: { width: 46, height: 46, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, headerCopy: { flex: 1, gap: spacing.xs }, listTitle: { ...typography.sectionTitle, marginBottom: spacing.xs }, card: { ...ui.card, marginTop: spacing.md }, approvedCard: { borderColor: "#315879" }, cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, companyIcon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, companyCopy: { flex: 1, minWidth: 0 }, name: { ...typography.cardTitle, fontSize: 17 }, detail: { color: colors.textMuted, fontSize: 13, marginTop: 2 }, description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.md }, status: { backgroundColor: "#3B301A", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, statusText: { color: colors.warning, fontSize: 10, fontWeight: "800" }, approvedStatus: { backgroundColor: "#123A34" }, approvedText: { color: colors.success }, rejectedStatus: { backgroundColor: "#3A2028" }, rejectedText: { color: colors.error }, button: { ...ui.primaryButton, minHeight: 46, marginTop: spacing.md }, disabled: { backgroundColor: colors.surfaceRaised, opacity: 0.7 }, buttonText: { ...ui.primaryButtonText }, empty: { ...ui.emptyState, gap: spacing.sm }, emptyTitle: { ...typography.cardTitle }, emptyText: { ...typography.caption, textAlign: "center" }, errorBox: { ...ui.card, alignItems: "center", gap: spacing.md, backgroundColor: "#321C2A", borderColor: "#5A2D38" }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, retryButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, retry: { color: colors.primary, fontWeight: "800" },
});
