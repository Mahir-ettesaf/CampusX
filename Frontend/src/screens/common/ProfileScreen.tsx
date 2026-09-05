import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  CommonProfileInput,
  getGitHubPortfolio,
  getProfile,
  getProfileErrorMessage,
  GitHubPortfolio,
  ProfileResponse,
  updateProfile,
} from "../../services/profile.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const emptyProfileForm: CommonProfileInput = {
  headline: "",
  bio: "",
  phone: "",
  location: "",
  linkedin_url: "",
  github_username: "",
  portfolio_url: "",
};

const displayValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "Not provided" : String(value);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<CommonProfileInput>(emptyProfileForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [githubPortfolio, setGithubPortfolio] = useState<GitHubPortfolio | null>(null);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await getProfile();
      setProfileData(response);
      setForm({
        headline: response.profile?.headline || "",
        bio: response.profile?.bio || "",
        phone: response.profile?.phone || "",
        location: response.profile?.location || "",
        linkedin_url: response.profile?.linkedin_url || "",
        github_username: response.profile?.github_username || "",
        portfolio_url: response.profile?.portfolio_url || "",
      });
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getProfileErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateField = (field: keyof CommonProfileInput, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage("");

    try {
      await updateProfile(form);
      await loadProfile();
      Toast.show({
        type: "success",
        text1: "Profile saved",
        text2: "Your profile information has been updated.",
      });
    } catch (error) {
      const message = getProfileErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to save profile", text2: message });
    } finally {
      setIsSaving(false);
    }
  };

  const loadGitHubPortfolio = async () => {
    setIsLoadingGitHub(true);
    setGithubError("");
    try {
      setGithubPortfolio(await getGitHubPortfolio());
    } catch (error) {
      setGithubPortfolio(null);
      setGithubError(getProfileErrorMessage(error));
    } finally {
      setIsLoadingGitHub(false);
    }
  };

  if (isLoading && !profileData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{errorMessage || "Unable to load your profile."}</Text>
        <TouchableOpacity style={[ui.primaryButton, styles.retryButton]} onPress={() => loadProfile()}>
          <Text style={ui.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, academic_profile, faculty_profile, recruiter_profile } = profileData;
  const profileValues = Object.values(form);
  const profileCompletion = Math.round((profileValues.filter((value) => value.trim().length > 0).length / profileValues.length) * 100);

  return (
    <ScrollView
      style={[ui.screen, styles.container]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadProfile(true)} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>

      <View style={styles.identitySection}>
        <View style={styles.avatarWrap}>
          {user.profile_picture ? (
            <Image source={{ uri: user.profile_picture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.placeholderText}>{user.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarAffordance}><Text style={styles.avatarAffordanceText}>Profile</Text></View>
        </View>
        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.details}>{user.email}</Text>
        <View style={styles.roleBadge}><Text style={styles.role}>{user.role}</Text></View>
        {academic_profile ? <Text style={styles.academicSummary}>{[academic_profile.program, academic_profile.department].filter(Boolean).join(" · ")}</Text> : null}
      </View>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <View style={styles.completionCard}>
        <View style={styles.completionHeader}><View><Text style={styles.cardEyebrow}>PROFILE COMPLETION</Text><Text style={styles.completionTitle}>Keep your professional profile current</Text></View><Text style={styles.completionPercent}>{profileCompletion}%</Text></View>
        <View style={ui.progressTrack}><View style={[ui.progressFill, { width: `${profileCompletion}%` }]} /></View>
      </View>

      <Text style={styles.sectionTitle}>Professional profile</Text>
      <View style={styles.formCard}>
        <ProfileInput label="Headline" value={form.headline} onChangeText={(value) => updateField("headline", value)} />
        <ProfileInput label="Bio" value={form.bio} onChangeText={(value) => updateField("bio", value)} multiline />
        <ProfileInput label="Phone" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" />
        <ProfileInput label="Location" value={form.location} onChangeText={(value) => updateField("location", value)} />
        <ProfileInput label="LinkedIn URL" value={form.linkedin_url} onChangeText={(value) => updateField("linkedin_url", value)} autoCapitalize="none" />
        <ProfileInput label="GitHub username" value={form.github_username} onChangeText={(value) => updateField("github_username", value)} autoCapitalize="none" />
        <ProfileInput label="Portfolio URL" value={form.portfolio_url} onChangeText={(value) => updateField("portfolio_url", value)} autoCapitalize="none" />
      </View>

      <TouchableOpacity
        style={[ui.primaryButton, styles.saveButton, isSaving && ui.disabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Save Profile</Text>}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Skills & portfolio</Text>
      <View style={styles.portfolioGrid}>
        <TouchableOpacity style={styles.portfolioCard} onPress={() => navigation.navigate("Skills")} disabled={isSaving}><Text style={styles.portfolioEyebrow}>PROFILE</Text><Text style={styles.portfolioTitle}>Manage Skills</Text></TouchableOpacity>
        <TouchableOpacity style={styles.portfolioCard} onPress={() => navigation.navigate("Resumes")} disabled={isSaving}><Text style={styles.portfolioEyebrow}>CAREER</Text><Text style={styles.portfolioTitle}>Manage Resumes</Text></TouchableOpacity>
        <TouchableOpacity style={styles.portfolioCard} onPress={() => navigation.navigate("Certificates")} disabled={isSaving}><Text style={styles.portfolioEyebrow}>CREDENTIALS</Text><Text style={styles.portfolioTitle}>Certificates</Text></TouchableOpacity>
        <TouchableOpacity style={styles.portfolioCard} onPress={() => navigation.navigate("Projects")} disabled={isSaving}><Text style={styles.portfolioEyebrow}>SHOWCASE</Text><Text style={styles.portfolioTitle}>Projects</Text></TouchableOpacity>
        {user.role === "graduate" ? <TouchableOpacity style={styles.portfolioCard} onPress={() => navigation.navigate("Publications")} disabled={isSaving}><Text style={styles.portfolioEyebrow}>RESEARCH</Text><Text style={styles.portfolioTitle}>Publications</Text></TouchableOpacity> : null}
      </View>

      {(user.role === "student" || user.role === "graduate") && (
        <View style={styles.githubSection}>
          <Text style={styles.sectionTitle}>GitHub Portfolio</Text>
          {profileData.profile?.github_username ? (
            <>
              <TouchableOpacity style={[styles.githubButton, isLoadingGitHub && ui.disabled]} onPress={() => void loadGitHubPortfolio()} disabled={isLoadingGitHub}>
                {isLoadingGitHub ? <ActivityIndicator color={colors.secondary} /> : <Text style={styles.githubButtonText}>Load GitHub Portfolio</Text>}
              </TouchableOpacity>
              {githubError ? <Text style={styles.errorText}>{githubError}</Text> : null}
              {githubPortfolio ? <View style={styles.githubCard}>
                <View style={styles.githubProfileRow}>{githubPortfolio.profile.avatar_url ? <Image source={{ uri: githubPortfolio.profile.avatar_url }} style={styles.githubAvatar} /> : null}<View style={styles.githubProfileText}><Text style={styles.githubName}>{githubPortfolio.profile.name || githubPortfolio.profile.login}</Text><Text style={styles.githubDetail}>@{githubPortfolio.profile.login} · {githubPortfolio.profile.public_repos} public repositories</Text>{githubPortfolio.profile.bio ? <Text style={styles.githubDetail}>{githubPortfolio.profile.bio}</Text> : null}</View></View>
                <Text style={styles.githubHeading}>Languages</Text>
                <Text style={styles.githubDetail}>{githubPortfolio.languages.length ? githubPortfolio.languages.map((language) => language.name).join(", ") : "No languages reported by public repositories."}</Text>
                <Text style={styles.githubHeading}>Recent repositories</Text>
                {githubPortfolio.repositories.length ? githubPortfolio.repositories.map((repository) => <View key={repository.id} style={styles.repositoryRow}><Text style={styles.repositoryName}>{repository.name}</Text><Text style={styles.githubDetail}>{repository.language || "No primary language"}{repository.description ? ` · ${repository.description}` : ""}</Text></View>) : <Text style={styles.githubDetail}>No public repositories found.</Text>}
              </View> : null}
            </>
          ) : <Text style={styles.githubHint}>Save a GitHub username above to load your public repositories and languages.</Text>}
        </View>
      )}

      {academic_profile && (
        <ReadOnlySection
          title="Academic Information"
          items={[
            ["Student ID", academic_profile.student_id],
            ["Department", academic_profile.department],
            ["Program", academic_profile.program],
            ["Degree level", academic_profile.degree_level],
            ["Graduation year", academic_profile.graduation_year],
            ["CGPA", academic_profile.cgpa],
            ["Interests", academic_profile.interests],
          ]}
        />
      )}

      {faculty_profile && (
        <ReadOnlySection
          title="Faculty Information"
          items={[
            ["Department", faculty_profile.department],
            ["Designation", faculty_profile.designation],
            ["Research areas", faculty_profile.research_areas],
            ["Office location", faculty_profile.office_location],
            ["Contact details", faculty_profile.contact_details],
          ]}
        />
      )}

      {recruiter_profile && (
        <ReadOnlySection
          title="Recruiter Information"
          items={[
            ["Job title", recruiter_profile.job_title],
            ["Company", recruiter_profile.company_name],
            ["Company location", recruiter_profile.company_location],
            ["Company website", recruiter_profile.company_website],
            ["Company approval", recruiter_profile.company_approval_status],
          ]}
        />
      )}
    </ScrollView>
  );
}

function ProfileInput({
  label,
  multiline = false,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  autoCapitalize?: "none";
  keyboardType?: "phone-pad";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[ui.input, styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
    </View>
  );
}

function ReadOnlySection({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string | number | null | undefined]>;
}) {
  return (
    <View style={styles.readOnlySection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map(([label, value]) => (
        <View key={label} style={styles.readOnlyRow}>
          <Text style={styles.readOnlyLabel}>{label}</Text>
          <Text style={styles.readOnlyValue}>{displayValue(value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...ui.centered,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.primary,
    fontWeight: "700",
  },
  identitySection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarWrap: { position: "relative", marginBottom: spacing.md },
  profilePicture: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profilePlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: colors.primary,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
  },
  avatarAffordance: { position: "absolute", right: -8, bottom: -4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.background },
  avatarAffordanceText: { color: colors.onDark, fontSize: 10, fontWeight: "800" },
  name: {
    ...typography.screenTitle,
    fontSize: 27,
    textAlign: "center",
  },
  details: {
    ...typography.caption,
    marginTop: 4,
  },
  roleBadge: { marginTop: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  role: {
    textTransform: "capitalize",
    color: colors.primary,
    fontWeight: "700",
  },
  academicSummary: { ...typography.caption, textAlign: "center", marginTop: spacing.sm },
  sectionTitle: {
    ...typography.sectionTitle,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  completionCard: { ...ui.card, backgroundColor: colors.surfaceRaised },
  completionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.md },
  cardEyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  completionTitle: { ...typography.cardTitle, marginTop: spacing.xs },
  completionPercent: { color: colors.primary, fontSize: 24, fontWeight: "800" },
  formCard: { ...ui.card },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.input,
  },
  multilineInput: {
    minHeight: 96,
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  portfolioGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  portfolioCard: { width: "48%", minHeight: 104, justifyContent: "space-between", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg },
  portfolioEyebrow: { color: colors.secondary, fontSize: 10, fontWeight: "800", letterSpacing: 0.9 },
  portfolioTitle: { ...typography.cardTitle, fontSize: 16 },
  githubSection: {
    marginTop: 24,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  githubButton: {
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  githubButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  githubHint: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  githubCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: 14,
  },
  githubProfileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  githubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  githubProfileText: {
    flex: 1,
  },
  githubName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  githubHeading: {
    color: colors.text,
    fontWeight: "700",
    marginTop: 16,
  },
  githubDetail: {
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 20,
  },
  repositoryRow: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 10,
    paddingTop: 10,
  },
  repositoryName: {
    color: colors.text,
    fontWeight: "700",
  },
  retryButton: {
    marginTop: 12,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginBottom: 14,
  },
  readOnlySection: {
    ...ui.card,
    marginTop: spacing.xl,
  },
  readOnlyRow: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  readOnlyValue: {
    color: colors.text,
    fontSize: 16,
    marginTop: 2,
  },
});
