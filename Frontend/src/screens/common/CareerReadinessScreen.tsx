import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
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
    return <View style={styles.loading}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  if (!readiness) {
    return <View style={styles.loading}><Text style={styles.error}>{errorMessage || "Unable to load Career Readiness."}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
      <Text style={styles.title}>Career Readiness</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.score}>{readiness.career_readiness.score} / 100</Text>
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

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 48 },
  backButton: { alignSelf: "flex-start", marginBottom: 16 },
  back: { color: "#2563EB", fontWeight: "600", marginTop: 12 },
  title: { color: "#1E3A8A", fontSize: 30, fontWeight: "bold", marginBottom: 16 },
  scoreCard: { padding: 22, borderRadius: 12, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE", alignItems: "center" },
  score: { color: "#1E3A8A", fontSize: 34, fontWeight: "bold" },
  level: { color: "#166534", fontSize: 18, fontWeight: "700", marginTop: 8 },
  sectionTitle: { color: "#1E3A8A", fontSize: 21, fontWeight: "700", marginTop: 28, marginBottom: 12 },
  breakdownCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginBottom: 10 },
  category: { color: "#333", fontSize: 18, fontWeight: "700" },
  points: { color: "#2563EB", fontWeight: "600", marginTop: 8 },
  percentage: { color: "#4B5563", marginTop: 4 },
  notApplicable: { color: "#4B5563", marginTop: 8 },
  improvement: { backgroundColor: "#F0FDF4", borderRadius: 8, padding: 13, marginBottom: 8 },
  improvementText: { color: "#166534", lineHeight: 21 },
  empty: { color: "#4B5563", lineHeight: 22 },
  errorBox: { marginTop: 20, alignItems: "center" },
  error: { color: "#DC2626", textAlign: "center", lineHeight: 21 },
  retry: { color: "#2563EB", fontWeight: "700", marginTop: 10 },
});
