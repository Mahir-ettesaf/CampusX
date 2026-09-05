import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getOpportunities, Opportunity } from "../../services/opportunity.service";
import { getLearningPath, getLearningPathErrorMessage, isUnauthorizedLearningPathError, LearningPath } from "../../services/learning-path.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const applicant = (role?: string) => role === "student" || role === "graduate";

export default function LearningPathScreen() {
  const nav = useNavigation<any>();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [selected, setSelected] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const reset = useCallback(async () => { await clearAuthSession(); nav.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [nav]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { const session = await getStoredAuthSession(); if (!session || !applicant(session.user.role)) { if (!session) await reset(); else setError("Learning Path is available to students and graduates only."); return; } setOpps(await getOpportunities()); setPath(await getLearningPath(selected)); setError(""); } catch (caughtError) { setError(getLearningPathErrorMessage(caughtError)); if (isUnauthorizedLearningPathError(caughtError)) await reset(); } finally { setLoading(false); setRefreshing(false); } }, [reset, selected]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  const requiredCount = path?.skill_summary?.required_count || 0;
  const matchedCount = path?.skill_summary?.matched_count || 0;
  const progress = requiredCount ? Math.round((matchedCount / requiredCount) * 100) : 0;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => nav.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Learning Path</Text><Text style={styles.subtitle}>Build the skills that move you closer to career readiness.</Text>
    <Text style={styles.heading}>Choose a target opportunity</Text>
    {opps.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No opportunities available</Text><Text style={styles.detail}>No published opportunities are available.</Text></View> : <View style={styles.targetList}>{opps.map((opportunity) => <TouchableOpacity key={opportunity.id} style={[styles.targetCard, selected === opportunity.id && styles.selectedTarget]} onPress={() => setSelected(opportunity.id)}><View style={styles.targetHeader}><Text style={styles.cardTitle}>{opportunity.title}</Text>{selected === opportunity.id ? <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>Selected</Text></View> : null}</View><Text style={styles.detail}>{opportunity.opportunity_type}{opportunity.company_name ? ` · ${opportunity.company_name}` : ""}</Text></TouchableOpacity>)}</View>}
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {path?.target ? <>
      <Text style={styles.heading}>Current progress</Text>
      <View style={styles.progressCard}><View style={styles.progressHeader}><View><Text style={styles.cardEyebrow}>SKILL COVERAGE</Text><Text style={styles.progressTitle}>Progress toward {path.target.title}</Text></View><Text style={styles.progressPercent}>{progress}%</Text></View><View style={ui.progressTrack}><View style={[ui.progressFill, { width: `${progress}%` }]} /></View><View style={styles.metricRow}><Text style={styles.metric}>Required <Text style={styles.metricValue}>{requiredCount}</Text></Text><Text style={styles.metric}>Matched <Text style={styles.metricSuccess}>{matchedCount}</Text></Text><Text style={styles.metric}>Missing <Text style={styles.metricWarning}>{path.skill_summary?.missing_count || 0}</Text></Text></View></View>
      <Text style={styles.heading}>Skills to develop</Text>
      {path.missing_skills.length ? <View style={styles.skillCard}><Text style={styles.guidance}>Focus on these skills to improve your fit for this target.</Text><View style={styles.chipRow}>{path.missing_skills.map((skill) => <View key={skill.skill_id} style={styles.skillChip}><Text style={styles.skillText}>{skill.skill_name}</Text></View>)}</View></View> : <View style={styles.emptyState}><Text style={styles.detail}>{path.message}</Text></View>}
      <Text style={styles.heading}>Recommended resources</Text>
      {path.learning_path.length ? path.learning_path.map((resource) => <TouchableOpacity key={resource.id} style={styles.resourceCard} onPress={() => nav.navigate("AcademicResourceDetails", { resourceId: resource.id })}><Text style={styles.resourceType}>{resource.resource_type}</Text><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.detail}>{resource.subject ? resource.subject : "Academic resource"}</Text><Text style={styles.why}>Helps develop: {resource.helps_develop.join(", ")}</Text><Text style={styles.viewResource}>View resource</Text></TouchableOpacity>) : <View style={styles.emptyState}><Text style={styles.detail}>{path.missing_skills.length ? path.message : ""}</Text></View>}
    </> : <View style={styles.emptyState}><Text style={styles.detail}>{path?.message || "Select an opportunity to build a learning path."}</Text></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl }, heading: { ...typography.sectionTitle, fontSize: 19, marginTop: spacing.xl, marginBottom: spacing.md },
  targetList: { gap: spacing.sm }, targetCard: { ...ui.card, padding: spacing.md }, selectedTarget: { backgroundColor: colors.surfaceRaised, borderColor: colors.primary }, targetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }, cardTitle: { ...typography.cardTitle, flex: 1 }, selectedBadge: { ...ui.badge, backgroundColor: colors.primary }, selectedBadgeText: { color: colors.onPrimary, fontSize: 11, fontWeight: "800" }, detail: { ...typography.caption, marginTop: spacing.xs },
  progressCard: { ...ui.card, backgroundColor: colors.surfaceRaised }, progressHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.lg }, cardEyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, progressTitle: { ...typography.cardTitle, marginTop: spacing.xs }, progressPercent: { color: colors.primary, fontSize: 26, fontWeight: "800" }, metricRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }, metric: { color: colors.textMuted, fontSize: 12, fontWeight: "700" }, metricValue: { color: colors.text }, metricSuccess: { color: colors.success }, metricWarning: { color: colors.warning },
  skillCard: { ...ui.card }, guidance: { ...typography.caption, marginBottom: spacing.md }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, skillChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.warning, backgroundColor: colors.backgroundElevated }, skillText: { color: colors.warning, fontSize: 12, fontWeight: "700" },
  resourceCard: { ...ui.card, marginBottom: spacing.md }, resourceType: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: spacing.sm }, why: { color: colors.success, fontSize: 13, fontWeight: "700", marginTop: spacing.md }, viewResource: { color: colors.primary, fontSize: 13, fontWeight: "800", marginTop: spacing.md },
  emptyState: { ...ui.emptyState, ...ui.card, marginTop: spacing.sm }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, errorBox: { ...ui.errorState, ...ui.card, marginTop: spacing.lg }, error: { color: colors.error, textAlign: "center" }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm },
});
