/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
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
          DEFAULT: "#E31E24",
          50: "#FEF2F2",
          100: "#FEE2E2", 
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#E31E24",
          600: "#C81A20",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          foreground: "#FFFFFF",
          hover: "#C81A20",
        },
        secondary: {
          DEFAULT: "#F8FAFC",
          foreground: "#0F172A",
        },
        accent: {
          DEFAULT: "#FFC107",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#FFC107",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          foreground: "#0F172A",
        },
        hero: {
          from: "#E31E24",
          to: "#FFB300",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        error: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        navy: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        // Light mode specific colors
        light: {
          bg: {
            primary: "#FEFEFE",
            secondary: "#F9FAFB",
            card: "#FFFFFF",
            elevated: "#FFFFFF",
          },
          surface: {
            primary: "#FFFFFF",
            secondary: "#F8FAFC",
            elevated: "#FFFFFF",
          },
          border: {
            subtle: "#F3F4F6",
            default: "#E5E7EB",
            strong: "#D1D5DB",
          },
          text: {
            primary: "#111827",
            secondary: "#374151",
            tertiary: "#6B7280",
            muted: "#9CA3AF",
          }
        },
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
    },
  },
  plugins: [],
}
