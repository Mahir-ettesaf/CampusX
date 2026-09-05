import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { getMatchErrorMessage, getOpportunityMatch, isUnauthorizedMatchError, OpportunityMatch } from "../../services/opportunity-match.service";
import { getOpportunities, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity } from "../../services/opportunity.service";

const applicant = (role?: string) => role === "student" || role === "graduate";

export default function SkillMatchScreen() {
  const navigation = useNavigation<any>();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selected, setSelected] = useState<OpportunityMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchingId, setMatchingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const resetForUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (!session) return void (await resetForUnauthorized());
      if (!applicant(session.user.role)) {
        setError("Skill Match is available to students and graduates only.");
        return;
      }
      setOpportunities(await getOpportunities());
      setError("");
    } catch (requestError) {
      if (isUnauthorizedOpportunityError(requestError)) return void (await resetForUnauthorized());
      setError(getOpportunityErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resetForUnauthorized]);

  useEffect(() => { void load(); }, [load]);

  const selectOpportunity = async (opportunityId: number) => {
    try {
      setMatchingId(opportunityId);
      setError("");
      setSelected(await getOpportunityMatch(opportunityId));
    } catch (requestError) {
      if (isUnauthorizedMatchError(requestError)) return void (await resetForUnauthorized());
      setError(getMatchErrorMessage(requestError));
    } finally {
      setMatchingId(null);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  const match = selected?.match;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Skill Match</Text>
    <Text style={styles.helper}>Choose a published opportunity to compare its required skills with your profile.</Text>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {selected && match ? <View style={styles.matchCard}>
      <Text style={styles.matchTitle}>{selected.opportunity.title}</Text>
      {match.can_calculate && match.percentage !== null ? <><Text style={styles.score}>{match.percentage}% Match</Text><Text style={styles.helper}>{match.matched_skill_count} of {match.total_required_skills} required skills matched</Text></> : <Text style={styles.helper}>{match.message || "This opportunity has no required skills listed."}</Text>}
      {match.matched_skills.length > 0 ? <><Text style={styles.section}>Matched Skills</Text>{match.matched_skills.map((skill) => <Text key={skill.skill_id} style={styles.matched}>✓ {skill.skill_name}{skill.proficiency_level ? ` — ${skill.proficiency_level}` : ""}</Text>)}</> : null}
      {match.missing_skills.length > 0 ? <><Text style={styles.section}>Skills to Develop</Text>{match.missing_skills.map((skill) => <Text key={skill.skill_id} style={styles.missing}>+ {skill.skill_name}</Text>)}</> : null}
    </View> : null}
    <Text style={styles.section}>Published Opportunities</Text>
    {opportunities.length === 0 ? <Text style={styles.helper}>No published opportunities are available to compare yet.</Text> : opportunities.map((item) => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.helper}>{item.company_name || "CampusX"} · Deadline: {item.deadline.slice(0, 10)}</Text><TouchableOpacity style={styles.button} disabled={matchingId !== null} onPress={() => void selectOpportunity(item.id)}><Text style={styles.buttonText}>{matchingId === item.id ? "Checking…" : "View Skill Match"}</Text></TouchableOpacity></View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }, page: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24, paddingBottom: 48 }, back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 }, title: { color: "#1E3A8A", fontSize: 30, fontWeight: "bold" }, helper: { color: "#4B5563", lineHeight: 21, marginTop: 8 }, errorBox: { marginTop: 16, alignItems: "center" }, error: { color: "#DC2626", textAlign: "center" }, retry: { color: "#2563EB", fontWeight: "700", marginTop: 10 }, matchCard: { marginTop: 20, padding: 16, borderRadius: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" }, matchTitle: { color: "#166534", fontSize: 18, fontWeight: "700" }, score: { color: "#166534", fontSize: 30, fontWeight: "bold", marginTop: 10 }, section: { color: "#1E3A8A", fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 8 }, matched: { color: "#166534", marginTop: 6 }, missing: { color: "#4B5563", marginTop: 6 }, card: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 15, marginBottom: 12 }, cardTitle: { color: "#333", fontSize: 18, fontWeight: "700" }, button: { alignSelf: "flex-start", backgroundColor: "#2563EB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12 }, buttonText: { color: "#fff", fontWeight: "700" } });
