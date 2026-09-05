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
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{errorMessage || "Unable to load your profile."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProfile()}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, academic_profile, faculty_profile, recruiter_profile } = profileData;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadProfile(true)} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>

      <View style={styles.identitySection}>
        {user.profile_picture ? (
          <Image source={{ uri: user.profile_picture }} style={styles.profilePicture} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.placeholderText}>Profile photo</Text>
          </View>
        )}
        <Text style={styles.name}>{user.full_name}</Text>
        <Text style={styles.details}>{user.email}</Text>
        <Text style={styles.role}>{user.role}</Text>
      </View>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Text style={styles.sectionTitle}>Professional Profile</Text>
      <ProfileInput label="Headline" value={form.headline} onChangeText={(value) => updateField("headline", value)} />
      <ProfileInput label="Bio" value={form.bio} onChangeText={(value) => updateField("bio", value)} multiline />
      <ProfileInput label="Phone" value={form.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" />
      <ProfileInput label="Location" value={form.location} onChangeText={(value) => updateField("location", value)} />
      <ProfileInput label="LinkedIn URL" value={form.linkedin_url} onChangeText={(value) => updateField("linkedin_url", value)} autoCapitalize="none" />
      <ProfileInput label="GitHub username" value={form.github_username} onChangeText={(value) => updateField("github_username", value)} autoCapitalize="none" />
      <ProfileInput label="Portfolio URL" value={form.portfolio_url} onChangeText={(value) => updateField("portfolio_url", value)} autoCapitalize="none" />

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.disabledButton]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skillsButton} onPress={() => navigation.navigate("Skills")} disabled={isSaving}>
        <Text style={styles.skillsButtonText}>Manage Skills</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resumesButton} onPress={() => navigation.navigate("Resumes")} disabled={isSaving}>
        <Text style={styles.resumesButtonText}>Manage Resumes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.certificatesButton} onPress={() => navigation.navigate("Certificates")} disabled={isSaving}>
        <Text style={styles.certificatesButtonText}>Manage Certificates</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.projectsButton} onPress={() => navigation.navigate("Projects")} disabled={isSaving}>
        <Text style={styles.projectsButtonText}>Manage Projects</Text>
      </TouchableOpacity>

      {user.role === "graduate" && (
        <TouchableOpacity style={styles.publicationsButton} onPress={() => navigation.navigate("Publications")} disabled={isSaving}>
          <Text style={styles.publicationsButtonText}>Manage Publications</Text>
        </TouchableOpacity>
      )}

      {(user.role === "student" || user.role === "graduate") && (
        <View style={styles.githubSection}>
          <Text style={styles.sectionTitle}>GitHub Portfolio</Text>
          {profileData.profile?.github_username ? (
            <>
              <TouchableOpacity style={[styles.githubButton, isLoadingGitHub && styles.disabledButton]} onPress={() => void loadGitHubPortfolio()} disabled={isLoadingGitHub}>
                {isLoadingGitHub ? <ActivityIndicator color="#7C3AED" /> : <Text style={styles.githubButtonText}>Load GitHub Portfolio</Text>}
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
        style={[styles.input, multiline && styles.multilineInput]}
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  identitySection: {
    alignItems: "center",
    marginBottom: 24,
  },
  profilePicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  profilePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E6F4FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholderText: {
    color: "#1E3A8A",
    textAlign: "center",
    fontSize: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
  },
  details: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  role: {
    textTransform: "capitalize",
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  multilineInput: {
    minHeight: 96,
  },
  saveButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  skillsButton: {
    borderWidth: 1.5,
    borderColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 28,
  },
  skillsButtonText: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "600",
  },
  resumesButton: {
    borderWidth: 1.5,
    borderColor: "#10B981",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 28,
  },
  resumesButtonText: {
    color: "#047857",
    fontSize: 17,
    fontWeight: "600",
  },
  certificatesButton: {
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 28,
  },
  certificatesButtonText: {
    color: "#6D28D9",
    fontSize: 17,
    fontWeight: "600",
  },
  projectsButton: {
    borderWidth: 1.5,
    borderColor: "#EA580C",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 28,
  },
  projectsButtonText: {
    color: "#C2410C",
    fontSize: 17,
    fontWeight: "600",
  },
  publicationsButton: {
    borderWidth: 1.5,
    borderColor: "#0F766E",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 28,
  },
  publicationsButtonText: {
    color: "#0F766E",
    fontSize: 17,
    fontWeight: "600",
  },
  githubSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 24,
    paddingTop: 22,
  },
  githubButton: {
    borderWidth: 1,
    borderColor: "#7C3AED",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  githubButtonText: {
    color: "#6D28D9",
    fontSize: 16,
    fontWeight: "600",
  },
  githubHint: {
    color: "#4B5563",
    lineHeight: 21,
  },
  githubCard: {
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    padding: 15,
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
    color: "#312E81",
    fontSize: 17,
    fontWeight: "700",
  },
  githubHeading: {
    color: "#312E81",
    fontWeight: "700",
    marginTop: 16,
  },
  githubDetail: {
    color: "#4B5563",
    marginTop: 5,
    lineHeight: 20,
  },
  repositoryRow: {
    borderTopWidth: 1,
    borderTopColor: "#DDD6FE",
    marginTop: 10,
    paddingTop: 10,
  },
  repositoryName: {
    color: "#312E81",
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 14,
  },
  readOnlySection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 22,
  },
  readOnlyRow: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  readOnlyValue: {
    color: "#333",
    fontSize: 16,
    marginTop: 2,
  },
});
