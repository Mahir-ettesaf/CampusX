import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { AdminDashboardStatistics, getAdminDashboard, getAdminDashboardErrorMessage, isUnauthorizedAdminDashboardError } from "../../services/admin-dashboard.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

type Tone = "primary" | "secondary" | "success" | "warning";
type Stat = { label: string; value: number; tone?: Tone };
type IconName = keyof typeof Ionicons.glyphMap;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [statistics, setStatistics] = useState<AdminDashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetForUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const session = await getStoredAuthSession();
      if (!session) {
        await resetForUnauthorized();
        return;
      }
      if (session.user.role !== "admin") {
        setStatistics(null);
        setErrorMessage("Administrator access is required to view the dashboard.");
        return;
      }
      setStatistics(await getAdminDashboard());
      setErrorMessage("");
    } catch (error) {
      if (isUnauthorizedAdminDashboardError(error)) {
        await resetForUnauthorized();
        return;
      }
      setErrorMessage(getAdminDashboardErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resetForUnauthorized]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <View style={ui.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading platform overview…</Text></View>;
  }

  if (!statistics) {
    return <View style={ui.centered}><View style={styles.stateCard}><Ionicons name="shield-outline" size={32} color={colors.error} /><Text style={styles.stateTitle}>Dashboard unavailable</Text><Text style={styles.error}>{errorMessage || "Unable to load dashboard statistics."}</Text><TouchableOpacity style={ui.primaryButton} onPress={() => void load()}><Text style={ui.primaryButtonText}>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity></View></View>;
  }

  const userStats: Stat[] = [{ label: "Total Users", value: statistics.total_users, tone: "primary" }, { label: "Students", value: statistics.students }, { label: "Graduates", value: statistics.graduates, tone: "secondary" }, { label: "Faculty", value: statistics.faculty }, { label: "Recruiters", value: statistics.recruiters }];
  const companyStats: Stat[] = [{ label: "Total Companies", value: statistics.companies, tone: "primary" }, { label: "Pending Approval", value: statistics.pending_companies, tone: "warning" }, { label: "Approved", value: statistics.approved_companies, tone: "success" }];
  const opportunityStats: Stat[] = [{ label: "Total Opportunities", value: statistics.opportunities, tone: "primary" }, { label: "Published", value: statistics.published_opportunities, tone: "success" }];
  const integrityStats: Stat[] = [{ label: "Awaiting company review", value: statistics.pending_companies, tone: "warning" }, { label: "Approved companies", value: statistics.approved_companies, tone: "success" }, { label: "Draft or closed opportunities", value: Math.max(0, statistics.opportunities - statistics.published_opportunities), tone: "secondary" }];
  const noActivity = userStats.concat(companyStats, opportunityStats, [{ label: "Total Applications", value: statistics.applications }]).every((item) => item.value === 0);

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()} accessibilityLabel="Back to home"><Ionicons name="arrow-back" size={18} color={colors.primary} /><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="shield-checkmark-outline" size={23} color={colors.primary} /></View><View style={styles.headerCopy}><Text style={typography.screenTitle}>Admin Dashboard</Text><Text style={typography.caption}>Your CampusX platform control center.</Text></View></View>
    <View style={styles.overviewCard}><View style={styles.overviewTop}><View><Text style={styles.eyebrow}>PLATFORM OVERVIEW</Text><Text style={styles.overviewTitle}>CampusX at a glance</Text></View><View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE DATA</Text></View></View><View style={styles.overviewMetrics}><OverviewMetric label="Users" value={statistics.total_users} icon="people-outline" /><View style={styles.metricDivider} /><OverviewMetric label="Opportunities" value={statistics.opportunities} icon="briefcase-outline" /><View style={styles.metricDivider} /><OverviewMetric label="Applications" value={statistics.applications} icon="document-text-outline" /></View></View>
    {noActivity ? <View style={styles.empty}><Ionicons name="analytics-outline" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>No activity yet</Text><Text style={styles.emptyText}>No platform activity has been recorded yet.</Text></View> : null}
    <StatSection title="User community" subtitle="Current members by role" icon="people-outline" items={userStats} />
    <StatSection title="Company review" subtitle="Approval activity that needs attention" icon="business-outline" items={companyStats} />
    <StatSection title="Opportunity activity" subtitle="Career and academic opportunities" icon="briefcase-outline" items={opportunityStats} />
    <View style={styles.applicationCard}><View style={styles.applicationIcon}><Ionicons name="document-text-outline" size={22} color={colors.secondary} /></View><View style={styles.applicationCopy}><Text style={styles.applicationValue}>{statistics.applications}</Text><Text style={styles.applicationLabel}>Total Applications</Text><Text style={styles.applicationCaption}>Applications submitted across CampusX.</Text></View></View>
    <View style={styles.integrityCard}><View style={styles.integrityHeader}><View style={styles.integrityIcon}><Ionicons name="shield-checkmark-outline" size={21} color={colors.primary} /></View><View><Text style={styles.integrityTitle}>Platform Integrity</Text><Text style={styles.integritySubtitle}>Current operational attention points</Text></View></View>{integrityStats.map((item) => <View key={item.label} style={styles.integrityRow}><View style={[styles.integrityMarker, item.tone === "warning" && styles.warningMarker, item.tone === "success" && styles.successMarker]} /><Text style={styles.integrityLabel}>{item.label}</Text><Text style={styles.integrityValue}>{item.value}</Text></View>)}</View>
    <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate("AdminCompanies")} accessibilityLabel="Manage companies"><Ionicons name="business-outline" size={20} color={colors.onPrimary} /><Text style={ui.primaryButtonText}>Manage Companies</Text><Ionicons name="arrow-forward" size={19} color={colors.onPrimary} /></TouchableOpacity>
    {errorMessage ? <View style={styles.inlineError}><Text style={styles.error}>{errorMessage}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
  </ScrollView>;
}

