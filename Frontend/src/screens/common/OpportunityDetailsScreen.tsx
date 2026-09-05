import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { apply, appError, getMyApplications, unauthorized } from "../../services/application.service";
import { getMyResumes, Resume } from "../../services/resume.service";
import {
  getOpportunity,
  getOpportunityErrorMessage,
  isUnauthorizedOpportunityError,
  Opportunity,
} from "../../services/opportunity.service";
import { getMatchErrorMessage, getOpportunityMatch, isUnauthorizedMatchError, OpportunityMatch } from "../../services/opportunity-match.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const typeLabels: Record<Opportunity["opportunity_type"], string> = {
  internship: "Internship",
  job: "Job",
  ra: "Research Assistant (RA)",
  ta: "Teaching Assistant (TA)",
  research: "Research",
};

const isApplicantRole = (role?: string) => role === "student" || role === "graduate";
const statusLabel = (status: Opportunity["status"]) => status.charAt(0).toUpperCase() + status.slice(1);

export default function OpportunityDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const opportunityId = Number(route.params?.opportunityId);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [canApply, setCanApply] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [match, setMatch] = useState<OpportunityMatch | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  const resetForUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const loadMatch = useCallback(async () => {
    setMatchLoading(true);
    setMatchError("");
    try {
      setMatch(await getOpportunityMatch(opportunityId));
    } catch (requestError) {
      if (isUnauthorizedMatchError(requestError)) {
        await resetForUnauthorized();
        return;
      }
      setMatchError(getMatchErrorMessage(requestError));
    } finally {
      setMatchLoading(false);
    }
  }, [opportunityId, resetForUnauthorized]);

  const load = useCallback(async () => {
    if (!Number.isInteger(opportunityId) || opportunityId < 1) {
      setError("This opportunity could not be found.");
      return;
    }

    try {
      setError("");
      const loadedOpportunity = await getOpportunity(opportunityId);
      setOpportunity(loadedOpportunity);

      const session = await getStoredAuthSession();
      if (!isApplicantRole(session?.user.role)) {
        setCanApply(false);
        setMatch(null);
        return;
      }

      setCanApply(true);
      void loadMatch();
      const [availableResumes, applications] = await Promise.all([
        getMyResumes(),
        getMyApplications(),
      ]);
      setResumes(availableResumes);
      setAlreadyApplied(applications.some((application) => application.opportunity_id === opportunityId));
    } catch (requestError) {
      if (isUnauthorizedOpportunityError(requestError) || unauthorized(requestError)) {
        await resetForUnauthorized();
        return;
      }
      setError(getOpportunityErrorMessage(requestError) || appError(requestError));
    }
  }, [loadMatch, opportunityId, resetForUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async () => {
    if (selectedResumeId === null) {
      setError("Select a resume before applying.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await apply(opportunityId, selectedResumeId, coverLetter.trim() || null);
      setAlreadyApplied(true);
      Toast.show({ type: "success", text1: "Application submitted" });
    } catch (requestError) {
      if (unauthorized(requestError)) {
        await resetForUnauthorized();
        return;
      }
      setError(appError(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (!opportunity) {
    return (
      <View style={styles.loading}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={load}><Text style={styles.back}>Retry</Text></TouchableOpacity>
          </>
        ) : <ActivityIndicator size="large" color={colors.primary} />}
      </View>
    );
  }

  const deadlineOpen = new Date(`${opportunity.deadline.slice(0, 10)}T23:59:59`).getTime() >= Date.now();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Opportunities</Text></TouchableOpacity>
      <View style={styles.heroCard}>
        <View style={styles.badgeRow}><Text style={styles.type}>{typeLabels[opportunity.opportunity_type]}</Text><Text style={[styles.statusBadge, opportunity.status === "closed" && styles.closedStatus, opportunity.status === "draft" && styles.draftStatus]}>{statusLabel(opportunity.status)}</Text></View>
        <Text style={styles.title}>{opportunity.title}</Text>
        <Text style={styles.companyName}>{opportunity.company_name || "CampusX opportunity"}</Text>
      </View>
      <View style={styles.descriptionCard}><Text style={styles.sectionEyebrow}>OPPORTUNITY OVERVIEW</Text><Text style={styles.body}>{opportunity.description}</Text></View>
      <View style={styles.infoCard}>
        <Text style={styles.infoHeading}>Opportunity details</Text>
        <Info label="Company" value={opportunity.company_name || "Not provided"} />
        <Info label="Location" value={opportunity.location || "Not provided"} />
        <Info label="Work style" value={opportunity.is_remote ? "Remote" : "On-site"} />
        <Info label="Eligibility" value={opportunity.eligibility || "Not provided"} />
        <Info label="Deadline" value={opportunity.deadline.slice(0, 10)} />
      </View>

      {canApply ? <TouchableOpacity style={styles.requiredSkillsButton} onPress={() => navigation.navigate("OpportunitySkills", { opportunityId })}><Text style={styles.requiredSkillsText}>Required Skills</Text></TouchableOpacity> : null}

      {canApply ? <View style={styles.matchPanel}>
        <Text style={styles.matchTitle}>Your Skill Match</Text>
        {matchLoading ? <ActivityIndicator color="#2563EB" style={styles.matchLoading} /> : matchError ? <><Text style={styles.error}>{matchError}</Text><TouchableOpacity onPress={loadMatch}><Text style={styles.retry}>Retry Skill Match</Text></TouchableOpacity></> : match ? !match.match.can_calculate || match.match.percentage === null ? <><Text style={styles.matchUnavailable}>Skill match is not available yet.</Text><Text style={styles.helper}>{match.match.message || "This opportunity has no required skills listed."}</Text></> : <><Text style={styles.matchPercentage}>{match.match.percentage}%</Text><Text style={styles.helper}>{match.match.matched_skill_count} of {match.match.total_required_skills} required skills matched</Text>{match.match.matched_skills.length > 0 ? <View style={styles.matchSection}><Text style={styles.matchSectionTitle}>Matched Skills</Text>{match.match.matched_skills.map((skill) => <Text key={skill.skill_id} style={styles.matchSkill}>✓ {skill.skill_name}{skill.proficiency_level ? ` — ${skill.proficiency_level}` : ""}</Text>)}</View> : null}{match.match.missing_skills.length > 0 ? <View style={styles.matchSection}><Text style={styles.matchSectionTitle}>Skills to Develop</Text>{match.match.missing_skills.map((skill) => <Text key={skill.skill_id} style={styles.missingSkill}>+ {skill.skill_name}</Text>)}</View> : null}</> : null}
      </View> : null}

      {canApply && (alreadyApplied ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Applied</Text>
          <Text style={styles.body}>You have already applied to this opportunity.</Text>
        </View>
      ) : !deadlineOpen ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Applications closed</Text>
          <Text style={styles.body}>The application deadline has passed.</Text>
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Apply Now</Text>
          <Text style={styles.helper}>Select one of your resumes.</Text>
          {resumes.length === 0 ? (
            <Text style={styles.error}>Create a resume in your profile before applying.</Text>
          ) : resumes.map((resume) => (
            <TouchableOpacity
              key={resume.id}
              style={selectedResumeId === resume.id ? styles.selectedResume : styles.resumeOption}
              onPress={() => setSelectedResumeId(resume.id)}
            >
              <Text style={styles.resumeText}>{resume.title}{resume.is_primary ? " (Primary)" : ""}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Cover letter (optional)"
            multiline
            value={coverLetter}
            onChangeText={setCoverLetter}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.applyButton, (saving || resumes.length === 0) && styles.disabledButton]}
            disabled={saving || resumes.length === 0}
            onPress={handleApply}
          >
            <Text style={styles.applyText}>{saving ? "Submitting…" : "Submit Application"}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.body}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  loading: { ...ui.centered },
  container: { ...ui.screen }, content: { ...ui.screenContent },
  back: { color: colors.primary, fontWeight: "700", fontSize: 14, marginBottom: spacing.md },
  heroCard: { ...ui.card, backgroundColor: colors.backgroundElevated, marginBottom: spacing.md },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  type: { alignSelf: "flex-start", color: colors.primary, backgroundColor: "#103553", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: 11, fontWeight: "800" },
  statusBadge: { alignSelf: "flex-start", color: colors.success, backgroundColor: "#123A34", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: 11, fontWeight: "800" },
  closedStatus: { color: colors.warning, backgroundColor: "#3B301A" },
  draftStatus: { color: colors.secondary, backgroundColor: "#292750" },
  title: { ...typography.screenTitle, fontSize: 27, lineHeight: 34 },
  companyName: { color: colors.textMuted, fontSize: 15, fontWeight: "700", marginTop: spacing.sm },
  descriptionCard: { ...ui.card, marginBottom: spacing.md },
  sectionEyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.1, fontWeight: "800", marginBottom: spacing.xs },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: spacing.xs },
  infoCard: { ...ui.card, marginBottom: spacing.md },
  infoHeading: { ...typography.cardTitle, marginBottom: spacing.xs },
  info: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.md, marginTop: spacing.md }, label: { color: colors.text, fontSize: 13, fontWeight: "800" },
  panel: { ...ui.card, marginTop: spacing.xl },
  panelTitle: { ...typography.cardTitle },
  helper: { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
  resumeOption: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, marginTop: spacing.sm, borderRadius: radius.md },
  selectedResume: { padding: spacing.md, backgroundColor: "#103553", borderWidth: 1, borderColor: colors.primary, marginTop: spacing.sm, borderRadius: radius.md },
  resumeText: { color: colors.text, fontWeight: "700" },
  input: { ...ui.input, minHeight: 90, marginTop: spacing.md, textAlignVertical: "top" },
  applyButton: { ...ui.primaryButton, marginTop: spacing.md },
  disabledButton: { ...ui.disabled }, applyText: { ...ui.primaryButtonText },
  requiredSkillsButton: { ...ui.outlineButton, minHeight: 48, marginTop: spacing.md },
  requiredSkillsText: { ...ui.outlineButtonText },
  matchPanel: { ...ui.card, marginTop: spacing.md, borderColor: "#315879", backgroundColor: colors.surfaceRaised },
  matchTitle: { color: colors.primary, fontSize: 19, fontWeight: "800" }, matchLoading: { marginTop: spacing.md }, matchPercentage: { color: colors.primary, fontSize: 34, fontWeight: "800", marginTop: spacing.sm },
  matchUnavailable: { color: colors.text, fontWeight: "800", marginTop: spacing.md }, matchSection: { marginTop: spacing.lg }, matchSectionTitle: { color: colors.text, fontWeight: "800" }, matchSkill: { color: colors.success, marginTop: spacing.sm }, missingSkill: { color: colors.warning, marginTop: spacing.sm }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm },
  error: { color: colors.error, marginTop: spacing.sm, lineHeight: 20, textAlign: "center" },
});
