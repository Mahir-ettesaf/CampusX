import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getMatchErrorMessage, getOpportunityMatch, isUnauthorizedMatchError, OpportunityMatch } from "../../services/opportunity-match.service";
import { getOpportunities, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const applicant = (role?: string) => role === "student" || role === "graduate";

export default function SkillMatchScreen() {
  const navigation = useNavigation<any>();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selected, setSelected] = useState<OpportunityMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchingId, setMatchingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const resetForUnauthorized = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { const session = await getStoredAuthSession(); if (!session) return void (await resetForUnauthorized()); if (!applicant(session.user.role)) { setError("Skill Match is available to students and graduates only."); return; } setOpportunities(await getOpportunities()); setError(""); } catch (requestError) { if (isUnauthorizedOpportunityError(requestError)) return void (await resetForUnauthorized()); setError(getOpportunityErrorMessage(requestError)); } finally { setLoading(false); setRefreshing(false); } }, [resetForUnauthorized]);
  useEffect(() => { void load(); }, [load]);
  const selectOpportunity = async (opportunityId: number) => { try { setMatchingId(opportunityId); setError(""); setSelected(await getOpportunityMatch(opportunityId)); } catch (requestError) { if (isUnauthorizedMatchError(requestError)) return void (await resetForUnauthorized()); setError(getMatchErrorMessage(requestError)); } finally { setMatchingId(null); } };
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const match = selected?.match;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Skill Match</Text><Text style={styles.subtitle}>Compare your profile skills with real opportunity requirements.</Text>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}

    {selected && match ? <View style={styles.matchCard}>
      <Text style={styles.cardEyebrow}>MATCH OVERVIEW</Text><Text style={styles.matchTitle}>{selected.opportunity.title}</Text>
      {match.can_calculate && match.percentage !== null ? <>
        <View style={styles.scoreRow}><Text style={styles.score}>{match.percentage}</Text><Text style={styles.scoreSuffix}>% match</Text><Text style={styles.scoreCount}>{match.matched_skill_count} / {match.total_required_skills}</Text></View>
        <View style={ui.progressTrack}><View style={[ui.progressFill, { width: `${Math.max(0, Math.min(100, match.percentage))}%` }]} /></View>
        <Text style={styles.scoreDescription}>Required skills currently matched</Text>
      </> : <Text style={styles.helper}>{match.message || "This opportunity has no required skills listed."}</Text>}

      {match.matched_skills.length > 0 ? <View style={styles.skillSection}><Text style={styles.section}>Matched skills</Text><View style={styles.chipRow}>{match.matched_skills.map((skill) => <View key={skill.skill_id} style={styles.matchedChip}><Text style={styles.matchedText}>{skill.skill_name}{skill.proficiency_level ? ` · ${skill.proficiency_level}` : ""}</Text></View>)}</View></View> : null}
      {match.missing_skills.length > 0 ? <View style={styles.skillSection}><Text style={styles.section}>Skills to develop</Text><Text style={styles.guidance}>Build these skills to improve your fit for this opportunity.</Text><View style={styles.chipRow}>{match.missing_skills.map((skill) => <View key={skill.skill_id} style={styles.missingChip}><Text style={styles.missingText}>{skill.skill_name}</Text></View>)}</View></View> : null}
    </View> : null}

    <Text style={styles.opportunitiesHeading}>Published opportunities</Text>
    {opportunities.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>Nothing to compare yet</Text><Text style={styles.helper}>No published opportunities are available to compare yet.</Text></View> : opportunities.map((item) => <View key={item.id} style={styles.opportunityCard}><Text style={styles.opportunityTitle}>{item.title}</Text><Text style={styles.helper}>{item.company_name || "CampusX"} · Deadline: {item.deadline.slice(0, 10)}</Text><TouchableOpacity style={[ui.outlineButton, styles.matchButton, matchingId !== null && ui.disabled]} disabled={matchingId !== null} onPress={() => void selectOpportunity(item.id)}><Text style={ui.outlineButtonText}>{matchingId === item.id ? "Checking…" : "View Skill Match"}</Text></TouchableOpacity></View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  errorBox: { ...ui.errorState, ...ui.card, marginBottom: spacing.lg }, error: { color: colors.error, textAlign: "center" }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm },
  matchCard: { ...ui.card, backgroundColor: colors.surfaceRaised }, cardEyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: spacing.sm }, matchTitle: { ...typography.cardTitle }, scoreRow: { flexDirection: "row", alignItems: "baseline", marginTop: spacing.lg, marginBottom: spacing.md }, score: { color: colors.primary, fontSize: 42, fontWeight: "800" }, scoreSuffix: { color: colors.textMuted, fontSize: 16, fontWeight: "700", marginLeft: spacing.xs }, scoreCount: { color: colors.success, fontSize: 13, fontWeight: "800", marginLeft: "auto" }, scoreDescription: { ...typography.caption, marginTop: spacing.sm },
  skillSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider }, section: { ...typography.cardTitle, fontSize: 16, marginBottom: spacing.sm }, guidance: { ...typography.caption, marginBottom: spacing.sm }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, matchedChip: { borderRadius: radius.pill, backgroundColor: "#123D3C", borderWidth: 1, borderColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, matchedText: { color: colors.success, fontSize: 12, fontWeight: "700" }, missingChip: { borderRadius: radius.pill, backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.warning, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, missingText: { color: colors.warning, fontSize: 12, fontWeight: "700" },
  opportunitiesHeading: { ...typography.sectionTitle, marginTop: spacing.xxl, marginBottom: spacing.md }, emptyState: { ...ui.emptyState, ...ui.card }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, helper: { ...typography.caption, lineHeight: 21 }, opportunityCard: { ...ui.card, marginBottom: spacing.md }, opportunityTitle: { ...typography.cardTitle }, matchButton: { alignSelf: "flex-start", marginTop: spacing.md, minHeight: 42, paddingHorizontal: spacing.md },
});
