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

        success: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.error,

        accent: COLORS.accent,
        rating: COLORS.rating,

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

