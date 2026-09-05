import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getMyResources } from "../../services/academic-resource.service";
import { getAnnouncements } from "../../services/announcement.service";
import { getMyFacultyOpportunities } from "../../services/opportunity.service";
import { colors, spacing, typography, ui } from "../../theme/CampusXTheme";

export default function FacultyEngagementScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<{ resources: number; announcements: number; opportunities: number; published: number } | null>(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const reset = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { const session = await getStoredAuthSession(); if (!session || session.user.role !== "faculty") { if (!session) await reset(); else setError("Faculty access is required."); return; } const [resources, announcements, opportunities] = await Promise.all([getMyResources(), getAnnouncements(), getMyFacultyOpportunities()]); setStats({ resources: resources.length, announcements: announcements.filter((item) => item.status === "published").length, opportunities: opportunities.length, published: opportunities.filter((item) => item.status === "published").length }); setError(""); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load faculty activity."); } finally { setLoading(false); setRefreshing(false); } }, [reset]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!stats) return <View style={styles.center}><Text style={styles.error}>{error || "Unable to load faculty activity."}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.link}>Retry</Text></TouchableOpacity></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Faculty Engagement</Text><Text style={styles.subtitle}>A clear view of your teaching, publishing, and opportunity activity.</Text>
    <View style={styles.overviewCard}><Text style={styles.overviewEyebrow}>ACTIVITY OVERVIEW</Text><Text style={styles.overviewTitle}>Your CampusX contribution at a glance</Text><Text style={styles.overviewDetail}>Review the resources, announcements, and opportunities you have created.</Text></View>
    <Text style={styles.sectionTitle}>Your activity</Text><View style={styles.metricsGrid}><Metric label="Resources uploaded" value={stats.resources} accent={colors.primary} /><Metric label="Published announcements" value={stats.announcements} accent={colors.secondary} /><Metric label="Opportunities created" value={stats.opportunities} accent={colors.info} /><Metric label="Published opportunities" value={stats.published} accent={colors.success} /></View>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.link}>Retry</Text></TouchableOpacity></View> : null}
  </ScrollView>;
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) { return <View style={styles.metricCard}><View style={[styles.metricAccent, { backgroundColor: accent }]} /><Text style={[styles.value, { color: accent }]}>{value}</Text><Text style={styles.label}>{label}</Text></View>; }

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, link: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl }, overviewCard: { ...ui.card, backgroundColor: colors.surfaceRaised }, overviewEyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, overviewTitle: { ...typography.cardTitle, marginTop: spacing.sm }, overviewDetail: { ...typography.caption, marginTop: spacing.sm }, sectionTitle: { ...typography.sectionTitle, fontSize: 19, marginTop: spacing.xl, marginBottom: spacing.md }, metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md }, metricCard: { ...ui.card, width: "48%", minHeight: 138, justifyContent: "center" }, metricAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 20, borderTopRightRadius: 20 }, value: { fontSize: 36, fontWeight: "800" }, label: { ...typography.caption, marginTop: spacing.sm }, errorBox: { ...ui.errorState, ...ui.card, marginTop: spacing.xl }, error: { color: colors.error, textAlign: "center", marginBottom: spacing.sm },
});
