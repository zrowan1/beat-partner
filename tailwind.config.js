/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: "rgba(255, 255, 255, 0.08)",
          "bg-hover": "rgba(255, 255, 255, 0.14)",
          "bg-active": "rgba(255, 255, 255, 0.2)",
          border: "rgba(255, 255, 255, 0.12)",
          "border-hover": "rgba(255, 255, 255, 0.18)",
          "border-active": "rgba(255, 255, 255, 0.3)",
        },
        surface: {
          primary: "#020204",
          secondary: "#08080c",
          tertiary: "#0f0f14",
        },
        accent: {
          cyan: "#22d3ee",
          purple: "#a78bfa",
          magenta: "#f472b6",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        label: ["11px", { lineHeight: "14px", letterSpacing: "0.02em" }],
        body: ["13px", { lineHeight: "20px" }],
        heading: ["15px", { lineHeight: "22px", fontWeight: "500" }],
        title: ["20px", { lineHeight: "28px", fontWeight: "600" }],
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
      boxShadow: {
        glass: "0 1px 2px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        "glass-lg": "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};
