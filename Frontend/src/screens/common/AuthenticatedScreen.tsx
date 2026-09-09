import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
import {
  CareerReadiness,
  getCareerReadiness,
  getCareerReadinessErrorMessage,
  isUnauthorizedCareerReadinessError,
} from "../../services/career-readiness.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";
import { CampusXDrawerButton } from "../../components/CampusXDrawer";
import { getProfile } from "../../services/profile.service";
import { getUnreadNotificationCount } from "../../services/notification.service";

const typeLabels: Record<OpportunityRecommendation["opportunity"]["type"], string> = {
  internship: "Internship",
  job: "Job",
  ra: "Research Assistant",
  ta: "Teaching Assistant",
  research: "Research",
};

const isApplicantRole = (role?: string) => role === "student" || role === "graduate";

type DashboardAction = { label: string; route: string; icon: keyof typeof Ionicons.glyphMap };

const applicantActions: DashboardAction[] = [
  { label: "Opportunities", route: "Opportunities", icon: "briefcase-outline" },
  { label: "Skill Match", route: "SkillMatch", icon: "sparkles-outline" },
  { label: "Learning Path", route: "LearningPath", icon: "map-outline" },
  { label: "Teams", route: "Teams", icon: "people-outline" },
];

const roleActions: Record<string, DashboardAction[]> = {
  faculty: [{ label: "Engagement", route: "FacultyEngagement", icon: "pulse-outline" }, { label: "Opportunities", route: "FacultyOpportunities", icon: "briefcase-outline" }, { label: "Applicants", route: "FacultyOpportunities", icon: "people-outline" }, { label: "Resources", route: "FacultyResources", icon: "library-outline" }, { label: "Announce", route: "FacultyAnnouncements", icon: "megaphone-outline" }, { label: "Profile", route: "Profile", icon: "person-outline" }],
  recruiter: [{ label: "Profile", route: "RecruiterProfile", icon: "person-outline" }, { label: "Jobs", route: "RecruiterOpportunities", icon: "briefcase-outline" }, { label: "Applicants", route: "RecruiterOpportunities", icon: "people-outline" }, { label: "Announcements", route: "RecruiterAnnouncements", icon: "megaphone-outline" }],
  admin: [{ label: "Overview", route: "AdminDashboard", icon: "analytics-outline" }, { label: "Companies", route: "AdminCompanies", icon: "business-outline" }, { label: "Users", route: "AdminUsers", icon: "people-outline" }, { label: "Opportunities", route: "AdminOpportunities", icon: "briefcase-outline" }, { label: "Resources", route: "AdminResources", icon: "library-outline" }, { label: "Announce", route: "AdminAnnouncements", icon: "megaphone-outline" }],
};

