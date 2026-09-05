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

const typeLabels: Record<Opportunity["opportunity_type"], string> = {
  internship: "Internship",
  job: "Job",
  ra: "Research Assistant (RA)",
  ta: "Teaching Assistant (TA)",
  research: "Research",
};

const isApplicantRole = (role?: string) => role === "student" || role === "graduate";

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
        ) : <ActivityIndicator size="large" color="#2563EB" />}
      </View>
    );
  }

  const deadlineOpen = new Date(`${opportunity.deadline.slice(0, 10)}T23:59:59`).getTime() >= Date.now();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Opportunities</Text></TouchableOpacity>
      <Text style={styles.title}>{opportunity.title}</Text>
      <Text style={styles.type}>{typeLabels[opportunity.opportunity_type]}</Text>
      <Text style={styles.body}>{opportunity.description}</Text>
      <Info label="Company" value={opportunity.company_name || "Not provided"} />
      <Info label="Location" value={opportunity.location || "Not provided"} />
      <Info label="Work style" value={opportunity.is_remote ? "Remote" : "On-site"} />
      <Info label="Eligibility" value={opportunity.eligibility || "Not provided"} />
      <Info label="Deadline" value={opportunity.deadline.slice(0, 10)} />

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
  loading: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  container: { flex: 1, backgroundColor: "#fff" }, content: { padding: 24 },
  back: { color: "#2563EB", fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1E3A8A" },
  type: { color: "#2563EB", fontWeight: "600", marginTop: 6 },
  body: { color: "#4B5563", fontSize: 16, lineHeight: 23, marginTop: 8 },
  info: { marginTop: 18 }, label: { color: "#333", fontWeight: "700" },
  panel: { marginTop: 28, padding: 18, borderRadius: 10, backgroundColor: "#EFF6FF" },
  panelTitle: { color: "#1E3A8A", fontSize: 18, fontWeight: "700" },
  helper: { color: "#4B5563", marginTop: 8 },
  resumeOption: { padding: 10, borderWidth: 1, borderColor: "#2563EB", marginTop: 8, borderRadius: 8 },
  selectedResume: { padding: 10, backgroundColor: "#BFDBFE", marginTop: 8, borderRadius: 8 },
  resumeText: { color: "#1E3A8A", fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, minHeight: 80, marginTop: 12, textAlignVertical: "top" },
  applyButton: { backgroundColor: "#10B981", padding: 13, borderRadius: 8, alignItems: "center", marginTop: 12 },
  disabledButton: { opacity: 0.55 }, applyText: { color: "#fff", fontWeight: "700" },
  requiredSkillsButton: { borderWidth: 1, borderColor: "#2563EB", padding: 13, borderRadius: 8, alignItems: "center", marginTop: 22 },
  requiredSkillsText: { color: "#2563EB", fontWeight: "700" },
  matchPanel: { marginTop: 18, padding: 18, borderRadius: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0" },
  matchTitle: { color: "#166534", fontSize: 19, fontWeight: "700" }, matchLoading: { marginTop: 14 }, matchPercentage: { color: "#166534", fontSize: 32, fontWeight: "bold", marginTop: 10 },
  matchUnavailable: { color: "#166534", fontWeight: "700", marginTop: 12 }, matchSection: { marginTop: 16 }, matchSectionTitle: { color: "#166534", fontWeight: "700" }, matchSkill: { color: "#166534", marginTop: 7 }, missingSkill: { color: "#4B5563", marginTop: 7 }, retry: { color: "#2563EB", fontWeight: "700", marginTop: 10 },
  error: { color: "#DC2626", marginTop: 10, lineHeight: 20 },
});
