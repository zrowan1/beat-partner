/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: "rgba(255, 255, 255, 0.05)",
          "bg-hover": "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.1)",
          "border-light": "rgba(255, 255, 255, 0.2)",
        },
        surface: {
          primary: "#0a0a0f",
          secondary: "#12121a",
        },
        accent: {
          cyan: "#00d4ff",
          purple: "#b347d9",
          magenta: "#ff0080",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        label: "12px",
        body: "14px",
        heading: "16px",
        title: "24px",
      },
    },
  },
  plugins: [],
};
