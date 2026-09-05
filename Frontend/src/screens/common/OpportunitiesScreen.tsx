import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession } from "../../services/authservice";
import { getOpportunities, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity, OpportunityFilters } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

const labels: Record<Opportunity["opportunity_type"], string> = { internship: "Internship", job: "Job", ra: "Research Assistant (RA)", ta: "Teaching Assistant (TA)", research: "Research" };

export default function OpportunitiesScreen() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<OpportunityFilters["opportunity_type"]>();
  const [remote, setRemote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const unauth = useCallback(async () => { await clearAuthSession(); nav.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [nav]);
  const load = useCallback(async (refresh = false) => { refresh ? setRefreshing(true) : setLoading(true); try { setItems(await getOpportunities({ search: search || undefined, location: location || undefined, opportunity_type: type, is_remote: remote || undefined })); setError(""); } catch (caughtError) { setError(getOpportunityErrorMessage(caughtError)); if (isUnauthorizedOpportunityError(caughtError)) await unauth(); } finally { setLoading(false); setRefreshing(false); } }, [search, location, type, remote, unauth]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return <ScrollView style={ui.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} colors={[colors.primary]} />}>
    <TouchableOpacity onPress={() => nav.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Opportunities</Text><Text style={styles.subtitle}>Find campus and career opportunities that fit your next step.</Text>
    <View style={styles.searchPanel}>
      <Text style={styles.searchLabel}>SEARCH OPPORTUNITIES</Text>
      <View style={styles.searchField}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.searchInput} placeholder="Search opportunities" placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} onSubmitEditing={() => void load()} /></View>
      <TextInput style={[ui.input, styles.locationInput]} placeholder="Location" placeholderTextColor={colors.textMuted} value={location} onChangeText={setLocation} onSubmitEditing={() => void load()} />
      <Text style={styles.filterLabel}>FILTER BY TYPE</Text>
      <View style={styles.filterRow}>{(["internship", "job", "ra", "ta", "research"] as const).map((itemType) => <TouchableOpacity key={itemType} style={[styles.pill, type === itemType && styles.selectedPill]} onPress={() => setType(type === itemType ? undefined : itemType)}><Text style={type === itemType ? styles.selectedText : styles.pillText}>{labels[itemType]}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity style={[styles.remote, remote && styles.selectedPill]} onPress={() => setRemote(!remote)}><Text style={remote ? styles.selectedText : styles.pillText}>Remote only</Text></TouchableOpacity>
      <TouchableOpacity style={ui.primaryButton} onPress={() => void load()}><Text style={ui.primaryButtonText}>Apply Filters</Text></TouchableOpacity>
    </View>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
    {!error && items.length === 0 ? <View style={styles.emptyState}><Text style={styles.emptyTitle}>No opportunities found</Text><Text style={styles.empty}>No published opportunities match your current filters.</Text></View> : null}
    {items.map((item) => <TouchableOpacity key={item.id} style={styles.card} onPress={() => nav.navigate("OpportunityDetails", { opportunityId: item.id })}>
      <View style={styles.cardHeader}><View style={styles.cardTitleWrap}><Text style={styles.cardTitle}>{item.title}</Text>{item.company_name ? <Text style={styles.company}>{item.company_name}</Text> : null}</View><View style={styles.typeBadge}><Text style={styles.type}>{labels[item.opportunity_type]}</Text></View></View>
      <View style={styles.metadataRow}><Text style={styles.metadata}>{item.is_remote ? "Remote" : "On-site"}{item.location ? `  •  ${item.location}` : ""}</Text><Text style={styles.published}>Published</Text></View>
      <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
      <View style={styles.cardFooter}><Text style={styles.deadline}>Deadline: {item.deadline.slice(0, 10)}</Text><Text style={styles.viewAction}>View details</Text></View>
    </TouchableOpacity>)}</ScrollView>;
}

const styles = StyleSheet.create({
  loading: { ...ui.centered }, content: { padding: spacing.xl, paddingBottom: 48 }, back: { color: colors.primary, fontWeight: "700", marginBottom: spacing.lg }, title: { ...typography.screenTitle }, subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  searchPanel: { ...ui.card, marginBottom: spacing.xl }, searchLabel: { color: colors.secondary, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: spacing.sm }, searchField: { flexDirection: "row", alignItems: "center", backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md }, searchIcon: { color: colors.primary, fontSize: 23, marginRight: spacing.sm }, searchInput: { ...typography.input, flex: 1, paddingVertical: 14 }, locationInput: { ...typography.input, marginTop: spacing.md }, filterLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", marginTop: spacing.lg, marginBottom: spacing.sm }, filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md }, pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.backgroundElevated }, selectedPill: { backgroundColor: colors.primary, borderColor: colors.primary }, pillText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" }, selectedText: { color: colors.onPrimary, fontSize: 12, fontWeight: "800" }, remote: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.backgroundElevated, marginBottom: spacing.lg },
  errorBox: { ...ui.errorState, ...ui.card, marginBottom: spacing.lg }, error: { color: colors.error, textAlign: "center", lineHeight: 21 }, retry: { color: colors.primary, fontWeight: "800", marginTop: spacing.sm }, emptyState: { ...ui.emptyState, ...ui.card }, emptyTitle: { ...typography.cardTitle, marginBottom: spacing.xs }, empty: { ...typography.caption, textAlign: "center" },
  card: { ...ui.card, marginBottom: spacing.md }, cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }, cardTitleWrap: { flex: 1 }, cardTitle: { ...typography.cardTitle }, company: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }, typeBadge: { ...ui.badge, backgroundColor: colors.backgroundElevated, borderWidth: 1, borderColor: colors.secondary }, type: { color: colors.secondary, fontSize: 11, fontWeight: "800" }, metadataRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginTop: spacing.md }, metadata: { ...typography.caption, flex: 1 }, published: { color: colors.success, fontSize: 12, fontWeight: "800" }, description: { ...typography.caption, marginTop: spacing.md }, cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider }, deadline: { color: colors.warning, fontSize: 12, fontWeight: "700" }, viewAction: { color: colors.primary, fontSize: 13, fontWeight: "800" },
});
