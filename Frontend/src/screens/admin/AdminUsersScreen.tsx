import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getStoredAuthSession } from "../../services/authservice";
import { adminUserError, AdminUser, getAdminUsers } from "../../services/admin-user.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const roles = ["", "student", "graduate", "faculty", "recruiter", "admin"];

export default function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (session?.user.role !== "admin") {
        setError("Administrator access is required.");
        return;
      }
      setUsers(await getAdminUsers({ search: search || undefined, role: role || undefined }));
      setError("");
    } catch (requestError) {
      setError(adminUserError(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role, search]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  if (loading) return <View style={ui.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading CampusX accounts…</Text></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchUsers(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()} accessibilityLabel="Back to home"><Ionicons name="arrow-back" size={18} color={colors.primary} /><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <View style={styles.header}><View style={styles.headerIcon}><Ionicons name="people-outline" size={23} color={colors.primary} /></View><View style={styles.headerCopy}><Text style={typography.screenTitle}>Manage Users</Text><Text style={typography.caption}>Review CampusX platform accounts by role.</Text></View></View>

    <View style={styles.searchBox}><Ionicons name="search-outline" size={20} color={colors.textMuted} /><TextInput style={styles.input} value={search} onChangeText={setSearch} placeholder="Search name or email" placeholderTextColor={colors.textMuted} onSubmitEditing={() => void fetchUsers()} returnKeyType="search" /></View>
    <View style={styles.filterHeading}><Text style={styles.filterLabel}>FILTER BY ROLE</Text><TouchableOpacity onPress={() => void fetchUsers()}><Text style={styles.apply}>Apply filters</Text></TouchableOpacity></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>{roles.map((item) => <TouchableOpacity key={item || "all"} style={[styles.choice, role === item && styles.activeChoice]} onPress={() => setRole(item)} accessibilityLabel={`Filter by ${item || "all roles"}`}><Text style={[styles.choiceText, role === item && styles.activeChoiceText]}>{item ? item.charAt(0).toUpperCase() + item.slice(1) : "All"}</Text></TouchableOpacity>)}</ScrollView>

    {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={28} color={colors.error} /><Text style={styles.error}>{error}</Text><TouchableOpacity style={ui.primaryButton} onPress={() => void fetchUsers()}><Text style={ui.primaryButtonText}>Retry</Text></TouchableOpacity></View> : null}
    {!error && users.length === 0 ? <View style={styles.empty}><Ionicons name="people-outline" size={32} color={colors.primary} /><Text style={styles.emptyTitle}>No matching users</Text><Text style={styles.emptyText}>No users are available for the current filter.</Text></View> : null}
    {!error && users.length > 0 ? <View style={styles.listHeader}><Text style={typography.sectionTitle}>Platform accounts</Text><Text style={styles.listCaption}>Select an account to view details.</Text></View> : null}
    {users.map((user) => <TouchableOpacity style={styles.card} key={user.id} onPress={() => navigation.navigate("AdminUserDetails", { userId: user.id })} accessibilityLabel={`View ${user.full_name}`}><View style={styles.cardTop}><View style={[styles.avatar, roleAvatarStyle(user.role)]}><Text style={styles.initials}>{getInitials(user.full_name)}</Text></View><View style={styles.userCopy}><Text style={styles.name}>{user.full_name}</Text><Text style={styles.email} numberOfLines={1}>{user.email}</Text></View><RoleBadge role={user.role} /></View><View style={styles.cardFooter}><Text style={styles.joined}>Joined {user.created_at.slice(0, 10)}</Text><View style={styles.detailAction}><Text style={styles.detailText}>View details</Text><Ionicons name="chevron-forward" size={16} color={colors.primary} /></View></View></TouchableOpacity>)}
  </ScrollView>;
}

function getInitials(name: string) { return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
function roleAvatarStyle(role: string) { return role === "graduate" ? styles.graduateAvatar : role === "faculty" ? styles.facultyAvatar : role === "recruiter" ? styles.recruiterAvatar : role === "admin" ? styles.adminAvatar : styles.studentAvatar; }
function RoleBadge({ role }: { role: string }) { return <View style={[styles.roleBadge, role === "graduate" && styles.graduateBadge, role === "faculty" && styles.facultyBadge, role === "recruiter" && styles.recruiterBadge, role === "admin" && styles.adminBadge]}><Text style={[styles.roleText, role === "graduate" && styles.graduateText, role === "faculty" && styles.facultyText, role === "recruiter" && styles.recruiterText, role === "admin" && styles.adminText]}>{role}</Text></View>; }

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxl }, loadingText: { ...typography.caption, marginTop: spacing.md }, backAction: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xs, minHeight: 38, marginBottom: spacing.md }, back: { color: colors.primary, fontSize: 14, fontWeight: "700" }, header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl }, headerIcon: { width: 46, height: 46, borderRadius: radius.md, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, headerCopy: { flex: 1, gap: spacing.xs }, searchBox: { ...ui.input, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 0, marginBottom: spacing.md }, input: { flex: 1, minHeight: 50, color: colors.text, fontSize: 15 }, filterHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }, filterLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, apply: { color: colors.primary, fontSize: 13, fontWeight: "800" }, roleRow: { gap: spacing.sm, paddingBottom: spacing.xl }, choice: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, activeChoice: { backgroundColor: colors.primary, borderColor: colors.primary }, choiceText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" }, activeChoiceText: { color: colors.onPrimary }, listHeader: { marginBottom: spacing.md }, listCaption: { ...typography.caption, fontSize: 13, marginTop: spacing.xs }, card: { ...ui.card, marginBottom: spacing.md }, cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", borderWidth: 1 }, studentAvatar: { backgroundColor: "#123A57", borderColor: "#28618A" }, graduateAvatar: { backgroundColor: "#302A5A", borderColor: "#5A4DA3" }, facultyAvatar: { backgroundColor: "#153B3B", borderColor: "#28716E" }, recruiterAvatar: { backgroundColor: "#3C3020", borderColor: "#80622D" }, adminAvatar: { backgroundColor: "#40233B", borderColor: "#8A3F76" }, initials: { color: colors.text, fontSize: 15, fontWeight: "800" }, userCopy: { flex: 1, minWidth: 0 }, name: { ...typography.cardTitle, fontSize: 17 }, email: { color: colors.textMuted, fontSize: 13, marginTop: 2 }, roleBadge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5, backgroundColor: "#123A57" }, roleText: { color: colors.info, fontSize: 10, fontWeight: "800", textTransform: "capitalize" }, graduateBadge: { backgroundColor: "#302A5A" }, graduateText: { color: colors.secondary }, facultyBadge: { backgroundColor: "#153B3B" }, facultyText: { color: colors.success }, recruiterBadge: { backgroundColor: "#3C3020" }, recruiterText: { color: colors.warning }, adminBadge: { backgroundColor: "#40233B" }, adminText: { color: "#F09ADB" }, cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.divider, marginTop: spacing.md, paddingTop: spacing.md }, joined: { color: colors.textMuted, fontSize: 12 }, detailAction: { flexDirection: "row", alignItems: "center", gap: 2 }, detailText: { color: colors.primary, fontSize: 12, fontWeight: "800" }, errorBox: { ...ui.card, alignItems: "center", gap: spacing.md, marginTop: spacing.lg }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, empty: { ...ui.emptyState, gap: spacing.sm, marginTop: spacing.lg }, emptyTitle: { ...typography.cardTitle }, emptyText: { ...typography.caption, textAlign: "center" },
});
