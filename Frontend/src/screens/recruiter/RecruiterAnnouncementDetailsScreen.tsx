import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { Announcement, getAnnouncement, getAnnouncementErrorMessage, isUnauthorizedAnnouncementError } from "../../services/announcement.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

export default function RecruiterAnnouncementDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const reset = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (!session || session.user.role !== "recruiter") { if (!session) await reset(); else setError("Recruiter access is required."); return; }
      setAnnouncement(await getAnnouncement(Number(route.params?.announcementId)));
      setError("");
    } catch (requestError) { setError(getAnnouncementErrorMessage(requestError)); if (isUnauthorizedAnnouncementError(requestError)) await reset(); }
    finally { setLoading(false); setRefreshing(false); }
  }, [reset, route.params]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={ui.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loading}>Loading announcement…</Text></View>;
  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Announcements</Text></TouchableOpacity>
    {announcement ? <><View style={styles.hero}><Text style={styles.eyebrow}>RECRUITER UPDATE</Text><Text style={styles.title}>{announcement.title}</Text><View style={styles.typeBadge}><Text style={styles.typeText}>{announcement.announcement_type}</Text></View></View><View style={styles.contentCard}><Text style={styles.label}>Announcement</Text><Text style={styles.message}>{announcement.content}</Text></View><View style={styles.metaCard}>{announcement.creator_name ? <Meta label="Posted by" value={announcement.creator_name} /> : null}<Meta label="Published" value={announcement.published_at?.slice(0, 10) || "Recently"} /></View></> : <View style={styles.stateCard}><Text style={styles.error}>{error || "Announcement not found."}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View>}
  </ScrollView>;
}

function Meta({ label, value }: { label: string; value: string }) { return <View style={styles.metaRow}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  content: { ...ui.screenContent }, loading: { ...typography.caption, marginTop: spacing.md }, back: { ...ui.textButton, marginBottom: spacing.lg }, hero: { ...ui.card, marginBottom: spacing.md, borderColor: colors.primary }, eyebrow: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginBottom: spacing.sm }, title: { ...typography.screenTitle, fontSize: 28, lineHeight: 35 }, typeBadge: { ...ui.badge, marginTop: spacing.lg, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border }, typeText: { color: colors.primary, fontSize: 12, fontWeight: "800", textTransform: "capitalize" }, contentCard: { ...ui.card, backgroundColor: colors.backgroundElevated }, label: { color: colors.secondary, fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: spacing.sm }, message: { ...typography.body, lineHeight: 25 }, metaCard: { ...ui.card, marginTop: spacing.md }, metaRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }, metaLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "700" }, metaValue: { color: colors.text, fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" }, stateCard: { ...ui.card, alignItems: "center", marginTop: spacing.lg }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, retry: { ...ui.textButton, marginTop: spacing.md },
});
