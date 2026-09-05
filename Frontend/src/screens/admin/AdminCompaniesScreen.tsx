import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { companyError, Company, getAdminCompanies } from "../../services/company.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const label = (status?: Company["approval_status"]) => status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending Review";

export default function AdminCompaniesScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const handleError = useCallback(async (requestError: unknown) => {
    if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
      await clearAuthSession();
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      return;
    }
    setError(companyError(requestError));
  }, [navigation]);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (session?.user.role !== "admin") {
        setError("Administrator access is required to manage companies.");
        return;
      }
      setItems(await getAdminCompanies());
      setError("");
    } catch (requestError) {
      await handleError(requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleError]);

  useEffect(() => { void load(); }, [load]);

  const summary = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => item.approval_status === "pending").length,
    approved: items.filter((item) => item.approval_status === "approved").length,
    rejected: items.filter((item) => item.approval_status === "rejected").length,
  }), [items]);

  if (loading) return <View style={ui.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading company reviews…</Text></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()} accessibilityLabel="Back to home"><Ionicons name="arrow-back" size={18} color={colors.primary} /><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="business-outline" size={23} color={colors.primary} /></View><View style={styles.headerCopy}><Text style={typography.screenTitle}>Manage Companies</Text><Text style={typography.caption}>Review recruiter companies and approval status.</Text></View></View>

    {!error && items.length > 0 ? <View style={styles.summaryCard}><View style={styles.summaryTop}><View><Text style={styles.eyebrow}>COMPANY REVIEW</Text><Text style={styles.summaryTitle}>Approval overview</Text></View><View style={styles.totalBadge}><Text style={styles.totalText}>{summary.total} total</Text></View></View><View style={styles.summaryGrid}><SummaryMetric value={summary.pending} label="Pending" tone="warning" /><SummaryMetric value={summary.approved} label="Approved" tone="success" /><SummaryMetric value={summary.rejected} label="Rejected" tone="error" /></View></View> : null}

    {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={28} color={colors.error} /><Text style={styles.error}>{error}</Text><TouchableOpacity style={ui.primaryButton} onPress={() => void load()}><Text style={ui.primaryButtonText}>Retry</Text></TouchableOpacity></View> : null}
    {!error && items.length === 0 ? <View style={styles.empty}><Ionicons name="business-outline" size={32} color={colors.primary} /><Text style={styles.emptyTitle}>No companies yet</Text><Text style={styles.emptyText}>No companies have been created yet.</Text></View> : null}

    {!error && items.length > 0 ? <View style={styles.listHeader}><Text style={typography.sectionTitle}>Company registrations</Text><Text style={styles.listCaption}>Tap a company to review its details.</Text></View> : null}
    {items.map((item) => <TouchableOpacity key={item.id} style={[styles.card, item.approval_status === "pending" && styles.pendingCard]} onPress={() => navigation.navigate("AdminCompanyDetails", { companyId: item.id })} accessibilityLabel={`Review ${item.name}`}>
      <View style={styles.cardTop}><View style={styles.companyMark}><Ionicons name="business-outline" size={20} color={item.approval_status === "pending" ? colors.warning : colors.primary} /></View><View style={styles.companyCopy}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.location || "No location"}</Text></View><StatusBadge status={item.approval_status} /></View>
      {item.website ? <View style={styles.websiteRow}><Ionicons name="globe-outline" size={14} color={colors.textMuted} /><Text style={styles.website} numberOfLines={1}>{item.website}</Text></View> : null}
      <View style={styles.reviewAction}><Text style={styles.reviewText}>{item.approval_status === "pending" ? "Review approval" : "View company details"}</Text><Ionicons name="arrow-forward" size={17} color={colors.primary} /></View>
    </TouchableOpacity>)}
  </ScrollView>;
}

function SummaryMetric({ value, label, tone }: { value: number; label: string; tone: "warning" | "success" | "error" }) {
  return <View style={styles.summaryMetric}><Text style={[styles.summaryValue, tone === "warning" && styles.warningText, tone === "success" && styles.successText, tone === "error" && styles.errorText]}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function StatusBadge({ status }: { status?: Company["approval_status"] }) {
  const tone = status === "approved" ? styles.approvedBadge : status === "rejected" ? styles.rejectedBadge : styles.pendingBadge;
  const textTone = status === "approved" ? styles.approvedText : status === "rejected" ? styles.rejectedText : styles.pendingText;
  return <View style={[styles.statusBadge, tone]}><Text style={[styles.statusText, textTone]}>{label(status)}</Text></View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  loadingText: { ...typography.caption, marginTop: spacing.md },
  backAction: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xs, minHeight: 38, marginBottom: spacing.md },
  back: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  headerIcon: { width: 46, height: 46, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1, gap: spacing.xs },
  summaryCard: { ...ui.card, marginBottom: spacing.xl, backgroundColor: colors.backgroundElevated },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, fontWeight: "800", marginBottom: spacing.xs },
  summaryTitle: { ...typography.cardTitle },
  totalBadge: { backgroundColor: colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  totalText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
  summaryGrid: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider },
  summaryMetric: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  summaryValue: { color: colors.primary, fontSize: 23, fontWeight: "800" },
  summaryLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  warningText: { color: colors.warning }, successText: { color: colors.success }, errorText: { color: colors.error },
  listHeader: { marginBottom: spacing.md },
  listCaption: { ...typography.caption, fontSize: 13, marginTop: spacing.xs },
  card: { ...ui.card, marginBottom: spacing.md },
  pendingCard: { borderColor: "#705425" },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  companyMark: { width: 42, height: 42, borderRadius: radius.sm, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  companyCopy: { flex: 1, minWidth: 0 },
  name: { ...typography.cardTitle, fontSize: 17 },
  detail: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  statusBadge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: "800" },
  pendingBadge: { backgroundColor: "#3B301A" }, pendingText: { color: colors.warning },
  approvedBadge: { backgroundColor: "#123A34" }, approvedText: { color: colors.success },
  rejectedBadge: { backgroundColor: "#3A2028" }, rejectedText: { color: colors.error },
  websiteRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.md },
  website: { flex: 1, color: colors.textMuted, fontSize: 12 },
  reviewAction: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  reviewText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  errorBox: { ...ui.card, alignItems: "center", gap: spacing.md },
  error: { color: colors.error, textAlign: "center", lineHeight: 21 },
  empty: { ...ui.emptyState, gap: spacing.sm },
  emptyTitle: { ...typography.cardTitle },
  emptyText: { ...typography.caption, textAlign: "center" },
});
