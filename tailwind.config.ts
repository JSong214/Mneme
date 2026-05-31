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
        soft: "0 20px 50px -30px rgb(15 23 42 / 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
