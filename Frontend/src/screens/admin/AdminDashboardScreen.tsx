import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import {
  AdminDashboardStatistics,
  getAdminDashboard,
  getAdminDashboardErrorMessage,
  isUnauthorizedAdminDashboardError,
} from "../../services/admin-dashboard.service";

type Stat = { label: string; value: number };

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

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  if (!statistics) {
    return <View style={styles.center}><Text style={styles.error}>{errorMessage || "Unable to load dashboard statistics."}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity></View>;
  }

  const userStats: Stat[] = [
    { label: "Total Users", value: statistics.total_users },
    { label: "Students", value: statistics.students },
    { label: "Graduates", value: statistics.graduates },
    { label: "Faculty", value: statistics.faculty },
    { label: "Recruiters", value: statistics.recruiters },
  ];
  const companyStats: Stat[] = [
    { label: "Total Companies", value: statistics.companies },
    { label: "Pending Companies", value: statistics.pending_companies },
    { label: "Approved Companies", value: statistics.approved_companies },
  ];
  const opportunityStats: Stat[] = [
    { label: "Total Opportunities", value: statistics.opportunities },
    { label: "Published Opportunities", value: statistics.published_opportunities },
  ];
  const integrityStats: Stat[] = [
    { label: "Companies awaiting approval", value: statistics.pending_companies },
    { label: "Published companies", value: statistics.approved_companies },
    { label: "Draft or closed opportunities", value: Math.max(0, statistics.opportunities - statistics.published_opportunities) },
  ];
  const noActivity = userStats.concat(companyStats, opportunityStats, [{ label: "Total Applications", value: statistics.applications }]).every((item) => item.value === 0);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
      <Text style={styles.title}>Dashboard Overview</Text>
      <Text style={styles.subtitle}>Current CampusX platform statistics.</Text>
      {noActivity ? <View style={styles.empty}><Text style={styles.emptyText}>No platform activity has been recorded yet.</Text></View> : null}
      <StatSection title="Users" items={userStats} />
      <StatSection title="Companies" items={companyStats} />
      <StatSection title="Opportunities" items={opportunityStats} />
      <StatSection title="Applications" items={[{ label: "Total Applications", value: statistics.applications }]} />
      <StatSection title="Platform Integrity" items={integrityStats} />
      <TouchableOpacity style={styles.companiesButton} onPress={() => navigation.navigate("AdminCompanies")}><Text style={styles.companiesButtonText}>Manage Companies</Text></TouchableOpacity>
      {errorMessage ? <View style={styles.errorBox}><Text style={styles.error}>{errorMessage}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    </ScrollView>
  );
}

function StatSection({ title, items }: { title: string; items: Stat[] }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.grid}>{items.map((item) => <View key={item.label} style={styles.card}><Text style={styles.cardValue}>{item.value}</Text><Text style={styles.cardLabel}>{item.label}</Text></View>)}</View></View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  page: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 48 },
  back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 },
  title: { color: "#1E3A8A", fontSize: 30, fontWeight: "bold" },
  subtitle: { color: "#666", fontSize: 16, marginTop: 6, marginBottom: 20 },
  empty: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginBottom: 8 },
  emptyText: { color: "#4B5563", textAlign: "center" },
  section: { marginTop: 18 },
  sectionTitle: { color: "#1E3A8A", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", minHeight: 100, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 14, justifyContent: "space-between" },
  cardValue: { color: "#2563EB", fontSize: 28, fontWeight: "bold" },
  cardLabel: { color: "#4B5563", fontWeight: "600", marginTop: 12 },
  companiesButton: { backgroundColor: "#10B981", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 28 },
  companiesButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  errorBox: { alignItems: "center", marginTop: 18 },
  error: { color: "#DC2626", textAlign: "center", lineHeight: 21 },
  retry: { color: "#2563EB", fontWeight: "700", marginTop: 10 },
});
