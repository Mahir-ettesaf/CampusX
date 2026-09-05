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
import { colors, radius, spacing, typography, ui } from "../../theme/CampusXTheme";
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadSkills(true)} tintColor={colors.primary} />}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isSaving}>
        <Text style={styles.backText}>Back to Profile</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Skills</Text>
      <Text style={styles.subtitle}>Shape a clearer picture of the skills powering your career journey.</Text>

      {!!errorMessage && <View style={styles.errorBox}><Text style={styles.errorText}>{errorMessage}</Text><TouchableOpacity onPress={() => loadSkills()} disabled={isSaving}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View>}

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
        <View style={styles.emptyState}><Text style={styles.emptyTitle}>No skills added yet</Text><Text style={styles.emptyText}>Add skills to strengthen your profile and recommendations.</Text></View>
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
  loadingContainer: ui.centered, container: ui.screen, content: ui.screenContent, backButton: { alignSelf: "flex-start", marginBottom: spacing.lg }, backText: ui.textButton,
  title: typography.screenTitle, subtitle: { ...typography.caption, fontSize: 16, marginTop: spacing.xs, marginBottom: spacing.xl }, sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.md },
  addSection: { ...ui.card, marginBottom: spacing.xl }, input: { ...ui.input, marginBottom: spacing.md }, label: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: spacing.sm },
  levelContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }, levelButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.input }, selectedLevel: { backgroundColor: colors.secondary, borderColor: colors.secondary }, levelText: { color: colors.textMuted, fontWeight: "700", textTransform: "capitalize" }, selectedLevelText: { color: colors.onDark },
  primaryButton: ui.primaryButton, smallPrimaryButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 }, primaryButtonText: ui.primaryButtonText, disabledButton: ui.disabled,
  errorBox: { ...ui.errorState, ...ui.card, marginBottom: spacing.lg }, errorText: { color: colors.error, textAlign: "center", marginBottom: spacing.sm }, retryText: ui.textButton,
  emptyState: { ...ui.emptyState, ...ui.card }, emptyTitle: typography.cardTitle, emptyText: typography.caption, skillCard: { ...ui.card, marginBottom: spacing.md }, skillName: typography.cardTitle, proficiency: { alignSelf: "flex-start", color: colors.primary, fontWeight: "700", textTransform: "capitalize", marginTop: spacing.sm, backgroundColor: colors.input, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg }, editSection: { marginTop: spacing.lg }, editButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 }, editButtonText: { color: colors.primary, fontWeight: "700" }, deleteButton: { borderWidth: 1, borderColor: colors.error, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 }, deleteButtonText: { color: colors.error, fontWeight: "700" }, cancelButton: { borderWidth: 1, borderColor: colors.textMuted, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 }, cancelButtonText: { color: colors.textMuted, fontWeight: "700" },
});
