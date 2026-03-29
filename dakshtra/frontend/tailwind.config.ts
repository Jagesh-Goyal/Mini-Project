import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#0EA5E9",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        bg: "#F8FAFC",
        sidebar: "#1E1B4B"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
