import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15293c",
        "ink-2": "#34465a",
        navy: "#163a5e",
        accent: "#1c87b0",
        "accent-ink": "#14647f",
        "accent-wash": "#e9f4f9",
        muted: "#66798a",
        line: "#e7e9ee",
        "line-2": "#eef0f4",
        "surface-2": "#fafbfc",
        good: "#1f9d6b",
        amber: "#9a6b16",
        "amber-wash": "#fbf4e6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
