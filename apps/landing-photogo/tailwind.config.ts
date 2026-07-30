import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F7F7F7",
          100: "#EFEFEF",
          200: "#D4D4D4",
          300: "#B0B0B0",
          400: "#8A8A8A",
          500: "#5A5A5A",
          600: "#3A3A3A",
          700: "#2A2A2A",
          800: "#1A1A1A",
          900: "#121212",
          950: "#0A0A0A",
        },
        sunset: {
          50: "#FFF5F0",
          100: "#FFE5D4",
          400: "#FF8A5E",
          500: "#FF6B35",
          600: "#E5541A",
          700: "#B83E0F",
        },
        paper: {
          50: "#FAFAFA",
          100: "#F4F4F4",
          200: "#E5E5E5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "ken-burns": "kenBurns 20s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        kenBurns: {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.1) translate(-2%, -2%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
