/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        "background-elevated": "var(--background-elevated)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
        },
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        card: "var(--card-bg)",
        "card-elevated": "var(--card-elevated)",
        input: "var(--input-bg)",
      },
      boxShadow: {
        subtle: "var(--shadow-sm)",
        deck: "var(--shadow)",
        float: "var(--shadow-lg)",
        ethereal: "var(--shadow-xl)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
