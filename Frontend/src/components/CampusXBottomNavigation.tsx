import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStoredAuthSession, User } from "../services/authservice";
import { colors, radius, spacing } from "../theme/CampusXTheme";

type NavigationRef = {
  isReady: () => boolean;
  navigate: (name: string, params?: object) => void;
};

type BottomItem = {
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const applicantItems: BottomItem[] = [
  { label: "Home", route: "Authenticated", icon: "home-outline" },
  { label: "Explore", route: "Opportunities", icon: "briefcase-outline" },
  { label: "Applications", route: "Applications", icon: "document-text-outline" },
  { label: "Teams", route: "Teams", icon: "people-outline" },
  { label: "Profile", route: "Profile", icon: "person-outline" },
];

const roleItems: Record<string, BottomItem[]> = {
  faculty: [
    { label: "Home", route: "Authenticated", icon: "home-outline" },
    { label: "Opportunities", route: "FacultyOpportunities", icon: "briefcase-outline" },
    { label: "Resources", route: "FacultyResources", icon: "library-outline" },
    { label: "Updates", route: "FacultyAnnouncements", icon: "megaphone-outline" },
    { label: "Profile", route: "Profile", icon: "person-outline" },
  ],
  recruiter: [
    { label: "Home", route: "Authenticated", icon: "home-outline" },
    { label: "Jobs", route: "RecruiterOpportunities", icon: "briefcase-outline" },
    { label: "Updates", route: "RecruiterAnnouncements", icon: "megaphone-outline" },
    { label: "Alerts", route: "Notifications", icon: "notifications-outline" },
    { label: "Profile", route: "RecruiterProfile", icon: "person-outline" },
  ],
  admin: [
    { label: "Home", route: "AdminDashboard", icon: "home-outline" },
    { label: "Users", route: "AdminUsers", icon: "people-outline" },
    { label: "Companies", route: "AdminCompanies", icon: "business-outline" },
    { label: "Opportunities", route: "AdminOpportunities", icon: "briefcase-outline" },
    { label: "Profile", route: "Profile", icon: "person-outline" },
  ],
};

export default function CampusXBottomNavigation({ navigationRef, currentRoute }: { navigationRef: NavigationRef; currentRoute?: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    void getStoredAuthSession().then((session) => {
      if (active) setUser(session?.user || null);
    });
    return () => { active = false; };
  }, [currentRoute]);

  const items = useMemo(() => {
    if (!user) return [];
    return user.role === "student" || user.role === "graduate" ? applicantItems : roleItems[user.role] || [];
  }, [user]);

  if (!currentRoute || !items.some((item) => item.route === currentRoute)) return null;

  return <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
    <View style={styles.bar}>
      {items.map((item) => {
        const isActive = item.route === currentRoute;
        return <TouchableOpacity key={item.route} style={[styles.item, isActive && styles.activeItem]} onPress={() => navigationRef.isReady() && navigationRef.navigate(item.route)} accessibilityLabel={item.label} accessibilityState={{ selected: isActive }}>
          <Ionicons name={item.icon} size={20} color={isActive ? colors.secondary : colors.textMuted} />
          <Text numberOfLines={1} style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
        </TouchableOpacity>;
      })}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  bar: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.xs, elevation: 8, shadowColor: colors.secondary, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  item: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: radius.md, paddingHorizontal: 2 },
  activeItem: { backgroundColor: colors.accentSoft },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  activeLabel: { color: colors.text },
});
