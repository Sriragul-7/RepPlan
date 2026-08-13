module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0C0F",
        graphite: "#17181C",
        bone: "#F5F3EE",
        ash: "#8A8D94",
        ember: "#FF4D2E",
        glacier: "#5FD8E0",
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(255,77,46,0.25)",
        "glow-glacier": "0 0 24px rgba(95,216,224,0.25)",
        card: "0 4px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
