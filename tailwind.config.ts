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
        "grey-dark": "#121212",
        grey: "#16171a",
        "grey-light": "#2c2c30"
      },
      animation: {
        slideIn: "slideIn 1s forwards",
        hop: "hop 0.3s ease-in-out forwards",
        "fade-in": "fade-in 1s forwards",
        "fade-in-out": "fade-in-out 3s forwards"
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
        }
      }
    }
  },
  plugins: []
};
export default config;
