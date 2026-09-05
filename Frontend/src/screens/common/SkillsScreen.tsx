import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  addMySkill,
  deleteMySkill,
  getMySkills,
  getSkillErrorMessage,
  PROFICIENCY_LEVELS,
  ProficiencyLevel,
  Skill,
  updateMySkill,
} from "../../services/skill.service";

export default function SkillsScreen() {
  const navigation = useNavigation<any>();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillName, setSkillName] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>("beginner");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingProficiency, setEditingProficiency] = useState<ProficiencyLevel>("beginner");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSkills = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setSkills(await getMySkills());
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getSkillErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleAddSkill = async () => {
    if (!skillName.trim()) {
      const message = "Enter a skill name before adding it.";
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Skill name required", text2: message });
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await addMySkill(skillName, proficiencyLevel);
      setSkillName("");
      setProficiencyLevel("beginner");
      await loadSkills();
      Toast.show({ type: "success", text1: "Skill added", text2: "Your profile skills have been updated." });
    } catch (error) {
      const message = getSkillErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to add skill", text2: message });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (skill: Skill) => {
    setEditingSkill(skill);
    setEditingProficiency(skill.proficiency_level);
  };

  const handleUpdateSkill = async () => {
    if (!editingSkill) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await updateMySkill(editingSkill.skill_id, editingProficiency);
      setEditingSkill(null);
      await loadSkills();
      Toast.show({ type: "success", text1: "Skill updated", text2: "Proficiency level saved." });
    } catch (error) {
      const message = getSkillErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to update skill", text2: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await deleteMySkill(skill.skill_id);
      if (editingSkill?.skill_id === skill.skill_id) {
        setEditingSkill(null);
      }
      await loadSkills();
      Toast.show({ type: "success", text1: "Skill removed", text2: `${skill.name} was removed from your profile.` });
    } catch (error) {
      const message = getSkillErrorMessage(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Unable to remove skill", text2: message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadSkills(true)} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isSaving}>
        <Text style={styles.backText}>Back to Profile</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Skills</Text>
      <Text style={styles.subtitle}>Add and manage the skills shown on your CampusX profile.</Text>

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Skill</Text>
        <TextInput
          placeholder="Skill name"
          style={styles.input}
          value={skillName}
          onChangeText={setSkillName}
          editable={!isSaving}
        />
        <Text style={styles.label}>Proficiency</Text>
        <ProficiencyPicker selected={proficiencyLevel} onSelect={setProficiencyLevel} disabled={isSaving} />
        <TouchableOpacity
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={handleAddSkill}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Add Skill</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Skills</Text>
      {skills.length === 0 ? (
        <Text style={styles.emptyText}>No skills added yet.</Text>
      ) : (
        skills.map((skill) => (
          <View key={skill.skill_id} style={styles.skillCard}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <Text style={styles.proficiency}>{skill.proficiency_level}</Text>

            {editingSkill?.skill_id === skill.skill_id ? (
              <View style={styles.editSection}>
                <ProficiencyPicker selected={editingProficiency} onSelect={setEditingProficiency} disabled={isSaving} />
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.smallPrimaryButton, isSaving && styles.disabledButton]} onPress={handleUpdateSkill} disabled={isSaving}>
                    <Text style={styles.primaryButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingSkill(null)} disabled={isSaving}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editButton} onPress={() => startEditing(skill)} disabled={isSaving}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSkill(skill)} disabled={isSaving}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ProficiencyPicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: ProficiencyLevel;
  onSelect: (level: ProficiencyLevel) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.levelContainer}>
      {PROFICIENCY_LEVELS.map((level) => (
        <TouchableOpacity
          key={level}
          style={[styles.levelButton, selected === level && styles.selectedLevel, disabled && styles.disabledButton]}
          onPress={() => onSelect(level)}
          disabled={disabled}
        >
          <Text style={[styles.levelText, selected === level && styles.selectedLevelText]}>{level}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 48 },
  backButton: { alignSelf: "flex-start", marginBottom: 16 },
  backText: { color: "#2563EB", fontWeight: "600" },
  title: { color: "#1E3A8A", fontSize: 30, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: "#666", fontSize: 16, marginBottom: 22 },
  sectionTitle: { color: "#1E3A8A", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  addSection: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginBottom: 24, paddingBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 14 },
  label: { color: "#333", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  levelContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  levelButton: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  selectedLevel: { backgroundColor: "#2563EB" },
  levelText: { color: "#2563EB", fontWeight: "600", textTransform: "capitalize" },
  selectedLevelText: { color: "#fff" },
  primaryButton: { backgroundColor: "#10B981", padding: 15, borderRadius: 10, alignItems: "center" },
  smallPrimaryButton: { backgroundColor: "#2563EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  disabledButton: { opacity: 0.7 },
  errorText: { color: "#DC2626", textAlign: "center", marginBottom: 14 },
  emptyText: { color: "#666", fontSize: 16 },
  skillCard: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 16, marginBottom: 12 },
  skillName: { color: "#333", fontSize: 18, fontWeight: "700" },
  proficiency: { color: "#2563EB", fontWeight: "600", textTransform: "capitalize", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  editSection: { marginTop: 14 },
  editButton: { borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  editButtonText: { color: "#2563EB", fontWeight: "600" },
  deleteButton: { borderWidth: 1, borderColor: "#DC2626", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  deleteButtonText: { color: "#DC2626", fontWeight: "600" },
  cancelButton: { borderWidth: 1, borderColor: "#666", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  cancelButtonText: { color: "#666", fontWeight: "600" },
});