function OverviewMetric({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return <View style={styles.overviewMetric}><Ionicons name={icon} size={16} color={colors.textMuted} /><Text style={styles.overviewValue}>{value}</Text><Text style={styles.overviewLabel}>{label}</Text></View>;
}

function StatSection({ title, subtitle, icon, items }: { title: string; subtitle: string; icon: IconName; items: Stat[] }) {
  return <View style={styles.section}><View style={styles.sectionHeading}><View style={styles.sectionIcon}><Ionicons name={icon} size={19} color={colors.primary} /></View><View><Text style={typography.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View></View><View style={styles.grid}>{items.map((item) => <View key={item.label} style={styles.card}><Text style={[styles.cardValue, item.tone === "warning" && styles.warningText, item.tone === "success" && styles.successText, item.tone === "secondary" && styles.secondaryText]}>{item.value}</Text><Text style={styles.cardLabel}>{item.label}</Text></View>)}</View></View>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxl }, backAction: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xs, minHeight: 38, marginBottom: spacing.md }, back: { color: colors.primary, fontWeight: "700", fontSize: 14 }, header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl }, headerIcon: { width: 46, height: 46, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, headerCopy: { flex: 1, gap: spacing.xs }, overviewCard: { ...ui.card, backgroundColor: colors.backgroundElevated, marginBottom: spacing.xl }, overviewTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.lg }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: spacing.xs }, overviewTitle: { ...typography.cardTitle }, liveBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: "#11384A", borderRadius: radius.pill }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }, liveText: { color: colors.success, fontSize: 9, letterSpacing: 0.8, fontWeight: "800" }, overviewMetrics: { flexDirection: "row", alignItems: "stretch", justifyContent: "space-between" }, overviewMetric: { flex: 1, alignItems: "center", gap: 3 }, metricDivider: { width: 1, backgroundColor: colors.divider, marginVertical: 4 }, overviewValue: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 2 }, overviewLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600", textAlign: "center" }, section: { marginBottom: spacing.xl }, sectionHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }, sectionIcon: { width: 35, height: 35, borderRadius: radius.sm, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, sectionSubtitle: { ...typography.caption, fontSize: 12, marginTop: 1 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, card: { width: "48%", minHeight: 100, padding: spacing.md, justifyContent: "space-between", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }, cardValue: { color: colors.primary, fontSize: 27, fontWeight: "800" }, cardLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "700", marginTop: spacing.md }, warningText: { color: colors.warning }, successText: { color: colors.success }, secondaryText: { color: colors.secondary }, applicationCard: { ...ui.card, flexDirection: "row", gap: spacing.md, alignItems: "center", marginBottom: spacing.xl, backgroundColor: colors.surfaceRaised }, applicationIcon: { width: 48, height: 48, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: "#292750" }, applicationCopy: { flex: 1 }, applicationValue: { color: colors.text, fontSize: 27, fontWeight: "800" }, applicationLabel: { color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 }, applicationCaption: { color: colors.textMuted, fontSize: 12, marginTop: 3 }, integrityCard: { ...ui.card, marginBottom: spacing.xl }, integrityHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }, integrityIcon: { width: 36, height: 36, borderRadius: radius.sm, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised }, integrityTitle: { ...typography.cardTitle, fontSize: 17 }, integritySubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 1 }, integrityRow: { minHeight: 42, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.divider, gap: spacing.sm }, integrityMarker: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.secondary }, warningMarker: { backgroundColor: colors.warning }, successMarker: { backgroundColor: colors.success }, integrityLabel: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: "600" }, integrityValue: { color: colors.text, fontSize: 16, fontWeight: "800" }, manageButton: { ...ui.primaryButton, flexDirection: "row", gap: spacing.sm }, empty: { ...ui.card, alignItems: "center", marginBottom: spacing.xl, gap: spacing.sm }, emptyTitle: { ...typography.cardTitle }, emptyText: { ...typography.caption, textAlign: "center" }, stateCard: { ...ui.card, width: "100%", alignItems: "center", gap: spacing.md }, stateTitle: { ...typography.cardTitle }, loadingText: { ...typography.caption, marginTop: spacing.md }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm }, inlineError: { alignItems: "center", padding: spacing.lg },
});
