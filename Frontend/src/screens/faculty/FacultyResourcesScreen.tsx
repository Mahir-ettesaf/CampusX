import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAuthSession, getStoredAuthSession } from "../../services/authservice";
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
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to Home</Text></TouchableOpacity>
    <Text style={styles.title}>Academic Resources</Text><Text style={styles.subtitle}>Create and manage your resource metadata and external links.</Text>
    <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateResource")}><Text style={styles.createText}>Create Resource</Text></TouchableOpacity>
    {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.back}>Retry</Text></TouchableOpacity></View> : null}
    {!error && resources.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No resources yet</Text><Text style={styles.emptyText}>Create a draft resource to share course materials when it is ready.</Text></View> : null}
    {resources.map((resource) => <TouchableOpacity key={resource.id} style={styles.card} onPress={() => navigation.navigate("FacultyResourceDetails", { resourceId: resource.id })}><Text style={styles.cardTitle}>{resource.title}</Text><Text style={styles.type}>{typeLabels[resource.resource_type]}</Text><Text style={styles.detail}>{resource.subject || "No subject"}</Text><Text style={styles.status}>{resource.status}</Text>{resource.description ? <Text style={styles.description} numberOfLines={2}>{resource.description}</Text> : null}{resource.resource_url ? <Text style={styles.url} numberOfLines={1}>External resource available</Text> : null}</TouchableOpacity>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ center:{flex:1,justifyContent:"center",alignItems:"center",padding:24},page:{flex:1,backgroundColor:"#fff"},content:{padding:24,paddingBottom:48},back:{color:"#2563EB",fontWeight:"600",marginBottom:16},title:{fontSize:30,fontWeight:"bold",color:"#1E3A8A"},subtitle:{color:"#666",fontSize:16,lineHeight:22,marginTop:6,marginBottom:18},createButton:{backgroundColor:"#10B981",padding:14,borderRadius:10,alignItems:"center",marginBottom:18},createText:{color:"#fff",fontWeight:"700",fontSize:16},errorBox:{alignItems:"center",marginVertical:16},error:{color:"#DC2626",textAlign:"center",marginBottom:10},empty:{borderWidth:1,borderColor:"#E5E7EB",borderRadius:10,padding:18},emptyTitle:{color:"#333",fontSize:18,fontWeight:"700",marginBottom:6},emptyText:{color:"#666",lineHeight:22},card:{borderWidth:1,borderColor:"#E5E7EB",borderRadius:10,padding:16,marginTop:12},cardTitle:{fontSize:18,fontWeight:"700",color:"#333"},type:{color:"#2563EB",fontWeight:"600",marginTop:5},detail:{color:"#4B5563",marginTop:6},status:{color:"#047857",fontWeight:"700",textTransform:"capitalize",marginTop:6},description:{color:"#4B5563",marginTop:8,lineHeight:21},url:{color:"#2563EB",fontWeight:"600",marginTop:8} });
