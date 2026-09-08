import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { clearAuthSession, getStoredAuthSession, User } from "../services/authservice";
import { getProfile } from "../services/profile.service";
import { colors, radius, spacing, typography, ui } from "../theme/CampusXTheme";

type NavigationRef = { navigate: (name: string, params?: object) => void; reset: (state: { index: number; routes: Array<{ name: string }> }) => void; getCurrentRoute?: () => { name?: string } | undefined; isReady?: () => boolean };
type DrawerContextValue = { openDrawer: () => void; closeDrawer: () => void };
type DrawerItem = { label: string; route: string; icon: keyof typeof Ionicons.glyphMap };

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

const sharedItems: DrawerItem[] = [
  { label: "Dashboard", route: "Authenticated", icon: "grid-outline" },
];

const applicantItems: DrawerItem[] = [
  { label: "Opportunities", route: "Opportunities", icon: "briefcase-outline" },
  { label: "Skill Match", route: "SkillMatch", icon: "sparkles-outline" },
  { label: "Learning Path", route: "LearningPath", icon: "map-outline" },
  { label: "My Applications", route: "Applications", icon: "document-text-outline" },
  { label: "Resources", route: "AcademicResources", icon: "library-outline" },
  { label: "Announcements", route: "Announcements", icon: "megaphone-outline" },
  { label: "Planner", route: "Planner", icon: "calendar-outline" },
  { label: "Teams", route: "Teams", icon: "people-outline" },
];

const roleItems: Record<string, DrawerItem[]> = {
  graduate: [{ label: "Thesis Milestones", route: "ThesisMilestones", icon: "flask-outline" }],
  faculty: [
    { label: "Engagement Summary", route: "FacultyEngagement", icon: "pulse-outline" },
    { label: "Manage Opportunities", route: "FacultyOpportunities", icon: "briefcase-outline" },
    { label: "Academic Resources", route: "FacultyResources", icon: "library-outline" },
    { label: "Academic Announcements", route: "FacultyAnnouncements", icon: "megaphone-outline" },
  ],
  recruiter: [
    { label: "Recruiter Profile", route: "RecruiterProfile", icon: "person-outline" },
    { label: "Jobs & Internships", route: "RecruiterOpportunities", icon: "briefcase-outline" },
    { label: "Announcements", route: "RecruiterAnnouncements", icon: "megaphone-outline" },
  ],
  admin: [
    { label: "Dashboard Overview", route: "AdminDashboard", icon: "analytics-outline" },
    { label: "Manage Companies", route: "AdminCompanies", icon: "business-outline" },
    { label: "Manage Users", route: "AdminUsers", icon: "people-outline" },
    { label: "Manage Opportunities", route: "AdminOpportunities", icon: "briefcase-outline" },
    { label: "Resources", route: "AdminResources", icon: "library-outline" },
    { label: "Announcements", route: "AdminAnnouncements", icon: "megaphone-outline" },
  ],
};

export function useCampusXDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("useCampusXDrawer must be used within CampusXDrawerProvider");
  return context;
}

