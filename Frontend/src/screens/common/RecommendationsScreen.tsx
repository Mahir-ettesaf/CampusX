import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getRecommendedOpportunities, getRecommendationErrorMessage, isUnauthorizedRecommendationError, OpportunityRecommendation } from "../../services/recommendation.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const applicant = (role?: string) => role === "student" || role === "graduate";

export default function RecommendationsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<OpportunityRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const resetForUnauthorized = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (!session) return void (await resetForUnauthorized());
      if (!applicant(session.user.role)) { setError("Recommendations are available to students and graduates only."); return; }
      setItems(await getRecommendedOpportunities()); setError("");
    } catch (requestError) {
      if (isUnauthorizedRecommendationError(requestError)) return void (await resetForUnauthorized());
      setError(getRecommendationErrorMessage(requestError));
    } finally { setLoading(false); setRefreshing(false); }
  }, [resetForUnauthorized]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Finding opportunities for you…</Text></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <View style={styles.header}><Text style={styles.eyebrow}>CAREER DISCOVERY</Text><Text style={styles.title}>Recommended for You</Text><Text style={styles.helper}>Recommendations use your profile skills and opportunity requirements.</Text></View>
    {error ? <View style={styles.errorCard}><Text style={styles.error}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No recommendations yet</Text><Text style={styles.emptyText}>Add relevant skills or check back when suitable opportunities are published.</Text></View> : <><Text style={styles.listTitle}>Matched opportunities</Text>{items.map((item) => <TouchableOpacity key={item.opportunity.id} style={styles.card} onPress={() => navigation.navigate("OpportunityDetails", { opportunityId: item.opportunity.id })}><View style={styles.cardTop}><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.opportunity.title}</Text></View>{item.match.can_calculate && item.match.percentage !== null ? <View style={styles.scoreBadge}><Text style={styles.score}>{item.match.percentage}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View> : null}</View><View style={styles.chipRow}><Text style={styles.chip}>{item.opportunity.type}</Text><Text style={styles.chip}>{item.opportunity.remote ? "Remote" : "On-site"}</Text>{item.opportunity.location ? <Text style={styles.chip}>{item.opportunity.location}</Text> : null}</View>{item.match.can_calculate && item.match.percentage !== null ? <><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, item.match.percentage))}%` }]} /></View><Text style={styles.detail}>{item.match.matched_skill_count}/{item.match.total_required_skill_count} required skills matched</Text></> : <Text style={styles.detail}>Skill match unavailable</Text>}<View style={styles.cardFooter}><Text style={styles.deadline}>Deadline · {item.opportunity.deadline.slice(0, 10)}</Text><Text style={styles.viewAction}>View details</Text></View></TouchableOpacity>)}</>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  center: { ...ui.centered }, page: { ...ui.screen }, content: { ...ui.screenContent },
  loadingText: { ...typography.caption, marginTop: spacing.md }, back: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md },
  header: { marginBottom: spacing.lg }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, fontWeight: "800", marginBottom: spacing.xs }, title: { ...typography.screenTitle }, helper: { ...typography.caption, marginTop: spacing.sm, lineHeight: 21 },
  listTitle: { ...typography.sectionTitle, marginBottom: spacing.xs },
  card: { ...ui.card, marginTop: spacing.md }, cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md }, cardCopy: { flex: 1 }, cardTitle: { ...typography.cardTitle },
  scoreBadge: { minWidth: 58, alignItems: "center", backgroundColor: "#123A34", borderWidth: 1, borderColor: "#286759", borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, score: { color: colors.success, fontSize: 18, fontWeight: "800" }, scoreLabel: { color: colors.success, fontSize: 8, letterSpacing: 0.8, fontWeight: "800", marginTop: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md }, chip: { color: colors.info, backgroundColor: "#103553", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: 11, fontWeight: "700", overflow: "hidden" },
  progressTrack: { ...ui.progressTrack, marginTop: spacing.lg }, progressFill: { ...ui.progressFill }, detail: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm }, cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.md }, deadline: { color: colors.textMuted, fontSize: 12 }, viewAction: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  empty: { ...ui.card, alignItems: "center", marginTop: spacing.lg }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.sm }, emptyText: { ...typography.caption, textAlign: "center", lineHeight: 22 }, errorCard: { ...ui.card, alignItems: "center", marginTop: spacing.md, backgroundColor: "#321C2A", borderColor: "#5A2D38" }, error: { color: colors.error, textAlign: "center" }, retryButton: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, retry: { color: colors.primary, fontWeight: "800" },
});
