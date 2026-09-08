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
  topGlow: { position: "absolute", width: 330, height: 330, borderRadius: 165, backgroundColor: colors.primary, opacity: 0.1, top: -185, right: -90 },
  bottomGlow: { position: "absolute", width: 310, height: 310, borderRadius: 155, backgroundColor: colors.secondary, opacity: 0.11, bottom: -185, left: -105 },
  sideGlow: { position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: colors.accent, opacity: 0.08, top: "43%", right: -115 },
});
