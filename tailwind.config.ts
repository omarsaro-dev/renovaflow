import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F1E8",
        surface: "#FFFFFF",
        elevated: "#FBFAF7",
        border: "#DDE0D8",
        ink: {
          DEFAULT: "#25302C",
          muted: "#68736E",
          faint: "#8D9A94",
        },
        brand: {
          DEFAULT: "#205B4A",
          hover: "#17483A",
          active: "#123A2F",
          light: "#2F8665",
          tint: "#EAF1ED",
        },
        accent: {
          DEFAULT: "#CDA36A",
          hover: "#B98D4E",
          tint: "#F7F0E4",
        },
        success: "#2F8665",
        successTint: "#E6F0EB",
        warning: "#BD922E",
        warningTint: "#F6EFD9",
        danger: "#B9544D",
        dangerTint: "#F7E9E8",
        info: "#4E7890",
        infoTint: "#E7EEF2",
        disabled: "#AEB6B1",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "10px",
        control: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(37,48,44,0.04), 0 1px 3px rgba(37,48,44,0.06)",
        elevated: "0 4px 12px rgba(37,48,44,0.08), 0 1px 3px rgba(37,48,44,0.05)",
        popover: "0 8px 28px rgba(37,48,44,0.14)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "slide-up": "slide-up 0.22s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;