import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getRecommendedOpportunities, getRecommendationErrorMessage, isUnauthorizedRecommendationError, OpportunityRecommendation } from "../../services/recommendation.service";

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
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity><Text style={styles.title}>Recommended for You</Text><Text style={styles.helper}>Recommendations use your profile skills and opportunity requirements.</Text>
    {error ? <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : items.length === 0 ? <Text style={styles.empty}>No recommendations yet. Add relevant skills or check back when suitable opportunities are published.</Text> : items.map((item) => <TouchableOpacity key={item.opportunity.id} style={styles.card} onPress={() => navigation.navigate("OpportunityDetails", { opportunityId: item.opportunity.id })}><Text style={styles.cardTitle}>{item.opportunity.title}</Text><Text style={styles.detail}>{item.opportunity.type} · {item.opportunity.remote ? "Remote" : "On-site"}{item.opportunity.location ? ` · ${item.opportunity.location}` : ""}</Text>{item.match.can_calculate && item.match.percentage !== null ? <Text style={styles.score}>{item.match.percentage}% match · {item.match.matched_skill_count}/{item.match.total_required_skill_count} skills</Text> : <Text style={styles.detail}>Skill match unavailable</Text>}<Text style={styles.detail}>Deadline: {item.opportunity.deadline.slice(0, 10)}</Text></TouchableOpacity>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }, page: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24, paddingBottom: 48 }, back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 }, title: { color: "#1E3A8A", fontSize: 30, fontWeight: "bold" }, helper: { color: "#4B5563", marginTop: 8, lineHeight: 21 }, card: { borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 10, padding: 16, marginTop: 14, backgroundColor: "#EFF6FF" }, cardTitle: { color: "#1E3A8A", fontSize: 18, fontWeight: "700" }, detail: { color: "#4B5563", marginTop: 7 }, score: { color: "#166534", fontWeight: "700", marginTop: 10 }, empty: { color: "#4B5563", textAlign: "center", marginTop: 32, lineHeight: 22 }, error: { color: "#DC2626", textAlign: "center" }, retry: { color: "#2563EB", fontWeight: "700", marginTop: 10 } });
