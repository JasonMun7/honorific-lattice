/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        heading: [
          "var(--font-heading)",
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        ads: {
          surface: "var(--ads-elevation-surface)",
          "surface-overlay": "var(--ads-elevation-surface-overlay)",
          "surface-overlay-a88": "var(--ads-elevation-surface-overlay-a88)",
          "surface-raised": "var(--ads-elevation-surface-raised)",
          "surface-sunken": "var(--ads-elevation-surface-sunken)",
          text: "var(--ads-color-text)",
          "text-subtle": "var(--ads-color-text-subtle)",
          "text-subtlest": "var(--ads-color-text-subtlest)",
          "text-accent-teal": "var(--ads-color-text-accent-teal)",
          "text-accent-teal-bolder": "var(--ads-color-text-accent-teal-bolder)",
          "text-accent-yellow-bolder": "var(--ads-color-text-accent-yellow-bolder)",
          "text-selected": "var(--ads-color-text-selected)",
          border: "var(--ads-color-border)",
          "border-bold": "var(--ads-color-border-bold)",
          "border-selected": "var(--ads-color-border-selected)",
          "icon-information": "var(--ads-color-icon-information)",
          "icon-brand": "var(--ads-color-icon-brand)",
          "chart-1": "var(--ads-color-chart-categorical-1)",
          "chart-2": "var(--ads-color-chart-categorical-2)",
          "chart-4": "var(--ads-color-chart-categorical-4)",
          blanket: "var(--ads-color-blanket)",
        },
      },
      spacing: {
        /** Standard panel gutter — scroll bodies, headers, cards */
        panel: "1.75rem",
        /** Top bar / dense rows (still comfortable) */
        "panel-tight": "1.125rem",
        /** Major section break (border-t blocks) */
        section: "2.5rem",
        /** Space between list rows, chips, stacked controls */
        stack: "1.25rem",
        /** Extra air between dense stacks (sidebar cards, connection rows) */
        "stack-loose": "1.5rem",
      },
      fontSize: {
        /** Panel / sheet titles (maps ~ADS body strong, `text-sm` scale) */
        "panel-title": [
          "0.875rem",
          { lineHeight: "1.25rem", fontWeight: "600" },
        ],
        /** Section labels, uppercase rails */
        "panel-section": [
          "0.75rem",
          { lineHeight: "1rem", fontWeight: "600" },
        ],
        /** Secondary panel copy */
        "panel-body": ["0.875rem", { lineHeight: "1.375rem" }],
        /** Metadata, captions */
        "panel-meta": ["0.75rem", { lineHeight: "1.125rem" }],
      },
    },
  },
  plugins: [],
};
