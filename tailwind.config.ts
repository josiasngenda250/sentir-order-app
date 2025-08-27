import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#164DA0"
      },
        boxShadow: {
          soft: "0 10px 24px rgba(0,0,0,.06)"
        }
    },
  },
  plugins: [],
} satisfies Config;
