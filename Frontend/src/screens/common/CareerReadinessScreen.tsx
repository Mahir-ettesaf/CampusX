import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";
import {
  CareerReadiness,
  getCareerReadiness,
  getCareerReadinessErrorMessage,
  isUnauthorizedCareerReadinessError,
} from "../../services/career-readiness.service";

const isApplicantRole = (role?: string) => role === "student" || role === "graduate";

export default function CareerReadinessScreen() {
  const navigation = useNavigation<any>();
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
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
      if (!isApplicantRole(session.user.role)) {
        setReadiness(null);
        setErrorMessage("Career Readiness is available to students and graduates only.");
        return;
      }

      setReadiness(await getCareerReadiness());
      setErrorMessage("");
    } catch (error) {
      if (isUnauthorizedCareerReadinessError(error)) {
        await resetForUnauthorized();
        return;
      }
      setErrorMessage(getCareerReadinessErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resetForUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!readiness) {
    return <View style={styles.loading}><Text style={styles.error}>{errorMessage || "Unable to load Career Readiness."}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
      <Text style={styles.title}>Career Readiness</Text>
      <Text style={styles.subtitle}>Track the profile signals supporting your next career step.</Text>
      <View style={styles.scoreCard}>
        <ReadinessRing score={readiness.career_readiness.score} />
        <Text style={styles.scoreLabel}>Career Readiness</Text>
        <Text style={styles.level}>{readiness.career_readiness.level}</Text>
      </View>

      <Text style={styles.sectionTitle}>Readiness Breakdown</Text>
      {readiness.breakdown.map((item) => (
        <View key={item.category} style={styles.breakdownCard}>
          <Text style={styles.category}>{item.category}</Text>
          {item.applicable ? <><Text style={styles.points}>{item.earned} / {item.maximum}</Text><Text style={styles.percentage}>{item.percentage}%</Text></> : <Text style={styles.notApplicable}>Not applicable for your current role</Text>}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Improve Your Readiness</Text>
      {readiness.improvement_areas.length === 0 ? <Text style={styles.empty}>You have completed the current readiness checks.</Text> : readiness.improvement_areas.map((area) => <View key={area} style={styles.improvement}><Text style={styles.improvementText}>• {area}</Text></View>)}

      {errorMessage ? <View style={styles.errorBox}><Text style={styles.error}>{errorMessage}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    </ScrollView>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const activeSegments = Math.round(safeScore);
  const size = 142;
  const center = size / 2;
  const radiusValue = 61;
  return <View style={styles.ring}>{Array.from({ length: 100 }, (_, index) => {
    const angle = ((index / 100) * 360 - 90) * (Math.PI / 180);
    return <View key={index} style={[styles.ringSegment, { left: center + Math.cos(angle) * radiusValue - 2, top: center + Math.sin(angle) * radiusValue - 4, transform: [{ rotate: `${index * 3.6}deg` }] }, index < activeSegments ? styles.activeSegment : styles.inactiveSegment]} />;
  })}<View style={styles.ringCenter}><Text style={styles.ringScore}>{safeScore}</Text><Text style={styles.outOf}>/100</Text></View></View>;
}

const styles = StyleSheet.create({
  loading: ui.centered, container: ui.screen, content: ui.screenContent,
  backButton: { alignSelf: "flex-start", marginBottom: spacing.lg }, back: { ...ui.textButton, marginTop: spacing.sm }, title: typography.screenTitle, subtitle: { ...typography.caption, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing.xl },
  scoreCard: { ...ui.card, alignItems: "center", paddingVertical: spacing.xl }, ring: { width: 142, height: 142, position: "relative", justifyContent: "center", alignItems: "center", marginBottom: spacing.md }, ringSegment: { position: "absolute", width: 4, height: 10, borderRadius: radius.pill }, activeSegment: { backgroundColor: colors.primary }, inactiveSegment: { backgroundColor: colors.divider }, ringCenter: { alignItems: "center" }, ringScore: { color: colors.text, fontSize: 38, fontWeight: "800", lineHeight: 42 }, outOf: { ...typography.caption, marginTop: -1 },
  scoreLabel: { ...typography.cardTitle, marginTop: spacing.xs }, level: { color: colors.success, fontSize: 16, fontWeight: "700", marginTop: spacing.xs },
  sectionTitle: { ...typography.sectionTitle, marginTop: spacing.xl, marginBottom: spacing.md }, breakdownCard: { ...ui.card, marginBottom: spacing.sm }, category: typography.cardTitle, points: { color: colors.primary, fontWeight: "700", marginTop: spacing.sm }, percentage: { ...typography.caption, marginTop: spacing.xs }, notApplicable: { ...typography.caption, marginTop: spacing.sm },
  improvement: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm }, improvementText: { color: colors.text, lineHeight: 21 }, empty: { ...typography.caption, lineHeight: 22 }, errorBox: { ...ui.errorState, ...ui.card, marginTop: spacing.xl }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, retry: { ...ui.textButton, marginTop: spacing.sm },
});