export default function AuthenticatedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeUser = route.params?.user as User | undefined;
  const [user, setUser] = useState<User | undefined>(routeUser);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(!routeUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [recommendations, setRecommendations] = useState<OpportunityRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [readinessError, setReadinessError] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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

  const loadReadiness = useCallback(async () => {
    if (!isApplicantRole(user?.role)) return;

    setIsLoadingReadiness(true);
    try {
      setReadiness(await getCareerReadiness());
      setReadinessError("");
    } catch (error) {
      if (isUnauthorizedCareerReadinessError(error)) {
        await resetForUnauthorized();
        return;
      }
      setReadinessError(getCareerReadinessErrorMessage(error));
    } finally {
      setIsLoadingReadiness(false);
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
    let active = true;
    if (!user) return;
    void getProfile().then((profile) => {
      if (active) setProfilePicture(profile.user.profile_picture || null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    void loadReadiness();
  }, [loadReadiness]);

  const loadUnreadNotificationCount = useCallback(async () => {
    try {
      setUnreadNotificationCount(await getUnreadNotificationCount());
    } catch {
      // A badge failure must never prevent normal dashboard navigation.
      setUnreadNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    void loadUnreadNotificationCount();
    const unsubscribe = navigation.addListener("focus", () => void loadUnreadNotificationCount());
    return unsubscribe;
  }, [loadUnreadNotificationCount, navigation]);

  const refreshStudentDashboard = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadRecommendations(), loadReadiness()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isCheckingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
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
      style={[ui.screen, styles.scrollView]}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshStudentDashboard()} />}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, user?.role === "graduate" && styles.graduateEyebrow]}>{user?.role === "graduate" ? "GRADUATE RESEARCH & CAREER" : "CAMPUSX DASHBOARD"}</Text>
            <Text style={styles.title}>Welcome back,</Text>
            <Text style={styles.name}>{user?.full_name || "CampusX user"}</Text>
          </View>
          <View style={styles.headerActions}>
            <CampusXDrawerButton />
            <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("Notifications")} disabled={isLoggingOut} accessibilityLabel={unreadNotificationCount > 0 ? `${unreadNotificationCount} unread notifications` : "Notifications"}><Ionicons name="notifications-outline" color={colors.primary} size={20} />{unreadNotificationCount > 0 ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</Text></View> : null}</TouchableOpacity>
            <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate("Profile")} disabled={isLoggingOut} accessibilityLabel="Profile">
              {profilePicture ? <Image source={{ uri: profilePicture }} style={styles.headerAvatarImage} /> : <Text style={styles.headerAvatarText}>{(user?.full_name || "CampusX User").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</Text>}
            </TouchableOpacity>
          </View>
        </View>
        {isApplicantRole(user?.role) ? <Text style={styles.dashboardSubtitle}>{user?.role === "graduate" ? "Advance your research and career goals with confidence." : "Make your next career move with confidence."}</Text> : <><Text style={styles.details}>{user?.email}</Text><Text style={styles.details}>Role: {user?.role}</Text></>}
      </View>

      {isApplicantRole(user?.role) ? <>
        <View style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <View><Text style={styles.eyebrow}>CAREER READINESS</Text><Text style={styles.readinessTitle}>Your current momentum</Text></View>
            <TouchableOpacity onPress={() => navigation.navigate("CareerReadiness")} disabled={isLoggingOut}><Text style={styles.viewAll}>View details</Text></TouchableOpacity>
          </View>
          {isLoadingReadiness ? <ActivityIndicator color={colors.primary} style={styles.readinessLoading} /> : readiness ? <>
            <View style={styles.readinessContent}>
              <ReadinessRing score={readiness.career_readiness.score} />
              <View style={styles.readinessCopy}>
                <Text style={styles.level}>{readiness.career_readiness.level}</Text>
                <Text style={styles.readinessLabel}>Career Readiness</Text>
                {readiness.improvement_areas[0] ? <Text style={styles.improvementHint}>Next focus: {readiness.improvement_areas[0]}</Text> : <Text style={styles.improvementHint}>You have completed the current readiness checks.</Text>}
              </View>
            </View>
          </> : <><Text style={styles.readinessError}>{readinessError || "Career Readiness is currently unavailable."}</Text><TouchableOpacity onPress={() => void loadReadiness()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></>}
        </View>

        <Text style={styles.sectionHeading}>Quick access</Text>
        <DashboardActionGrid items={user?.role === "graduate" ? [...applicantActions, { label: "Thesis", route: "ThesisMilestones", icon: "flask-outline" }, { label: "Resources", route: "AcademicResources", icon: "library-outline" }] : applicantActions} navigation={navigation} disabled={isLoggingOut} />

        <Text style={styles.utilityHeading}>Career & campus tools</Text>
        <View style={styles.utilityRow}>
          <TouchableOpacity style={styles.utilityButton} onPress={() => navigation.navigate("Profile")} disabled={isLoggingOut}><Text style={styles.utilityText}>View Profile</Text></TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} onPress={() => navigation.navigate("Applications")} disabled={isLoggingOut}><Text style={styles.utilityText}>My Applications</Text></TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} onPress={() => navigation.navigate("Recommendations")} disabled={isLoggingOut}><Text style={styles.utilityText}>All Recommendations</Text></TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} onPress={() => navigation.navigate("Planner")} disabled={isLoggingOut}><Text style={styles.utilityText}>Planner</Text></TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} onPress={() => navigation.navigate("AcademicResources")} disabled={isLoggingOut}><Text style={styles.utilityText}>Academic Resources</Text></TouchableOpacity>
          <TouchableOpacity style={styles.utilityButton} onPress={() => navigation.navigate("Announcements")} disabled={isLoggingOut}><Text style={styles.utilityText}>Announcements</Text></TouchableOpacity>
          {user?.role === "graduate" ? <TouchableOpacity style={[styles.utilityButton, styles.thesisButton]} onPress={() => navigation.navigate("ThesisMilestones")} disabled={isLoggingOut}><Text style={styles.thesisEyebrow}>GRADUATE RESEARCH</Text><Text style={styles.thesisTitle}>Thesis Milestones</Text></TouchableOpacity> : null}
        </View>
      </> : null}

      {!isApplicantRole(user?.role) ? <><Text style={styles.sectionHeading}>Command center</Text><DashboardActionGrid items={roleActions[user?.role || ""] || []} navigation={navigation} disabled={isLoggingOut} /><TouchableOpacity style={[ui.outlineButton, styles.browseButton]} onPress={() => navigation.navigate("Opportunities")} disabled={isLoggingOut}><Text style={ui.outlineButtonText}>Browse Opportunities</Text></TouchableOpacity></> : null}

      {isApplicantRole(user?.role) ? (
        <View style={styles.recommendationSection}>
          <View style={styles.recommendationHeader}><View><Text style={styles.recommendationTitle}>Recommended for you</Text><Text style={styles.recommendationSubtitle}>Based on your current skills and opportunities.</Text></View><TouchableOpacity onPress={() => navigation.navigate("Recommendations")} disabled={isLoggingOut}><Text style={styles.viewAll}>View all</Text></TouchableOpacity></View>
          {isLoadingRecommendations ? (
            <ActivityIndicator color={colors.primary} style={styles.recommendationLoading} />
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
        style={[ui.primaryButton, styles.button, isLoggingOut && ui.disabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={ui.primaryButtonText}>Logout</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const activeSegments = Math.round(safeScore);
  const size = 146;
  const center = size / 2;
  const radius = 63;

  return <View style={styles.ring} accessibilityLabel={`Career Readiness score ${score} out of 100`}>
    {Array.from({ length: 100 }, (_, index) => {
      const angle = ((index / 100) * 360 - 90) * (Math.PI / 180);
      const left = center + radius * Math.cos(angle) - 2;
      const top = center + radius * Math.sin(angle) - 2;
      return <View key={index} style={[styles.ringSegment, { left, top }, index < activeSegments ? styles.ringSegmentActive : styles.ringSegmentInactive]} />;
    })}
    <View style={styles.ringCenter}><Text style={styles.score}>{score}</Text><Text style={styles.scoreSuffix}>/100</Text></View>
  </View>;
}

function DashboardActionGrid({ items, navigation, disabled }: { items: DashboardAction[]; navigation: any; disabled: boolean }) {
  return <View style={styles.quickGrid}>{items.map((item) => <TouchableOpacity key={`${item.route}-${item.label}`} style={styles.quickCard} onPress={() => navigation.navigate(item.route)} disabled={disabled} accessibilityLabel={item.label}>
    <View style={styles.quickIcon}><Ionicons name={item.icon} size={21} color={colors.secondary} /></View>
    <Text style={styles.quickTitle}>{item.label}</Text>
  </TouchableOpacity>)}</View>;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    paddingBottom: 48,
  },
  scrollView: {
    flex: 1,
  },
  heroCard: { ...ui.card, width: "100%", marginBottom: spacing.lg, backgroundColor: colors.backgroundElevated },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heroCopy: { flex: 1 },
  notificationButton: { width: 42, height: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised, position: "relative" },
  notificationBadge: { position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.background },
  notificationBadgeText: { color: colors.onPrimary, fontSize: 9, fontWeight: "800" },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.secondary },
  headerAvatarImage: { width: "100%", height: "100%" },
  headerAvatarText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginBottom: spacing.sm },
  graduateEyebrow: { color: colors.secondary },
  title: {
    ...typography.screenTitle,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.cardTitle,
    marginBottom: spacing.xs,
  },
  details: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  dashboardSubtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  readinessCard: { ...ui.card, width: "100%", backgroundColor: colors.surfaceRaised, marginBottom: spacing.xl },
  readinessHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  readinessTitle: { ...typography.cardTitle },
  viewAll: { color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: spacing.sm },
  readinessLoading: { marginVertical: spacing.xl },
  readinessContent: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.lg },
  ring: { width: 146, height: 146, position: "relative", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ringSegment: { position: "absolute", width: 4, height: 4, borderRadius: radius.pill },
  ringSegmentActive: { backgroundColor: colors.primary },
  ringSegmentInactive: { backgroundColor: colors.divider },
  ringCenter: { width: 108, height: 108, borderRadius: 54, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.border },
  score: { color: colors.text, fontSize: 37, fontWeight: "800", lineHeight: 42 },
  scoreSuffix: { color: colors.textMuted, fontSize: 13, fontWeight: "700", marginTop: -1 },
  readinessCopy: { flex: 1, gap: spacing.xs },
  level: { alignSelf: "flex-start", color: colors.success, backgroundColor: "#123A34", fontSize: 12, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, overflow: "hidden" },
  readinessLabel: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: spacing.xs },
  improvementHint: { ...typography.caption, marginTop: spacing.xs, lineHeight: 20 },
  readinessError: { color: colors.error, lineHeight: 20, marginTop: spacing.lg },
  sectionHeading: { ...typography.sectionTitle, width: "100%", marginBottom: spacing.md },
  quickGrid: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickCard: { width: "48%", minHeight: 104, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, justifyContent: "space-between" },
  quickIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft },
  quickEyebrow: { color: colors.secondary, fontSize: 11, letterSpacing: 0.9, fontWeight: "800" },
  quickTitle: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: "700" },
  utilityRow: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  utilityHeading: { ...typography.sectionTitle, width: "100%", fontSize: 19, marginTop: spacing.xl, marginBottom: -spacing.sm },
  utilityButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.backgroundElevated },
  utilityText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  thesisButton: { width: "100%", borderRadius: radius.md, backgroundColor: colors.surfaceRaised, borderColor: colors.secondary, paddingVertical: spacing.md },
  thesisEyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  thesisTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: spacing.xs },
  button: {
    width: "100%",
    marginTop: 36,
  },
  browseButton: { width: "100%", marginTop: spacing.lg },
  recommendationSection: {
    width: "100%",
    marginTop: spacing.xxl,
  },
  recommendationTitle: {
    ...typography.sectionTitle,
  },
  recommendationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.md },
  recommendationSubtitle: { ...typography.caption, marginTop: spacing.xs },
  recommendationLoading: {
    marginVertical: 12,
  },
  recommendationError: {
    alignItems: "center",
    paddingVertical: 8,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
  },
  retryText: {
    color: colors.primary,
    fontWeight: "700",
    marginTop: 10,
  },
  emptyText: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  recommendationCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  recommendationCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  recommendationDetails: {
    color: colors.textMuted,
    marginTop: 6,
  },
  matchText: {
    color: colors.success,
    fontWeight: "700",
    marginTop: 10,
  },
  matchUnavailable: {
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 10,
  },
});
