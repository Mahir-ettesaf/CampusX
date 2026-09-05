import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { clearAuthSession } from "../../services/authservice";
import { getAdminOpportunity } from "../../services/admin-opportunity.service";
import { closeOpportunity, deleteOpportunity, getOpportunityErrorMessage, isUnauthorizedOpportunityError, Opportunity, OpportunityInput, OpportunityType, publishOpportunity, updateOpportunity } from "../../services/opportunity.service";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";

type Form = { title: string; description: string; opportunity_type: OpportunityType; deadline: string; location: string; is_remote: boolean; eligibility: string };
const types: Array<[OpportunityType, string]> = [["internship", "Internship"], ["job", "Job"], ["ra", "Research Assistant (RA)"], ["ta", "Teaching Assistant (TA)"], ["research", "Research"]];
const formFrom = (item: Opportunity): Form => ({ title: item.title, description: item.description, opportunity_type: item.opportunity_type, deadline: item.deadline.slice(0, 10), location: item.location || "", is_remote: Boolean(item.is_remote), eligibility: item.eligibility || "" });

function validate(form: Form) {
  if (!form.title.trim()) return "Title is required.";
  if (!form.description.trim()) return "Description is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.deadline) || Number.isNaN(new Date(`${form.deadline}T23:59:59`).getTime())) return "Deadline must use YYYY-MM-DD format.";
  return "";
}

