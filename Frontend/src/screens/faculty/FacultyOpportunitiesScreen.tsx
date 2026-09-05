import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getMyFacultyOpportunities, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const typeLabels: Record<Opportunity["opportunity_type"], string> = { internship: "Internship", job: "Job", ra: "Research Assistant", ta: "Teaching Assistant", research: "Research" };
const statusStyle = (status: string) => status === "published" ? styles.published : status === "closed" ? styles.closed : styles.draft;

export default function FacultyOpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const resetForUnauthorized = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { const session = await getStoredAuthSession(); if (session?.user.role !== "faculty") { setError("Faculty access is required to manage opportunities."); return; } setOpportunities(await getMyFacultyOpportunities()); setError(""); } catch (requestError) { setError(getOpportunityErrorMessage(requestError)); if (isUnauthorizedOpportunityError(requestError)) await resetForUnauthorized(); } finally { setLoading(false); setRefreshing(false); } }, [resetForUnauthorized]);
  useEffect(() => { void load(); const unsubscribe = navigation.addListener("focus", () => void load()); return unsubscribe; }, [load, navigation]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Manage Opportunities</Text><Text style={styles.subtitle}>Create and manage your academic and research opportunities.</Text>
    <TouchableOpacity style={ui.primaryButton} onPress={() => navigation.navigate("CreateOpportunity")}><Text style={ui.primaryButtonText}>Create Opportunity</Text></TouchableOpacity>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {!error && opportunities.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No opportunities yet</Text><Text style={styles.emptyText}>You have not created any opportunities yet.</Text></View> : null}
    {opportunities.length ? <Text style={styles.sectionTitle}>Your opportunities</Text> : null}
    {opportunities.map((opportunity) => <TouchableOpacity key={opportunity.id} style={styles.card} onPress={() => navigation.navigate("FacultyOpportunityDetails", { opportunityId: opportunity.id })}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{opportunity.title}</Text><View style={[styles.statusBadge, statusStyle(opportunity.status)]}><Text style={styles.status}>{opportunity.status}</Text></View></View><View style={styles.typeBadge}><Text style={styles.type}>{typeLabels[opportunity.opportunity_type]}</Text></View><Text style={styles.detail}>Deadline: {opportunity.deadline.slice(0, 10)}</Text><Text style={styles.detail}>{opportunity.is_remote ? "Remote" : "On-site"}{opportunity.location ? ` · ${opportunity.location}` : ""}</Text><View style={styles.cardFooter}><Text style={styles.manageText}>Manage opportunity</Text><Text style={styles.viewAction}>View details</Text></View></TouchableOpacity>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl }, sectionTitle: { ...typography.sectionTitle, fontSize: 19, marginTop: spacing.xxl, marginBottom: spacing.md },
  card: { ...ui.card, marginBottom: spacing.md }, cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }, cardTitle: { ...typography.cardTitle, flex: 1 }, statusBadge: { ...ui.badge }, status: { color: colors.text, fontSize: 11, fontWeight: "800", textTransform: "capitalize" }, draft: { backgroundColor: "#3D341D", borderWidth: 1, borderColor: colors.warning }, published: { backgroundColor: "#123D3C", borderWidth: 1, borderColor: colors.success }, closed: { backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.textMuted }, typeBadge: { ...ui.badge, backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.secondary, marginTop: spacing.md }, type: { color: colors.secondary, fontSize: 11, fontWeight: "800" }, detail: { ...typography.caption, marginTop: spacing.sm }, cardFooter: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.md }, manageText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" }, viewAction: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  emptyState: { ...ui.emptyState, ...ui.card, marginTop: spacing.xl }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, emptyText: { ...typography.caption, textAlign: "center" }, errorBox: { ...ui.errorState, ...ui.card, marginTop: spacing.lg }, error: { color: colors.error, textAlign: "center", marginBottom: spacing.sm }, retry: { color: colors.primary, fontWeight: "800" },
});
