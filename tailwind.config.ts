import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#121319",
        surface: "#191B23",
        surface2: "#22252F",
        border: "#2A2D3A",
        ink: "#EAEAEF",
        muted: "#8C8FA3",
        accent: "#8B7FFF",
        trace: "#F0B429",
        good: "#4ADE80",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
