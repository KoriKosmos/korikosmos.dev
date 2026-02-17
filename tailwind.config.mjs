import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'accent-dark': 'rgb(var(--accent-dark) / <alpha-value>)',
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#3B82F6",
          "secondary": "#60A5FA",
          "accent": "#3B82F6",
          "neutral": "#1F2937",
          "base-100": "#111827",
          "base-200": "#1F2937",
          "base-300": "#374151",
          "base-content": "#F3F4F6",
          "info": "#3B82F6",
          "success": "#4ADE80",
          "warning": "#FBBF24",
          "error": "#EF4444",
          "--accent-dark": "37 99 235",
          "--surface": "31 41 55",
        },
      },
      {
        light: {
          "primary": "#3B82F6",
          "secondary": "#2563EB",
          "accent": "#3B82F6",
          "neutral": "#E5E7EB",
          "base-100": "#F3F4F6",
          "base-200": "#E5E7EB",
          "base-300": "#D1D5DB",
          "base-content": "#111827",
          "info": "#3B82F6",
          "success": "#22C55E",
          "warning": "#F59E0B",
          "error": "#EF4444",
          "--accent-dark": "37 99 235",
          "--surface": "229 231 235",
        },
      },
      {
        forest: {
          "primary": "#4ADE80",
          "secondary": "#22C55E",
          "accent": "#4ADE80",
          "neutral": "#14241C",
          "base-100": "#101B14",
          "base-200": "#14241C",
          "base-300": "#1A3326",
          "base-content": "#E5FFE6",
          "info": "#4ADE80",
          "success": "#4ADE80",
          "warning": "#FBBF24",
          "error": "#EF4444",
          "--accent-dark": "21 128 61",
          "--surface": "20 36 28",
        },
      },
      {
        batman: {
          "primary": "#FFD700",
          "secondary": "#FFFF00",
          "accent": "#FFD700",
          "neutral": "#1a1a1a",
          "base-100": "#000000",
          "base-200": "#1a1a1a",
          "base-300": "#333333",
          "base-content": "#FFD700",
          "info": "#FFD700",
          "success": "#FFD700",
          "warning": "#FFD700",
          "error": "#FFD700",
          "--accent-dark": "255 215 0",
          "--surface": "0 0 0",
        },
      },
    ],
    darkTheme: "dark",
  },
};
