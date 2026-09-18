/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Poppins",
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["Playfair Display", "Cinzel", "Georgia", "serif"],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        ink: "#0A0A0A",
        paper: "#FAF9F6",
        grey: "#6B6B6B",
        blue: {
          DEFAULT: "#1E40AF",
          bright: "#3B82F6",
          light: "#60A5FA",
        },
      },
      borderRadius: {
        cta: "6px",
      },
      boxShadow: {
        hard: "4px 4px 0 0 #0A0A0A",
        "hard-sm": "3px 3px 0 0 #0A0A0A",
      },
      letterSpacing: {
        kicker: "0.18em",
      },
    },
  },
  plugins: [],
};
