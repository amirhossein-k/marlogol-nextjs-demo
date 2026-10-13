export default {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        background: "var(--background)",
        foreground: "var(--foreground)",
        input: "var(--input)",
        ring: "var(--ring)",
        muted: { foreground: "var(--muted-foreground)" }
      }
    }
  },
  plugins: []
};
