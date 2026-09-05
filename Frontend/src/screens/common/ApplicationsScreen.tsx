import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession } from "../../services/authservice";
import { appError, getMyApplications, unauthorized, Application } from "../../services/application.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const statusStyle = (status: string) => {
  if (status === "accepted") return styles.accepted;
  if (status === "rejected") return styles.rejected;
  if (status === "shortlisted") return styles.shortlisted;
  if (status === "reviewing") return styles.reviewing;
  if (status === "withdrawn") return styles.withdrawn;
  return styles.submitted;
};

export default function ApplicationsScreen() {
  const navigation = useNavigation<any>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { setApplications(await getMyApplications()); setError(""); } catch (caughtError) { setError(appError(caughtError)); if (unauthorized(caughtError)) { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); } } finally { setLoading(false); setRefreshing(false); } }, [navigation]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const statusCounts = applications.reduce<Record<string, number>>((counts, application) => ({ ...counts, [application.status]: (counts[application.status] || 0) + 1 }), {});
  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>My Applications</Text><Text style={styles.subtitle}>Track the opportunities you have submitted and their progress.</Text>
    {applications.length > 0 ? <View style={styles.summaryCard}><View><Text style={styles.summaryLabel}>APPLICATIONS</Text><Text style={styles.summaryCount}>{applications.length}</Text><Text style={styles.summaryText}>Submitted opportunities</Text></View><View style={styles.statusCountRow}>{Object.entries(statusCounts).map(([status, count]) => <View key={status} style={[styles.statusCount, statusStyle(status)]}><Text style={styles.statusCountText}>{count} {status.replace("_", " ")}</Text></View>)}</View></View> : null}
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {!error && applications.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No applications yet</Text><Text style={styles.emptyText}>You have not submitted any applications yet.</Text></View> : null}
    {applications.map((application) => <TouchableOpacity key={application.id} style={styles.card} onPress={() => navigation.navigate("ApplicationDetails", { applicationId: application.id })}><View style={styles.cardHeader}><Text style={styles.name}>{application.opportunity_title}</Text><View style={[styles.statusBadge, statusStyle(application.status)]}><Text style={styles.status}>{application.status.replace("_", " ")}</Text></View></View><Text style={styles.details}>Submitted: {application.submitted_at.slice(0, 10)}</Text><View style={styles.cardFooter}><Text style={styles.trackText}>Application tracking</Text><Text style={styles.viewAction}>View details</Text></View></TouchableOpacity>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  summaryCard: { ...ui.card, backgroundColor: colors.surfaceRaised, flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.xl }, summaryLabel: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, summaryCount: { color: colors.primary, fontSize: 40, fontWeight: "800", marginTop: spacing.xs }, summaryText: { ...typography.caption }, statusCountRow: { flex: 1, alignItems: "flex-end", justifyContent: "center", gap: spacing.xs }, statusCount: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, statusCountText: { color: colors.text, fontSize: 10, fontWeight: "800", textTransform: "capitalize" },
  card: { ...ui.card, marginBottom: spacing.md }, cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md }, name: { ...typography.cardTitle, flex: 1 }, statusBadge: { ...ui.badge }, status: { color: colors.text, fontSize: 11, fontWeight: "800", textTransform: "capitalize" }, details: { ...typography.caption, marginTop: spacing.md }, cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider }, trackText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" }, viewAction: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  submitted: { backgroundColor: "#183755", borderColor: colors.info, borderWidth: 1 }, reviewing: { backgroundColor: "#3D341D", borderColor: colors.warning, borderWidth: 1 }, shortlisted: { backgroundColor: "#292750", borderColor: colors.secondary, borderWidth: 1 }, accepted: { backgroundColor: "#123D3C", borderColor: colors.success, borderWidth: 1 }, rejected: { backgroundColor: "#48232C", borderColor: colors.error, borderWidth: 1 }, withdrawn: { backgroundColor: colors.backgroundElevated, borderColor: colors.textMuted, borderWidth: 1 },
  emptyState: { ...ui.emptyState, ...ui.card, marginTop: spacing.lg }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, emptyText: { ...typography.caption, textAlign: "center" }, errorBox: { ...ui.errorState, ...ui.card, marginBottom: spacing.lg }, error: { color: colors.error, textAlign: "center" }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm },
});
