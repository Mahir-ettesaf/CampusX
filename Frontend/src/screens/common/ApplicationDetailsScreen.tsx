import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { clearAuthSession } from "../../services/authservice";
import { appError, Application, getApplication, unauthorized, withdraw } from "../../services/application.service";
import { getMyResumes, Resume } from "../../services/resume.service";
import { getOpportunity, Opportunity } from "../../services/opportunity.service";

export default function ApplicationDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const applicationId = Number(route.params?.applicationId);
  const [application, setApplication] = useState<Application | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [loadedApplication, loadedResumes] = await Promise.all([
        getApplication(applicationId),
        getMyResumes(),
      ]);
      setApplication(loadedApplication);
      setResumes(loadedResumes);
      setError("");

      try {
        setOpportunity(await getOpportunity(loadedApplication.opportunity_id));
      } catch {
        // An opportunity may be closed after an application was submitted.
        setOpportunity(null);
      }
    } catch (requestError) {
      setError(appError(requestError));
      if (unauthorized(requestError)) {
        await clearAuthSession();
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      }
    }
  }, [applicationId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const withdrawApplication = async () => {
    setSaving(true);
    try {
      await withdraw(applicationId);
      await load();
      Toast.show({ type: "success", text1: "Application withdrawn" });
    } catch (requestError) {
      setError(appError(requestError));
      Toast.show({ type: "error", text1: "Unable to withdraw", text2: appError(requestError) });
    } finally {
      setSaving(false);
    }
  };

  if (!application) {
    return <View style={styles.center}>{error ? <><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.back}>Retry</Text></TouchableOpacity></> : <ActivityIndicator size="large" color="#2563EB" />}</View>;
  }

  const selectedResume = resumes.find((resume) => resume.id === application.resume_id);
  const canWithdraw = ["submitted", "reviewing"].includes(application.status);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Applications</Text></TouchableOpacity>
      <Text style={styles.title}>{application.opportunity_title}</Text>
      <Text style={styles.status}>{application.status}</Text>
      {opportunity ? <>
        <Text style={styles.label}>Opportunity summary</Text><Text>{opportunity.description}</Text>
        <Text style={styles.label}>Company</Text><Text>{opportunity.company_name || "Not provided"}</Text>
        <Text style={styles.label}>Location</Text><Text>{opportunity.is_remote ? "Remote" : opportunity.location || "Not provided"}</Text>
      </> : null}
      <Text style={styles.label}>Submitted</Text><Text>{application.submitted_at.slice(0, 10)}</Text>
      <Text style={styles.label}>Selected resume</Text><Text>{selectedResume?.title || "No resume selected"}</Text>
      {application.cover_letter ? <><Text style={styles.label}>Cover letter</Text><Text>{application.cover_letter}</Text></> : null}
      {canWithdraw ? <TouchableOpacity style={styles.withdraw} disabled={saving} onPress={() => Alert.alert("Withdraw application?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Withdraw", style: "destructive", onPress: () => void withdrawApplication() }])}><Text style={styles.withdrawText}>{saving ? "Withdrawing…" : "Withdraw Application"}</Text></TouchableOpacity> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  page: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24 },
  back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1E3A8A" },
  status: { color: "#2563EB", fontWeight: "700", textTransform: "capitalize", marginTop: 7 },
  label: { fontWeight: "700", color: "#333", marginTop: 20, marginBottom: 5 },
  withdraw: { marginTop: 32, borderWidth: 1, borderColor: "#DC2626", borderRadius: 10, padding: 14, alignItems: "center" },
  withdrawText: { color: "#DC2626", fontWeight: "700" },
  error: { color: "#DC2626", textAlign: "center", marginBottom: 12 },
});
