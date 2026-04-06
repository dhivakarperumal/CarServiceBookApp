// theme/colors.js

export const COLORS = {
  // Primary colors
  primary: "#0EA5E9",
  primaryDark: "#2563EB",

  // Background colors
  background: "#0B1120",
  card: "#111827",
  modal: "#0f172a",

  // Text colors
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textLight: "#E0F2FE",
  textLighter: "#DBEAFE",

  // Status colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",

  // Accent colors
  accent: "#06B6D4",
  rating: "#FBBF24",
  sky: "#38bdf8",

  // Gray scale
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",

  // Slate scale
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",

  // Black and white
  black: "#000000",
  white: "#FFFFFF",

  // ✅ ADD THESE (opacity variants)
  errorLight: "rgba(239, 68, 68, 0.1)",
  errorBorder: "rgba(239, 68, 68, 0.3)",

  // optional (recommended for reuse)
  cardLight: "rgba(30, 41, 59, 0.5)",   // slate800/50
  cardSoft: "rgba(30, 41, 59, 0.4)",
};

export const GRADIENT = [COLORS.primary, COLORS.primaryDark];

// Opacity helpers
export const withOpacity = (color, opacity) => {
  // Simple rgba conversion
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};