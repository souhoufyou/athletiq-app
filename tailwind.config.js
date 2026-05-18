/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-inter, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)"
      },
      colors: {
        ink: "#08090b",
        mist: "#1a1d22",
        moss: "#9aa3ad",
        coral: "#ff5a00",
        lemon: "#ffc247",
        sea: "#24c07a",
        sky: "#ff7a18",
        amber: "#ff9f1a",
        // Cold data accent: metrics, stats, trends, passive information.
        // Resolves from --accent-data-rgb so it adapts to light/dark mode.
        electric: "rgb(var(--accent-data-rgb) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(0, 0, 0, 0.38)"
      }
    }
  },
  plugins: []
};
