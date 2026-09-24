/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#DBEAFE",
        },
        ink: "#0F172A",
        surface: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          dark: "#0F172A",
          "dark-card": "#1E293B",
        },
        border: {
          DEFAULT: "#E2E8F0",
          dark: "#334155",
        },
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        popover: "0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.08)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
