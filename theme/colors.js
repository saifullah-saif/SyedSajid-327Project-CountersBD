/**
 * Application color palette
 * This file centralizes all color definitions for the application
 */

const colors = {
  // Primary colors
  primary: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e", // Main primary color (red)
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },

  // Background colors
  background: {
    DEFAULT: "#0a0a0a", // Very dark background
    50: "#121212", // Slightly lighter background
    100: "#1a1a1a",
    200: "#2a2a2a",
    800: "#1f1f1f", // Used for scrollbar track
    900: "#0f0f0f",
  },

  // Zinc scale (replacing gray)
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b",
  },

  // Accent colors
  accent: {
    blue: {
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
    green: {
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },
    yellow: {
      500: "#eab308",
      600: "#ca8a04",
      700: "#a16207",
    },
    purple: {
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
    },
  },

  // Status colors
  status: {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  },

  // Text colors
  text: {
    primary: "#ffffff",
    secondary: "#a1a1aa", // Updated to zinc-400
    muted: "#71717a", // Updated to zinc-500
  },

  // Border colors
  border: {
    DEFAULT: "#3f3f46", // Updated to zinc-700
    light: "#52525b", // Updated to zinc-600
    dark: "#27272a", // Updated to zinc-800
  },
}

export default colors
