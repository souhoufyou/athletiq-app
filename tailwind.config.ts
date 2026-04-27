import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08090b",
        mist: "#1a1d22",
        moss: "#9aa3ad",
        coral: "#ff5a00",
        lemon: "#ffc247",
        sea: "#24c07a",
        sky: "#ff7a18",
        amber: "#ff9f1a"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(0, 0, 0, 0.38)"
      }
    }
  },
  plugins: []
};

export default config;
