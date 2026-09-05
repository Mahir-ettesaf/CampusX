import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";
import { AcademicResource, getAcademicResourceErrorMessage, getMyResources, isUnauthorizedAcademicResourceError } from "../../services/academic-resource.service";

const typeLabels: Record<AcademicResource["resource_type"], string> = { lecture_notes: "Lecture Notes", slides: "Slides", lab_manual: "Lab Manual", previous_questions: "Previous Questions", research_material: "Research Material", other: "Other" };

export default function FacultyResourcesScreen() {
  const navigation = useNavigation<any>();
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const resetForUnauthorized = useCallback(async () => { await clearAuthSession(); navigation.reset({ index: 0, routes: [{ name: "Welcome" }] }); }, [navigation]);
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const session = await getStoredAuthSession();
      if (session?.user.role !== "faculty") { setError("Faculty access is required to manage academic resources."); return; }
      setResources(await getMyResources()); setError("");
    } catch (requestError) {
      setError(getAcademicResourceErrorMessage(requestError));
      if (isUnauthorizedAcademicResourceError(requestError)) await resetForUnauthorized();
    } finally { setLoading(false); setRefreshing(false); }
  }, [resetForUnauthorized]);
  useEffect(() => { void load(); const unsubscribe = navigation.addListener("focus", () => void load()); return unsubscribe; }, [load, navigation]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Academic Resources</Text><Text style={styles.subtitle}>Create, organize, and share course materials with your students.</Text>
    <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateResource")}><Text style={styles.createText}>Create Resource</Text></TouchableOpacity>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.back}>Retry</Text></TouchableOpacity></View> : null}
    {!error && resources.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No resources yet</Text><Text style={styles.emptyText}>Create a draft resource to share course materials when it is ready.</Text></View> : null}
    {resources.map((resource) => <TouchableOpacity key={resource.id} style={styles.card} onPress={() => navigation.navigate("FacultyResourceDetails", { resourceId: resource.id })}><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.type}>{typeLabels[resource.resource_type]}</Text><Text style={styles.detail}>{resource.subject || "No subject"}</Text><Text style={styles.status}>{resource.status}</Text>{resource.description ? <Text style={styles.description} numberOfLines={2}>{resource.description}</Text> : null}{resource.resource_url ? <Text style={styles.url} numberOfLines={1}>External resource available</Text> : null}</TouchableOpacity>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ center:ui.centered,page:ui.screen,content:ui.screenContent,back:{...ui.textButton,marginBottom:spacing.lg},title:typography.screenTitle,subtitle:{...typography.caption,fontSize:16,lineHeight:22,marginTop:spacing.xs,marginBottom:spacing.lg},createButton:{...ui.primaryButton,marginBottom:spacing.lg},createText:ui.primaryButtonText,errorBox:{...ui.errorState,...ui.card,marginVertical:spacing.md},error:{color:colors.error,textAlign:"center",marginBottom:spacing.sm},empty:{...ui.emptyState,...ui.card},emptyTitle:typography.cardTitle,emptyText:typography.caption,card:{...ui.card,marginTop:spacing.md},cardTitle:typography.cardTitle,type:{alignSelf:"flex-start",color:colors.primary,fontWeight:"700",marginTop:spacing.sm,backgroundColor:colors.input,borderRadius:radius.pill,paddingHorizontal:spacing.sm,paddingVertical:spacing.xs},detail:{...typography.caption,marginTop:spacing.sm},status:{alignSelf:"flex-start",color:colors.success,fontWeight:"700",textTransform:"capitalize",marginTop:spacing.sm,backgroundColor:colors.surfaceRaised,borderRadius:radius.pill,paddingHorizontal:spacing.sm,paddingVertical:spacing.xs},description:{...typography.body,color:colors.textMuted,marginTop:spacing.md,lineHeight:21},url:{color:colors.primary,fontWeight:"700",marginTop:spacing.md} });
