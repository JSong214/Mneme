import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        line: "#d8dee8"
      },
      boxShadow: {
        soft: "0 20px 50px -30px rgb(15 23 42 / 0.35)",
        premium: "0 10px 30px -15px rgba(0, 0, 0, 0.08)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.04)"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      scale: {
        101: "1.01",
        102: "1.02"
      }
    }
  },
  plugins: []
};

export default config;
