import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  clearAuthSession,
  getStoredAuthSession,
  User,
} from "../../services/authservice";
import {
  getRecommendedOpportunities,
  getRecommendationErrorMessage,
  isUnauthorizedRecommendationError,
  OpportunityRecommendation,
} from "../../services/recommendation.service";

const typeLabels: Record<OpportunityRecommendation["opportunity"]["type"], string> = {
  internship: "Internship",
  job: "Job",
  ra: "Research Assistant",
  ta: "Teaching Assistant",
  research: "Research",
};

const isApplicantRole = (role?: string) => role === "student" || role === "graduate";

export default function AuthenticatedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeUser = route.params?.user as User | undefined;
  const [user, setUser] = useState<User | undefined>(routeUser);
  const [isCheckingSession, setIsCheckingSession] = useState(!routeUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [recommendations, setRecommendations] = useState<OpportunityRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const resetForUnauthorized = useCallback(async () => {
    await clearAuthSession();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [navigation]);

  const loadRecommendations = useCallback(async (refresh = false) => {
    if (!isApplicantRole(user?.role)) return;

    if (refresh) setIsRefreshing(true);
    else setIsLoadingRecommendations(true);

    try {
      setRecommendations(await getRecommendedOpportunities());
      setRecommendationError("");
    } catch (error) {
      if (isUnauthorizedRecommendationError(error)) {
        await resetForUnauthorized();
        return;
      }
      setRecommendationError(getRecommendationErrorMessage(error));
    } finally {
      setIsLoadingRecommendations(false);
      setIsRefreshing(false);
    }
  }, [resetForUnauthorized, user?.role]);

  useEffect(() => {
    if (routeUser) {
      return;
    }

    const verifySession = async () => {
      try {
        const session = await getStoredAuthSession();

        if (!session) {
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
          return;
        }

        setUser(session.user);
      } catch {
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      } finally {
        setIsCheckingSession(false);
      }
    };

    verifySession();
  }, [navigation, routeUser]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  if (isCheckingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await clearAuthSession();
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    } catch {
      Toast.show({
        type: "error",
        text1: "Logout failed",
        text2: "Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadRecommendations(true)} />}
    >
      <Text style={styles.title}>Welcome to CampusX</Text>
      <Text style={styles.name}>{user?.full_name || "CampusX user"}</Text>
      <Text style={styles.details}>{user?.email}</Text>
      <Text style={styles.details}>Role: {user?.role}</Text>

      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate("Profile")}
        disabled={isLoggingOut}
      >
        <Text style={styles.profileButtonText}>View Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Notifications")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Notifications</Text></TouchableOpacity>
      {(user?.role === "student" || user?.role === "graduate") && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Applications")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>My Applications</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("CareerReadiness")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Career Readiness</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("SkillMatch")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Skill Match</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Recommendations")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Recommendations</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AcademicResources")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Academic Resources</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Announcements")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Announcements</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Planner")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Planner</Text></TouchableOpacity>}
      {user?.role === "graduate" && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("ThesisMilestones")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Thesis Milestones</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Teams")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Project Teams</Text></TouchableOpacity>}
      {isApplicantRole(user?.role) && <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("LearningPath")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Learning Path</Text></TouchableOpacity>}

      {user?.role === "faculty" && <><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("FacultyEngagement")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Engagement Summary</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("FacultyOpportunities")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Opportunities</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("FacultyOpportunities")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Applications by Opportunity</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("FacultyResources")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Academic Resources</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("FacultyAnnouncements")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Academic Announcements</Text></TouchableOpacity></>}
      {user?.role === "recruiter" && <><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("RecruiterProfile")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Recruiter Profile</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("RecruiterOpportunities")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Jobs & Internships</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("RecruiterOpportunities")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Applications by Opportunity</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("RecruiterAnnouncements")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Announcements</Text></TouchableOpacity></>}
      {user?.role === "admin" && <><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AdminDashboard")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Dashboard Overview</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AdminCompanies")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Companies</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AdminUsers")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Users</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AdminOpportunities")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Opportunities</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AdminResources")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Academic Resources</Text></TouchableOpacity><TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("AdminAnnouncements")} disabled={isLoggingOut}><Text style={styles.profileButtonText}>Manage Announcements</Text></TouchableOpacity></>}

      <TouchableOpacity style={styles.opportunitiesButton} onPress={() => navigation.navigate("Opportunities")} disabled={isLoggingOut}>
        <Text style={styles.profileButtonText}>Browse Opportunities</Text>
      </TouchableOpacity>

      {isApplicantRole(user?.role) ? (
        <View style={styles.recommendationSection}>
          <Text style={styles.recommendationTitle}>Recommended for You</Text>
          {isLoadingRecommendations ? (
            <ActivityIndicator color="#2563EB" style={styles.recommendationLoading} />
          ) : recommendationError ? (
            <View style={styles.recommendationError}>
              <Text style={styles.errorText}>{recommendationError}</Text>
              <TouchableOpacity onPress={() => void loadRecommendations()} disabled={isLoggingOut}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : recommendations.length === 0 ? (
            <Text style={styles.emptyText}>No recommendations yet. Add relevant skills or check back when suitable opportunities become available.</Text>
          ) : recommendations.map((recommendation) => (
            <TouchableOpacity
              key={recommendation.opportunity.id}
              style={styles.recommendationCard}
              onPress={() => navigation.navigate("OpportunityDetails", { opportunityId: recommendation.opportunity.id })}
              disabled={isLoggingOut}
            >
              <Text style={styles.recommendationCardTitle}>{recommendation.opportunity.title}</Text>
              <Text style={styles.recommendationDetails}>
                {typeLabels[recommendation.opportunity.type]}{recommendation.opportunity.location ? ` • ${recommendation.opportunity.location}` : ""}
              </Text>
              <Text style={styles.recommendationDetails}>{recommendation.opportunity.remote ? "Remote" : "On-site"}</Text>
              {recommendation.match.can_calculate && recommendation.match.percentage !== null ? (
                <>
                  <Text style={styles.matchText}>🎯 {recommendation.match.percentage}% Match</Text>
                  <Text style={styles.recommendationDetails}>{recommendation.match.matched_skill_count} of {recommendation.match.total_required_skill_count} skills matched</Text>
                </>
              ) : <Text style={styles.matchUnavailable}>Skill match unavailable</Text>}
              <Text style={styles.recommendationDetails}>Deadline: {recommendation.opportunity.deadline.slice(0, 10)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, isLoggingOut && styles.disabledButton]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Logout</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    paddingBottom: 48,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  details: {
    fontSize: 16,
    color: "#666",
    marginBottom: 6,
  },
  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 36,
  },
  profileButton: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  opportunitiesButton: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#10B981",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  profileButtonText: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  recommendationSection: {
    width: "100%",
    marginTop: 28,
  },
  recommendationTitle: {
    color: "#1E3A8A",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 12,
  },
  recommendationLoading: {
    marginVertical: 12,
  },
  recommendationError: {
    alignItems: "center",
    paddingVertical: 8,
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },
  retryText: {
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 10,
  },
  emptyText: {
    color: "#4B5563",
    lineHeight: 22,
  },
  recommendationCard: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    backgroundColor: "#EFF6FF",
  },
  recommendationCardTitle: {
    color: "#1E3A8A",
    fontSize: 18,
    fontWeight: "700",
  },
  recommendationDetails: {
    color: "#4B5563",
    marginTop: 6,
  },
  matchText: {
    color: "#166534",
    fontWeight: "700",
    marginTop: 10,
  },
  matchUnavailable: {
    color: "#4B5563",
    fontWeight: "600",
    marginTop: 10,
  },
});
