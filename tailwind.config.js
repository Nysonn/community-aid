/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Anika", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        coral: {
          50:  "#FEF0ED",
          100: "#FCDDD7",
          200: "#F9BAAF",
          300: "#F48E7C",
          400: "#EE6249",
          500: "#E8452A",
          600: "#C53B22",
          700: "#9E301B",
          800: "#792514",
          900: "#541A0D",
        },
        brand: {
          yellow: "#F5C518",
          "yellow-dark": "#D4A80A",
          "yellow-light": "#FEFCE8",
          charcoal: "#1A1A1A",
          "charcoal-soft": "#3D3D3D",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 4px 10px -6px rgb(0 0 0 / 0.05)",
        "coral": "0 4px 14px rgba(232,69,42,0.30)",
        "coral-lg": "0 8px 24px rgba(232,69,42,0.36)",
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in-up":      "fade-in-up 0.28s ease-out",
        "fade-in":         "fade-in 0.2s ease-out",
        "scale-in":        "scale-in 0.22s ease-out",
        "slide-in-right":  "slide-in-right 0.24s ease-out",
      },
    },
  },
  plugins: [],
}
