import { StyleSheet, View } from "react-native";
import { colors } from "../theme/CampusXTheme";

/** Decorative, non-interactive background shared by CampusX public/auth screens. */
export default function CampusXAtmosphere() {
  return <View pointerEvents="none" style={styles.layer}>
    <View style={styles.topGlow} />
    <View style={styles.bottomGlow} />
    <View style={styles.sideGlow} />
  </View>;
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, overflow: "hidden" },
  topGlow: { position: "absolute", width: 350, height: 350, borderRadius: 175, backgroundColor: colors.secondary, opacity: 0.18, top: -205, right: -105 },
  bottomGlow: { position: "absolute", width: 330, height: 330, borderRadius: 165, backgroundColor: colors.primary, opacity: 0.2, bottom: -210, left: -115 },
  sideGlow: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: colors.accent, opacity: 0.12, top: "43%", right: -130 },
});
