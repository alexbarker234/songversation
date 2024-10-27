import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1db954",
        "grey-dark": "#111114",
        grey: "#16171a",
        "grey-light": "#26262b"
      },
      animation: {
        slideIn: "slideIn 1s forwards",
        hop: "hop 0.3s ease-in-out forwards",
        "fade-in": "fade-in 1s forwards",
        "fade-in-out": "fade-in-out 3s forwards",
        "loader-bounce": "loader-bounce 1s infinite ease-in-out",
        "fade-drop-in": "fade-drop-in 0.5s forwards",
        "pulse-scale": "pulse-scale 0.5s infinite"
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        hop: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "fade-in-out": {
          "0%, 10%": { opacity: "1" },
          "90%, 100%": { opacity: "0" }
        },
        "loader-bounce": {
          "0%": { height: "50%", top: "50%" },
          "50%": { height: "100%", top: "0%" },
          "100%": { height: "50%", top: "50%" }
        },
        "fade-drop-in": {
          from: { opacity: "0", transform: "translateY(-3rem)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animation-delay")]
};
export default config;
