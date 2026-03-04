import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./layout/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#0a0a0f",
        accent: "#22d3ee",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(34, 211, 238, 0.25)",
        card: "0 4px 24px -4px rgba(0,0,0,0.12), 0 8px 48px -8px rgba(0,0,0,0.08)",
      },
      minHeight: {
        screen: "100vh",
        "screen-dvh": "100dvh",
      },
    },
  },
  plugins: [],
};
export default config;
