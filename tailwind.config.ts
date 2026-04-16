import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        "accent-green": "hsl(var(--accent-green))",
        "accent-red": "hsl(var(--accent-red))",
        "accent-blue": "hsl(var(--accent-blue))",
        "accent-orange": "hsl(var(--accent-orange))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        pulse_dot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "flash-green": {
          "0%": { backgroundColor: "hsl(154 100% 50% / 0.2)" },
          "100%": { backgroundColor: "transparent" },
        },
        "flash-red": {
          "0%": { backgroundColor: "hsl(354 100% 69% / 0.2)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        pulse_dot: "pulse_dot 2s ease-in-out infinite",
        "flash-green": "flash-green 0.6s ease-out",
        "flash-red": "flash-red 0.6s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