export function CampusXDrawerProvider({ children, navigationRef }: { children: ReactNode; navigationRef: NavigationRef }) {
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const translateX = useRef(new Animated.Value(-340)).current;
  const closeDrawer = useCallback(() => setVisible(false), []);
  const openDrawer = useCallback(() => setVisible(true), []);

  useEffect(() => {
    if (!visible) return;
    void getStoredAuthSession().then(async (session) => {
      setUser(session?.user || null);
      if (!session) {
        setProfilePicture(null);
        return;
      }
      try {
        const profile = await getProfile();
        setProfilePicture(profile.user.profile_picture || null);
      } catch {
        setProfilePicture(null);
      }
    });
    translateX.setValue(-340);
    Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [translateX, visible]);

  const navigate = (route: string) => {
    closeDrawer();
    navigationRef.navigate(route);
  };
  const logout = async () => {
    closeDrawer();
    await clearAuthSession();
    navigationRef.reset({ index: 0, routes: [{ name: "Welcome" }] });
  };
  const menuSections = useMemo(() => {
    if (!user) return [];
    if (user.role === "student" || user.role === "graduate") {
      return [{ title: "HOME", items: sharedItems }, { title: "CAREER", items: applicantItems.slice(0, 4) }, { title: "ACADEMIC", items: applicantItems.slice(4, 7) }, { title: "COLLABORATION", items: applicantItems.slice(7) }, ...(user.role === "graduate" ? [{ title: "RESEARCH", items: roleItems.graduate }] : [])];
    }
    return [{ title: "HOME", items: sharedItems }, { title: user.role.toUpperCase(), items: roleItems[user.role] || [] }];
  }, [user]);
  const activeRoute = navigationRef.isReady?.() ? navigationRef.getCurrentRoute?.()?.name : undefined;
  const initials = (user?.full_name || "CampusX User").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>{children}<Modal visible={visible} transparent animationType="fade" onRequestClose={closeDrawer} statusBarTranslucent><View style={styles.overlay}><Pressable style={styles.backdrop} onPress={closeDrawer} accessibilityLabel="Close navigation menu" /><Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}><SafeAreaView style={styles.safeArea}><View style={styles.brandHeader}><View style={styles.brandRow}><View style={styles.logo}><Image source={require("../../assets/icon.png")} style={styles.logoImage} resizeMode="contain" /></View><View><Text style={styles.brand}>CampusX</Text><Text style={styles.brandCaption}>INTEGRATED CAREER & ACADEMIC PLATFORM</Text></View></View><TouchableOpacity onPress={closeDrawer} accessibilityLabel="Close navigation menu"><Ionicons name="close" color={colors.textMuted} size={25} /></TouchableOpacity></View><View style={styles.profileCard}><View style={styles.avatar}>{profilePicture ? <Image source={{ uri: profilePicture }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}</View><View style={styles.profileCopy}><Text style={styles.userName}>{user?.full_name || "CampusX User"}</Text><View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role || "Member"}</Text></View></View></View><ScrollView contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>{menuSections.map((section) => <View key={section.title} style={styles.section}><Text style={styles.sectionTitle}>{section.title}</Text>{section.items.map((item) => <TouchableOpacity key={item.route} style={[styles.menuItem, activeRoute === item.route && styles.activeItem]} onPress={() => navigate(item.route)} accessibilityLabel={item.label}><Ionicons name={item.icon} size={20} color={activeRoute === item.route ? colors.primary : colors.textMuted} /><Text style={[styles.menuText, activeRoute === item.route && styles.activeText]}>{item.label}</Text>{activeRoute === item.route ? <View style={styles.activeDot} /> : null}</TouchableOpacity>)}</View>)}</ScrollView><View style={styles.accountSection}><TouchableOpacity style={styles.menuItem} onPress={() => navigate("Profile")} accessibilityLabel="My Profile"><Ionicons name="person-circle-outline" size={21} color={colors.textMuted} /><Text style={styles.menuText}>My Profile</Text></TouchableOpacity><TouchableOpacity style={styles.menuItem} onPress={() => navigate("Notifications")} accessibilityLabel="Notifications"><Ionicons name="notifications-outline" size={21} color={colors.textMuted} /><Text style={styles.menuText}>Notifications</Text></TouchableOpacity><TouchableOpacity style={styles.logoutButton} onPress={() => void logout()} accessibilityLabel="Log out"><Ionicons name="log-out-outline" size={20} color={colors.error} /><Text style={styles.logoutText}>Logout</Text></TouchableOpacity></View></SafeAreaView></Animated.View></View></Modal></DrawerContext.Provider>;
}

export function CampusXDrawerButton() {
  const { openDrawer } = useCampusXDrawer();
  return <TouchableOpacity style={styles.menuButton} onPress={openDrawer} accessibilityLabel="Open navigation menu"><Ionicons name="menu" color={colors.primary} size={26} /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row", backgroundColor: "rgba(23, 16, 34, 0.7)" }, backdrop: { flex: 1 }, drawer: { width: "86%", maxWidth: 340, height: "100%", backgroundColor: colors.background, borderRightWidth: 1, borderRightColor: colors.border, elevation: 12, shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 6, height: 0 } }, safeArea: { flex: 1 }, brandHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider }, brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, marginRight: spacing.sm }, logo: { width: 38, height: 38, borderRadius: 12, overflow: "hidden", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.primary }, logoImage: { width: "100%", height: "100%" }, brand: { color: colors.text, fontSize: 19, fontWeight: "800" }, brandCaption: { color: colors.textMuted, fontSize: 8, letterSpacing: 0.55, fontWeight: "800", marginTop: 1 }, profileCard: { flexDirection: "row", alignItems: "center", margin: spacing.lg, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, avatar: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", justifyContent: "center", alignItems: "center", backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.primary }, avatarImage: { width: "100%", height: "100%" }, avatarText: { color: colors.primary, fontSize: 16, fontWeight: "800" }, profileCopy: { flex: 1, marginLeft: spacing.md }, userName: { color: colors.text, fontSize: 16, fontWeight: "800" }, roleBadge: { alignSelf: "flex-start", borderRadius: radius.pill, backgroundColor: colors.accentSoft, paddingHorizontal: spacing.sm, paddingVertical: 3, marginTop: spacing.xs }, roleText: { color: colors.secondary, fontSize: 11, fontWeight: "800", textTransform: "capitalize" }, menuContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.md }, section: { marginBottom: spacing.lg }, sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginLeft: spacing.sm, marginBottom: spacing.sm }, menuItem: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: 2 }, activeItem: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, menuText: { color: colors.textMuted, fontSize: 15, fontWeight: "700", flex: 1 }, activeText: { color: colors.text }, activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary }, accountSection: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider }, logoutButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.sm, backgroundColor: "#3B202F", borderWidth: 1, borderColor: "#774055" }, logoutText: { color: colors.error, fontSize: 15, fontWeight: "800" }, menuButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
});
