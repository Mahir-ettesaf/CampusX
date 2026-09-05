import Toast from "react-native-toast-message";
import { createNavigationContainerRef, DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/common/SplashScreen";
import WelcomeScreen from "../screens/common/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import AuthenticatedScreen from "../screens/common/AuthenticatedScreen";
import ApplicationsScreen from "../screens/common/ApplicationsScreen";
import ApplicationDetailsScreen from "../screens/common/ApplicationDetailsScreen";
import OpportunitiesScreen from "../screens/common/OpportunitiesScreen";
import OpportunityDetailsScreen from "../screens/common/OpportunityDetailsScreen";
import CertificatesScreen from "../screens/common/CertificatesScreen";
import ProfileScreen from "../screens/common/ProfileScreen";
import ProjectsScreen from "../screens/common/ProjectsScreen";
import PublicationsScreen from "../screens/common/PublicationsScreen";
import ThesisMilestonesScreen from "../screens/graduate/ThesisMilestonesScreen";
import ResumeScreen from "../screens/common/ResumeScreen";
import SkillsScreen from "../screens/common/SkillsScreen";
import FacultyOpportunitiesScreen from "../screens/faculty/FacultyOpportunitiesScreen";
import CreateOpportunityScreen from "../screens/faculty/CreateOpportunityScreen";
import EditOpportunityScreen from "../screens/faculty/EditOpportunityScreen";
import FacultyOpportunityDetailsScreen from "../screens/faculty/FacultyOpportunityDetailsScreen";
import FacultyApplicationsScreen from "../screens/faculty/FacultyApplicationsScreen";
import FacultyEngagementScreen from "../screens/faculty/FacultyEngagementScreen";
import FacultyApplicationDetailsScreen from "../screens/faculty/FacultyApplicationDetailsScreen";
import RecruiterProfileScreen from "../screens/recruiter/RecruiterProfileScreen";
import CreateCompanyScreen from "../screens/recruiter/CreateCompanyScreen";
import SelectCompanyScreen from "../screens/recruiter/SelectCompanyScreen";
import CompanyDetailsScreen from "../screens/recruiter/CompanyDetailsScreen";
import RecruiterOpportunitiesScreen from "../screens/recruiter/RecruiterOpportunitiesScreen";
import CreateRecruiterOpportunityScreen from "../screens/recruiter/CreateRecruiterOpportunityScreen";
import RecruiterOpportunityDetailsScreen from "../screens/recruiter/RecruiterOpportunityDetailsScreen";
import EditRecruiterOpportunityScreen from "../screens/recruiter/EditRecruiterOpportunityScreen";
import RecruiterApplicationsScreen from "../screens/recruiter/RecruiterApplicationsScreen";
import RecruiterApplicationDetailsScreen from "../screens/recruiter/RecruiterApplicationDetailsScreen";
import AdminCompaniesScreen from "../screens/admin/AdminCompaniesScreen";
import AdminCompanyDetailsScreen from "../screens/admin/AdminCompanyDetailsScreen";
import OpportunitySkillsScreen from "../screens/common/OpportunitySkillsScreen";
import CareerReadinessScreen from "../screens/common/CareerReadinessScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import FacultyResourcesScreen from "../screens/faculty/FacultyResourcesScreen";
import CreateResourceScreen from "../screens/faculty/CreateResourceScreen";
import EditResourceScreen from "../screens/faculty/EditResourceScreen";
import FacultyResourceDetailsScreen from "../screens/faculty/FacultyResourceDetailsScreen";
import AcademicResourcesScreen from "../screens/common/AcademicResourcesScreen";
import AcademicResourceDetailsScreen from "../screens/common/AcademicResourceDetailsScreen";
import FacultyAnnouncementsScreen from "../screens/faculty/FacultyAnnouncementsScreen";
import CreateAnnouncementScreen from "../screens/faculty/CreateAnnouncementScreen";
import EditAnnouncementScreen from "../screens/faculty/EditAnnouncementScreen";
import FacultyAnnouncementDetailsScreen from "../screens/faculty/FacultyAnnouncementDetailsScreen";
import AdminAnnouncementsScreen from "../screens/admin/AdminAnnouncementsScreen";
import AdminCreateAnnouncementScreen from "../screens/admin/AdminCreateAnnouncementScreen";
import AdminEditAnnouncementScreen from "../screens/admin/AdminEditAnnouncementScreen";
import AdminAnnouncementDetailsScreen from "../screens/admin/AdminAnnouncementDetailsScreen";
import AnnouncementsScreen from "../screens/common/AnnouncementsScreen";
import StudentAnnouncementDetailsScreen from "../screens/common/StudentAnnouncementDetailsScreen";
import PlannerScreen from "../screens/common/PlannerScreen";
import CreatePlannerItemScreen from "../screens/common/CreatePlannerItemScreen";
import EditPlannerItemScreen from "../screens/common/EditPlannerItemScreen";
import PlannerItemDetailsScreen from "../screens/common/PlannerItemDetailsScreen";
import TeamsScreen from "../screens/common/TeamsScreen";
import CreateTeamScreen from "../screens/common/CreateTeamScreen";
import TeamDetailsScreen from "../screens/common/TeamDetailsScreen";
import CreateTeamTaskScreen from "../screens/common/CreateTeamTaskScreen";
import EditTeamTaskScreen from "../screens/common/EditTeamTaskScreen";
import TeamTaskDetailsScreen from "../screens/common/TeamTaskDetailsScreen";
import NotificationsScreen from "../screens/common/NotificationsScreen";
import NotificationDetailsScreen from "../screens/common/NotificationDetailsScreen";
import LearningPathScreen from "../screens/common/LearningPathScreen";
import AdminResourcesScreen from "../screens/admin/AdminResourcesScreen";
import AdminResourceDetailsScreen from "../screens/admin/AdminResourceDetailsScreen";
import AdminCreateResourceScreen from "../screens/admin/AdminCreateResourceScreen";
import AdminEditResourceScreen from "../screens/admin/AdminEditResourceScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminUserDetailsScreen from "../screens/admin/AdminUserDetailsScreen";
import AdminOpportunitiesScreen from "../screens/admin/AdminOpportunitiesScreen";
import AdminOpportunityDetailsScreen from "../screens/admin/AdminOpportunityDetailsScreen";
import RecruiterAnnouncementsScreen from "../screens/recruiter/RecruiterAnnouncementsScreen";
import RecruiterAnnouncementDetailsScreen from "../screens/recruiter/RecruiterAnnouncementDetailsScreen";
import SkillMatchScreen from "../screens/common/SkillMatchScreen";
import RecommendationsScreen from "../screens/common/RecommendationsScreen";
import { navigationColors } from "../theme/CampusXTheme";
import { CampusXDrawerProvider } from "../components/CampusXDrawer";

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

export default function AppNavigator() {
  return (
    <>
      <NavigationContainer ref={navigationRef} theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, ...navigationColors } }}>
        <CampusXDrawerProvider navigationRef={navigationRef}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Authenticated" component={AuthenticatedScreen} />
          <Stack.Screen name="Applications" component={ApplicationsScreen} />
          <Stack.Screen name="ApplicationDetails" component={ApplicationDetailsScreen} />
          <Stack.Screen name="Opportunities" component={OpportunitiesScreen} />
          <Stack.Screen name="OpportunityDetails" component={OpportunityDetailsScreen} />
          <Stack.Screen name="Certificates" component={CertificatesScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Projects" component={ProjectsScreen} />
          <Stack.Screen name="Publications" component={PublicationsScreen} />
          <Stack.Screen name="ThesisMilestones" component={ThesisMilestonesScreen} />
          <Stack.Screen name="Resumes" component={ResumeScreen} />
          <Stack.Screen name="Skills" component={SkillsScreen} />
          <Stack.Screen name="FacultyOpportunities" component={FacultyOpportunitiesScreen} />
          <Stack.Screen name="CreateOpportunity" component={CreateOpportunityScreen} />
          <Stack.Screen name="EditOpportunity" component={EditOpportunityScreen} />
          <Stack.Screen name="FacultyOpportunityDetails" component={FacultyOpportunityDetailsScreen} />
          <Stack.Screen name="FacultyApplications" component={FacultyApplicationsScreen} />
          <Stack.Screen name="FacultyEngagement" component={FacultyEngagementScreen} />
          <Stack.Screen name="FacultyApplicationDetails" component={FacultyApplicationDetailsScreen} />
          <Stack.Screen name="RecruiterProfile" component={RecruiterProfileScreen} />
          <Stack.Screen name="CreateCompany" component={CreateCompanyScreen} />
          <Stack.Screen name="SelectCompany" component={SelectCompanyScreen} />
          <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
          <Stack.Screen name="RecruiterOpportunities" component={RecruiterOpportunitiesScreen} />
          <Stack.Screen name="CreateRecruiterOpportunity" component={CreateRecruiterOpportunityScreen} />
          <Stack.Screen name="RecruiterOpportunityDetails" component={RecruiterOpportunityDetailsScreen} />
          <Stack.Screen name="EditRecruiterOpportunity" component={EditRecruiterOpportunityScreen} />
          <Stack.Screen name="RecruiterApplications" component={RecruiterApplicationsScreen} />
          <Stack.Screen name="RecruiterApplicationDetails" component={RecruiterApplicationDetailsScreen} />
          <Stack.Screen name="AdminCompanies" component={AdminCompaniesScreen} />
          <Stack.Screen name="AdminCompanyDetails" component={AdminCompanyDetailsScreen} />
          <Stack.Screen name="OpportunitySkills" component={OpportunitySkillsScreen} />
          <Stack.Screen name="CareerReadiness" component={CareerReadinessScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="FacultyResources" component={FacultyResourcesScreen} />
          <Stack.Screen name="CreateResource" component={CreateResourceScreen} />
          <Stack.Screen name="EditResource" component={EditResourceScreen} />
          <Stack.Screen name="FacultyResourceDetails" component={FacultyResourceDetailsScreen} />
          <Stack.Screen name="AcademicResources" component={AcademicResourcesScreen} />
          <Stack.Screen name="AcademicResourceDetails" component={AcademicResourceDetailsScreen} />
          <Stack.Screen name="FacultyAnnouncements" component={FacultyAnnouncementsScreen} />
          <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
          <Stack.Screen name="EditAnnouncement" component={EditAnnouncementScreen} />
          <Stack.Screen name="FacultyAnnouncementDetails" component={FacultyAnnouncementDetailsScreen} />
          <Stack.Screen name="AdminAnnouncements" component={AdminAnnouncementsScreen} />
          <Stack.Screen name="AdminCreateAnnouncement" component={AdminCreateAnnouncementScreen} />
          <Stack.Screen name="AdminEditAnnouncement" component={AdminEditAnnouncementScreen} />
          <Stack.Screen name="AdminAnnouncementDetails" component={AdminAnnouncementDetailsScreen} />
          <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          <Stack.Screen name="AnnouncementDetails" component={StudentAnnouncementDetailsScreen} />
          <Stack.Screen name="Planner" component={PlannerScreen} />
          <Stack.Screen name="CreatePlannerItem" component={CreatePlannerItemScreen} />
          <Stack.Screen name="EditPlannerItem" component={EditPlannerItemScreen} />
          <Stack.Screen name="PlannerItemDetails" component={PlannerItemDetailsScreen} />
          <Stack.Screen name="Teams" component={TeamsScreen} />
          <Stack.Screen name="CreateTeam" component={CreateTeamScreen} />
          <Stack.Screen name="TeamDetails" component={TeamDetailsScreen} />
          <Stack.Screen name="CreateTeamTask" component={CreateTeamTaskScreen} />
          <Stack.Screen name="EditTeamTask" component={EditTeamTaskScreen} />
          <Stack.Screen name="TeamTaskDetails" component={TeamTaskDetailsScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
          <Stack.Screen name="LearningPath" component={LearningPathScreen} />
          <Stack.Screen name="AdminResources" component={AdminResourcesScreen} />
          <Stack.Screen name="AdminResourceDetails" component={AdminResourceDetailsScreen} />
          <Stack.Screen name="AdminCreateResource" component={AdminCreateResourceScreen} />
          <Stack.Screen name="AdminEditResource" component={AdminEditResourceScreen} />
          <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
          <Stack.Screen name="AdminUserDetails" component={AdminUserDetailsScreen} />
          <Stack.Screen name="AdminOpportunities" component={AdminOpportunitiesScreen} />
          <Stack.Screen name="AdminOpportunityDetails" component={AdminOpportunityDetailsScreen} />
          <Stack.Screen name="RecruiterAnnouncements" component={RecruiterAnnouncementsScreen} />
          <Stack.Screen name="RecruiterAnnouncementDetails" component={RecruiterAnnouncementDetailsScreen} />
          <Stack.Screen name="SkillMatch" component={SkillMatchScreen} />
          <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
        </Stack.Navigator>
        </CampusXDrawerProvider>
      </NavigationContainer>

      <Toast />
    </>
  );
}
