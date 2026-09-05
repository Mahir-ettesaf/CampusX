import { StyleSheet } from "react-native";

export const colors = {
  background: "#071426",
  backgroundElevated: "#0B1C33",
  surface: "#102440",
  surfaceRaised: "#142C4E",
  input: "#0A1B31",
  primary: "#4AA8FF",
  primaryPressed: "#2C8DE9",
  secondary: "#8978FF",
  text: "#F5F9FF",
  textMuted: "#9DB2D0",
  border: "#254362",
  divider: "#1A3553",
  success: "#35D3A6",
  warning: "#F6B64D",
  error: "#FF7180",
  info: "#68B8FF",
  onPrimary: "#061426",
  onDark: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  screenTitle: { fontSize: 30, fontWeight: "700" as const, lineHeight: 38, color: colors.text },
  sectionTitle: { fontSize: 21, fontWeight: "700" as const, lineHeight: 28, color: colors.text },
  cardTitle: { fontSize: 18, fontWeight: "700" as const, lineHeight: 24, color: colors.text },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  caption: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  button: { fontSize: 16, fontWeight: "700" as const, lineHeight: 21 },
  input: { fontSize: 16, color: colors.text },
} as const;

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.text,
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    minHeight: 52,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  outlineButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  textButton: { color: colors.primary, ...typography.button },
  primaryButtonText: { color: colors.onPrimary, ...typography.button },
  secondaryButtonText: { color: colors.onDark, ...typography.button },
  outlineButtonText: { color: colors.primary, ...typography.button },
  disabled: { opacity: 0.55 },
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  progressTrack: { height: 8, overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.divider },
  progressFill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
  emptyState: { alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  errorState: { alignItems: "center", padding: spacing.lg },
});

export const navigationColors = {
  primary: colors.primary,
  background: colors.background,
  card: colors.backgroundElevated,
  text: colors.text,
  border: colors.border,
  notification: colors.error,
};
