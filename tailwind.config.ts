import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom theme colors
        brand: {
          "primary-accent": "hsl(var(--brand-primary-accent))", // Teal
          "dark-bg": "hsl(var(--brand-dark-bg))",
          "card-bg": "hsl(var(--brand-card-bg))",
          // Keep 'green' key pointing to new primary accent for compatibility
          green: "hsl(var(--brand-primary-accent))",
        },
        "brand-text-primary": "hsl(var(--brand-text-primary))",
        "brand-text-secondary": "hsl(var(--brand-text-secondary))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        "glow-accent": "0 0 15px 0 hsl(var(--brand-primary-accent) / 0.5)",
        "glow-accent-light": "0 0 8px 0 hsl(var(--brand-primary-accent) / 0.3)",
        // Keep old glow name for compatibility
        "glow-green": "0 0 15px 0 hsl(var(--brand-primary-accent) / 0.5)",
        "glow-green-light": "0 0 8px 0 hsl(var(--brand-primary-accent) / 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
