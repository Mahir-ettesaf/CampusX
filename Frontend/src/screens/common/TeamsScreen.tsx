import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getTeamErrorMessage, getTeams, isUnauthorizedTeamError, Team } from "../../services/team.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const allowed = (role?: string) => role === "student" || role === "graduate";

export default function TeamsScreen() {
  const navigation = useNavigation<any>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const reset = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { const session = await getStoredAuthSession(); if (!session || !allowed(session.user.role)) { if (!session) await reset(); else setError("Project Teams is available to students and graduates only."); return; } setTeams(await getTeams()); setError(""); } catch (caughtError) { setError(getTeamErrorMessage(caughtError)); if (isUnauthorizedTeamError(caughtError)) await reset(); } finally { setLoading(false); setRefreshing(false); } }, [reset]);
  useEffect(() => { void load(); const remove = navigation.addListener("focus", () => void load()); return remove; }, [load, navigation]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <View style={styles.headerRow}><View><Text style={styles.title}>Teams</Text><Text style={styles.subtitle}>Collaborate, organize project work, and keep your team moving.</Text></View><TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateTeam")}><Text style={styles.createButtonText}>Create Team</Text></TouchableOpacity></View>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : teams.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No project teams yet</Text><Text style={styles.emptyText}>Create a team to begin collaborating with classmates.</Text></View> : <><Text style={styles.sectionTitle}>Your project teams</Text>{teams.map((team) => <TouchableOpacity key={team.id} style={styles.card} onPress={() => navigation.navigate("TeamDetails", { teamId: team.id })}>
      <View style={styles.cardHeader}><View style={styles.cardCopy}><Text style={styles.cardTitle}>{team.name}</Text>{team.description ? <Text style={styles.description} numberOfLines={2}>{team.description}</Text> : null}</View><View style={styles.memberBadge}><Text style={styles.memberCount}>{team.member_count}</Text><Text style={styles.memberLabel}>members</Text></View></View>
      <View style={styles.progressHeader}><Text style={styles.progressLabel}>Project progress</Text><Text style={styles.progressValue}>{team.progress_percentage}%</Text></View><View style={ui.progressTrack}><View style={[ui.progressFill, { width: `${Math.max(0, Math.min(100, team.progress_percentage))}%` }]} /></View>
      <View style={styles.cardFooter}><Text style={styles.taskText}>{team.task_count} {team.task_count === 1 ? "task" : "tasks"}</Text><Text style={styles.viewTeam}>View workspace</Text></View>
    </TouchableOpacity>)}</>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }, title: { ...typography.screenTitle }, subtitle: { ...typography.caption, maxWidth: 225, marginTop: spacing.xs }, createButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs }, createButtonText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" },
  sectionTitle: { ...typography.sectionTitle, fontSize: 19, marginTop: spacing.xxl, marginBottom: spacing.md }, card: { ...ui.card, marginBottom: spacing.md }, cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }, cardCopy: { flex: 1 }, cardTitle: { ...typography.cardTitle }, description: { ...typography.caption, marginTop: spacing.xs }, memberBadge: { alignItems: "center", backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.secondary, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, memberCount: { color: colors.secondary, fontSize: 18, fontWeight: "800" }, memberLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.sm }, progressLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "700" }, progressValue: { color: colors.primary, fontSize: 13, fontWeight: "800" }, cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider }, taskText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" }, viewTeam: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  emptyState: { ...ui.emptyState, ...ui.card, marginTop: spacing.xl }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, emptyText: { ...typography.caption, textAlign: "center" }, errorBox: { ...ui.errorState, ...ui.card, marginTop: spacing.xl }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm },
});
