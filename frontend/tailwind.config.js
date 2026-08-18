module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        carbon: "#0A0A0A",
        coal: "#111111",
        smoke: "#1A1A1E",
        graphite: "#222228",
        ash: "#3A3A42",
        stone: "#6B6B76",
        silver: "#98989F",
        chrome: "#C7C7CC",
        steel: "#D1D1D6",
        frost: "#E5E5EA",
        ivory: "#F2F2F7",
        white: "#FFFFFF",
      },
      borderRadius: {
        card: "24px",
        "2xl": "18px",
        "3xl": "28px",
        pill: "9999px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(255,255,255,0.06)",
        "glow-lg": "0 0 60px rgba(255,255,255,0.08)",
        glass: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        float: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Space Grotesk",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        data: [
          "JetBrains Mono",
          "SF Mono",
          "Fira Code",
          "monospace",
        ],
        accent: [
          "Outfit",
          "Inter",
          "-apple-system",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "card-pop": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.03)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(30px, -20px) scale(1.05)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slide-up 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "card-pop": "card-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "float-slow": "float-slow 20s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "count-up": "count-up 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "marquee": "marquee 20s linear infinite",
      },
    },
  },
  plugins: [],
};
