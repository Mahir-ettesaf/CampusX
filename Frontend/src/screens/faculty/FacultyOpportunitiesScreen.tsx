import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getMyFacultyOpportunities, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity } from "../../services/opportunity.service";

const typeLabels: Record<Opportunity["opportunity_type"], string> = { internship: "Internship", job: "Job", ra: "Research Assistant", ta: "Teaching Assistant", research: "Research" };

export default function FacultyOpportunitiesScreen() {
  const navigation = useNavigation<any>();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const resetForUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (session?.user.role !== "faculty") {
        setError("Faculty access is required to manage opportunities.");
        return;
      }
      setOpportunities(await getMyFacultyOpportunities());
      setError("");
    } catch (requestError) {
      setError(getOpportunityErrorMessage(requestError));
      if (isUnauthorizedOpportunityError(requestError)) await resetForUnauthorized();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resetForUnauthorized]);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener("focus", () => load());
    return unsubscribe;
  }, [load, navigation]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
      <Text style={styles.title}>Manage Opportunities</Text>
      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateOpportunity")}><Text style={styles.createText}>Create Opportunity</Text></TouchableOpacity>
      {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={styles.back}>Retry</Text></TouchableOpacity></View> : null}
      {!error && opportunities.length === 0 ? <Text style={styles.empty}>You have not created any opportunities yet.</Text> : null}
      {opportunities.map((opportunity) => <TouchableOpacity key={opportunity.id} style={styles.card} onPress={() => navigation.navigate("FacultyOpportunityDetails", { opportunityId: opportunity.id })}>
        <Text style={styles.cardTitle}>{opportunity.title}</Text>
        <Text style={styles.type}>{typeLabels[opportunity.opportunity_type]}</Text>
        <Text style={styles.status}>{opportunity.status}</Text>
        <Text style={styles.detail}>Deadline: {opportunity.deadline.slice(0, 10)}</Text>
        <Text style={styles.detail}>{opportunity.is_remote ? "Remote" : "On-site"}{opportunity.location ? ` • ${opportunity.location}` : ""}</Text>
      </TouchableOpacity>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }, page: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24, paddingBottom: 48 },
  back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 }, title: { fontSize: 30, fontWeight: "bold", color: "#1E3A8A", marginBottom: 16 },
  createButton: { backgroundColor: "#10B981", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 18 }, createText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorBox: { alignItems: "center", marginVertical: 16 }, error: { color: "#DC2626", textAlign: "center", marginBottom: 10 }, empty: { color: "#666", fontSize: 16, textAlign: "center", marginTop: 24 },
  card: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginBottom: 12 }, cardTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  type: { color: "#2563EB", fontWeight: "600", marginTop: 5 }, status: { color: "#047857", fontWeight: "700", textTransform: "capitalize", marginTop: 6 }, detail: { color: "#4B5563", marginTop: 6 },
});
