/** @type {import('tailwindcss').Config} */
const { COLORS } = require('./theme/colors');

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: COLORS.primary,
        'primary-dark': COLORS.primaryDark,

        background: COLORS.background,
        card: COLORS.card,
        modal: COLORS.modal,

        'text-primary': COLORS.textPrimary,
        'text-secondary': COLORS.textSecondary,
        'text-muted': COLORS.textMuted,
        'text-light': COLORS.textLight,
        'text-lighter': COLORS.textLighter,

        success: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.error,

        accent: COLORS.accent,
        rating: COLORS.rating,
        sky: COLORS.sky,

        // Gray scale
        gray50: COLORS.gray50,
        gray100: COLORS.gray100,
        gray200: COLORS.gray200,
        gray300: COLORS.gray300,
        gray400: COLORS.gray400,
        gray500: COLORS.gray500,
        gray600: COLORS.gray600,
        gray700: COLORS.gray700,
        gray800: COLORS.gray800,
        gray900: COLORS.gray900,

        // Slate scale
        slate50: COLORS.slate50,
        slate100: COLORS.slate100,
        slate200: COLORS.slate200,
        slate300: COLORS.slate300,
        slate400: COLORS.slate400,
        slate500: COLORS.slate500,
        slate600: COLORS.slate600,
        slate700: COLORS.slate700,
        slate800: COLORS.slate800,

        // ADD THESE 👇 (important for your profile UI)
        slate800: COLORS.slate800,
        slate400: COLORS.slate400,
        white: COLORS.white,
        black: COLORS.black,

        // ✅ ADD THESE
        'error-light': COLORS.errorLight,
        'error-border': COLORS.errorBorder,

        'card-light': COLORS.cardLight,
        'card-soft': COLORS.cardSoft,
      },
    },
  },
  plugins: [],
}

