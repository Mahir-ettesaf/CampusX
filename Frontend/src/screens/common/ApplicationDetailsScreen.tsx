import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { clearAuthSession } from "../../services/authservice";
import { appError, Application, getApplication, unauthorized, withdraw } from "../../services/application.service";
import { getMyResumes, Resume } from "../../services/resume.service";
import { getOpportunity, Opportunity } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

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
    return <View style={styles.center}>{error ? <><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={load}><Text style={styles.back}>Retry</Text></TouchableOpacity></> : <><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading application details…</Text></>}</View>;
  }

  const selectedResume = resumes.find((resume) => resume.id === application.resume_id);
  const canWithdraw = ["submitted", "reviewing"].includes(application.status);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Applications</Text></TouchableOpacity>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>APPLICATION TRACKING</Text>
        <Text style={styles.title}>{application.opportunity_title}</Text>
        <Text style={[styles.status, application.status === "accepted" && styles.acceptedStatus, application.status === "rejected" && styles.rejectedStatus, application.status === "shortlisted" && styles.shortlistedStatus]}>{application.status}</Text>
      </View>
      {opportunity ? <>
        <View style={styles.card}><Text style={styles.sectionTitle}>Opportunity overview</Text><Text style={styles.body}>{opportunity.description}</Text><Detail label="Company" value={opportunity.company_name || "Not provided"} /><Detail label="Location" value={opportunity.is_remote ? "Remote" : opportunity.location || "Not provided"} /></View>
      </> : null}
      <View style={styles.card}><Text style={styles.sectionTitle}>Submission details</Text><Detail label="Submitted" value={application.submitted_at.slice(0, 10)} /><Detail label="Selected resume" value={selectedResume?.title || "No resume selected"} /></View>
      {application.cover_letter ? <View style={styles.card}><Text style={styles.sectionTitle}>Cover letter</Text><Text style={styles.body}>{application.cover_letter}</Text></View> : null}
      {canWithdraw ? <TouchableOpacity style={styles.withdraw} disabled={saving} onPress={() => Alert.alert("Withdraw application?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Withdraw", style: "destructive", onPress: () => void withdrawApplication() }])}><Text style={styles.withdrawText}>{saving ? "Withdrawing…" : "Withdraw Application"}</Text></TouchableOpacity> : null}
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={styles.label}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  center: { ...ui.centered },
  page: { ...ui.screen }, content: { ...ui.screenContent },
  back: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md },
  loadingText: { ...typography.caption, marginTop: spacing.md },
  heroCard: { ...ui.card, backgroundColor: colors.backgroundElevated, marginBottom: spacing.md },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.15, marginBottom: spacing.sm },
  title: { ...typography.screenTitle, fontSize: 27, lineHeight: 34 },
  status: { alignSelf: "flex-start", color: colors.info, backgroundColor: "#103553", fontSize: 12, fontWeight: "800", textTransform: "capitalize", marginTop: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, overflow: "hidden" },
  acceptedStatus: { color: colors.success, backgroundColor: "#123A34" },
  rejectedStatus: { color: colors.error, backgroundColor: "#3A2028" },
  shortlistedStatus: { color: colors.secondary, backgroundColor: "#292750" },
  card: { ...ui.card, marginBottom: spacing.md },
  sectionTitle: { ...typography.cardTitle, marginBottom: spacing.xs },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  detailRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.md },
  label: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: spacing.xs },
  detailValue: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  withdraw: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.error, backgroundColor: "#321C2A", borderRadius: radius.md, minHeight: 50, justifyContent: "center", alignItems: "center" },
  withdrawText: { color: colors.error, fontWeight: "800" },
  error: { color: colors.error, textAlign: "center", marginBottom: spacing.md },
});
