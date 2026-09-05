import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getMyRecruiterOpportunities, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const labels: Record<"job" | "internship", string> = { job: "Job", internship: "Internship" };
const statusStyle = (status: string) => status === "published" ? styles.published : status === "closed" ? styles.closed : styles.draft;

export default function RecruiterOpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const resetForUnauthorized = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { const session = await getStoredAuthSession(); if (session?.user.role !== "recruiter") { setError("Recruiter access is required to manage Jobs and Internships."); return; } const owned = await getMyRecruiterOpportunities(); setOpportunities(owned.filter((item) => item.opportunity_type === "job" || item.opportunity_type === "internship")); setError(""); } catch (requestError) { setError(getOpportunityErrorMessage(requestError)); if (isUnauthorizedOpportunityError(requestError)) await resetForUnauthorized(); } finally { setLoading(false); setRefreshing(false); } }, [resetForUnauthorized]);
  useEffect(() => { void load(); const unsubscribe = navigation.addListener("focus", () => void load()); return unsubscribe; }, [load, navigation]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Jobs & Internships</Text><Text style={styles.subtitle}>Create and manage opportunities for CampusX talent.</Text>
    <TouchableOpacity style={ui.primaryButton} onPress={() => navigation.navigate("CreateRecruiterOpportunity")}><Text style={ui.primaryButtonText}>Create Job or Internship</Text></TouchableOpacity>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {!error && opportunities.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No jobs or internships yet</Text><Text style={styles.emptyText}>You have not created any Jobs or Internships yet.</Text></View> : null}
    {opportunities.length ? <Text style={styles.sectionTitle}>Your opportunities</Text> : null}
    {opportunities.map((item) => <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate("RecruiterOpportunityDetails", { opportunityId: item.id })}><View style={styles.cardHeader}><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.company}>{item.company_name || "Associated company"}</Text></View><View style={[styles.statusBadge, statusStyle(item.status)]}><Text style={styles.status}>{item.status}</Text></View></View><View style={styles.typeBadge}><Text style={styles.type}>{labels[item.opportunity_type as "job" | "internship"]}</Text></View><Text style={styles.detail}>{item.is_remote ? "Remote" : "On-site"}{item.location ? ` · ${item.location}` : ""}</Text><View style={styles.cardFooter}><Text style={styles.deadline}>Deadline: {item.deadline.slice(0, 10)}</Text><Text style={styles.viewAction}>Manage</Text></View></TouchableOpacity>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl }, sectionTitle: { ...typography.sectionTitle, fontSize: 19, marginTop: spacing.xxl, marginBottom: spacing.md },
  card: { ...ui.card, marginBottom: spacing.md }, cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }, cardCopy: { flex: 1 }, cardTitle: { ...typography.cardTitle }, company: { ...typography.caption, marginTop: spacing.xs }, statusBadge: { ...ui.badge }, status: { color: colors.text, fontSize: 11, fontWeight: "800", textTransform: "capitalize" }, draft: { backgroundColor: "#3D341D", borderWidth: 1, borderColor: colors.warning }, published: { backgroundColor: "#123D3C", borderWidth: 1, borderColor: colors.success }, closed: { backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.textMuted }, typeBadge: { ...ui.badge, backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.secondary, marginTop: spacing.md }, type: { color: colors.secondary, fontSize: 11, fontWeight: "800" }, detail: { ...typography.caption, marginTop: spacing.md }, cardFooter: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.md }, deadline: { color: colors.warning, fontSize: 12, fontWeight: "700" }, viewAction: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  emptyState: { ...ui.emptyState, ...ui.card, marginTop: spacing.xl }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, emptyText: { ...typography.caption, textAlign: "center" }, errorBox: { ...ui.errorState, ...ui.card, marginTop: spacing.lg }, error: { color: colors.error, textAlign: "center", marginBottom: spacing.sm }, retry: { color: colors.primary, fontWeight: "800" },
});