export default function AdminOpportunityDetailsScreen() {
  const navigation = useNavigation<any>(); const route = useRoute<any>(); const id = Number(route.params?.opportunityId);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null); const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [saving, setSaving] = useState(false); const [action, setAction] = useState<"publish" | "close" | "delete" | null>(null);
  const endSession = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const handleError = useCallback(async (requestError: unknown) => { setError(getOpportunityErrorMessage(requestError)); if (isUnauthorizedOpportunityError(requestError)) await endSession(); }, [endSession]);
  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(id) || id <= 0) { setError("The opportunity could not be found."); setLoading(false); return; }
    try { refresh ? setRefreshing(true) : setLoading(true); const item = await getAdminOpportunity(id); setOpportunity(item); setForm(formFrom(item)); setError(""); }
    catch (requestError) { await handleError(requestError); }
    finally { setLoading(false); setRefreshing(false); }
  }, [handleError, id]);
  useEffect(() => { void load(); }, [load]);
  const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => current ? { ...current, [key]: value } : current);
  const cancelEdit = () => { if (opportunity) setForm(formFrom(opportunity)); setEditing(false); setError(""); };
  const save = async () => {
    if (!opportunity || !form) return; const message = validate(form); if (message) { setError(message); return; }
    const input: OpportunityInput = { title: form.title.trim(), description: form.description.trim(), opportunity_type: form.opportunity_type, deadline: form.deadline, location: form.location.trim() || null, is_remote: form.is_remote, eligibility: form.eligibility.trim() || null, company_id: opportunity.company_id };
    try { setSaving(true); setError(""); await updateOpportunity(opportunity.id, input); await load(); setEditing(false); Toast.show({ type: "success", text1: "Opportunity updated" }); }
    catch (requestError) { await handleError(requestError); } finally { setSaving(false); }
  };
  const act = async (kind: "publish" | "close" | "delete") => {
    if (!opportunity) return;
    try { setAction(kind); setError(""); if (kind === "publish") await publishOpportunity(opportunity.id); else if (kind === "close") await closeOpportunity(opportunity.id); else { await deleteOpportunity(opportunity.id); Toast.show({ type: "success", text1: "Opportunity deleted" }); navigation.goBack(); return; } await load(); Toast.show({ type: "success", text1: kind === "publish" ? "Opportunity published" : "Opportunity closed" }); }
    catch (requestError) { await handleError(requestError); } finally { setAction(null); }
  };
  const confirm = (kind: "publish" | "close" | "delete") => { const labels = { publish: ["Publish opportunity", "Make this opportunity visible to eligible applicants?", "Publish"], close: ["Close opportunity", "Close this opportunity to new applications?", "Close"], delete: ["Delete opportunity", "This permanently removes the opportunity and cannot be undone.", "Delete"] } as const; const [title, message, button] = labels[kind]; Alert.alert(title, message, [{ text: "Cancel", style: "cancel" }, { text: button, style: "destructive", onPress: () => { void act(kind); } }]); };
  if (loading && !opportunity) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!opportunity) return <View style={styles.center}><Text style={styles.error}>{error || "Opportunity not found."}</Text><TouchableOpacity onPress={() => { void load(); }}><Text style={styles.link}>Retry</Text></TouchableOpacity></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} />} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Back to Opportunities</Text></TouchableOpacity>
    <Text style={styles.title}>{editing ? "Edit Opportunity" : opportunity.title}</Text>
    {editing ? <>
      <Field label="Title" value={form?.title || ""} onChangeText={(value) => update("title", value)} /><Field label="Description" value={form?.description || ""} multiline onChangeText={(value) => update("description", value)} />
      <Text style={styles.label}>Opportunity type</Text><View style={styles.types}>{types.map(([type, label]) => <TouchableOpacity key={type} style={[styles.type, form?.opportunity_type === type && styles.selected]} onPress={() => update("opportunity_type", type)}><Text style={form?.opportunity_type === type ? styles.selectedText : styles.typeText}>{label}</Text></TouchableOpacity>)}</View>
      <Field label="Deadline (YYYY-MM-DD)" value={form?.deadline || ""} onChangeText={(value) => update("deadline", value)} /><Field label="Location (optional)" value={form?.location || ""} onChangeText={(value) => update("location", value)} /><Field label="Eligibility (optional)" value={form?.eligibility || ""} multiline onChangeText={(value) => update("eligibility", value)} />
      <View style={styles.remote}><Text style={styles.label}>Remote opportunity</Text><Switch value={form?.is_remote || false} onValueChange={(value) => update("is_remote", value)} /></View>{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.row}><Button label="Cancel" color="#6B7280" disabled={saving} onPress={cancelEdit} /><Button label="Save Changes" color="#10B981" loading={saving} disabled={saving} onPress={() => { void save(); }} /></View>
    </> : <>
      <Text style={styles.meta}>{opportunity.opportunity_type} · {opportunity.status}</Text><Text style={styles.description}>{opportunity.description}</Text><Detail label="Location" value={opportunity.location || "Not specified"} /><Detail label="Work mode" value={opportunity.is_remote ? "Remote" : "On-site"} /><Detail label="Deadline" value={opportunity.deadline.slice(0, 10)} /><Detail label="Eligibility" value={opportunity.eligibility || "Not specified"} /><Detail label="Company" value={opportunity.company_name || "Not specified"} />
      {error ? <Text style={styles.error}>{error}</Text> : null}{opportunity.status !== "closed" ? <Button label="Edit Opportunity" color="#10B981" disabled={action !== null} onPress={() => { setEditing(true); setError(""); }} /> : null}{opportunity.status === "draft" ? <Button label="Publish Opportunity" color="#2563EB" loading={action === "publish"} disabled={action !== null} onPress={() => confirm("publish")} /> : null}{opportunity.status === "published" ? <Button label="Close Opportunity" color="#D97706" loading={action === "close"} disabled={action !== null} onPress={() => confirm("close")} /> : null}<Button label="Delete Opportunity" color="#DC2626" loading={action === "delete"} disabled={action !== null} onPress={() => confirm("delete")} />
    </>}
  </ScrollView>;
}
function Detail({ label, value }: { label: string; value: string }) { return <Text style={styles.detail}><Text style={styles.detailLabel}>{label}: </Text>{value}</Text>; }
function Field({ label, multiline = false, ...props }: { label: string; value: string; multiline?: boolean; onChangeText: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.multiline]} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} {...props} /></View>; }
function Button({ label, color, loading = false, disabled, onPress }: { label: string; color: string; loading?: boolean; disabled: boolean; onPress: () => void }) { return <TouchableOpacity style={[styles.button, { backgroundColor: color }, disabled && styles.disabled]} disabled={disabled} onPress={onPress}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{label}</Text>}</TouchableOpacity>; }
const styles = StyleSheet.create({ center:{...ui.centered},page:{...ui.screen},content:{...ui.screenContent},link:{color:colors.primary,fontWeight:"700",marginBottom:spacing.md},title:{...typography.screenTitle,marginBottom:spacing.sm},meta:{alignSelf:"flex-start",color:colors.info,backgroundColor:"#103553",paddingHorizontal:spacing.sm,paddingVertical:spacing.xs,borderRadius:radius.pill,fontWeight:"800",marginBottom:spacing.lg,textTransform:"capitalize",overflow:"hidden"},description:{...ui.card,color:colors.textMuted,lineHeight:22,marginBottom:spacing.md},detail:{...ui.card,color:colors.textMuted,marginBottom:spacing.sm,lineHeight:20},detailLabel:{color:colors.text,fontWeight:"800"},error:{color:colors.error,marginTop:spacing.md,textAlign:"center"},field:{marginBottom:spacing.md},label:{color:colors.text,fontWeight:"700",marginBottom:spacing.xs},input:{...ui.input},multiline:{minHeight:100,textAlignVertical:"top"},types:{gap:spacing.sm,marginBottom:spacing.md},type:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,borderRadius:radius.md,padding:spacing.md},selected:{backgroundColor:colors.primary,borderColor:colors.primary},typeText:{color:colors.textMuted},selectedText:{color:colors.onPrimary,fontWeight:"800"},remote:{...ui.card,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:spacing.lg},row:{flexDirection:"row",gap:spacing.sm},button:{flex:1,borderRadius:radius.md,padding:14,alignItems:"center",marginTop:spacing.sm},buttonText:{color:colors.onDark,fontWeight:"700",fontSize:16},disabled:{...ui.disabled} });
