/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#00152a",
          container: "#102a43",
          fixed: "#d1e4ff",
          fixedDim: "#b0c9e8",
        },
        secondary: {
          DEFAULT: "#006e2f",
          container: "#6bff8f",
          fixed: "#6bff8f",
          fixedDim: "#4ae176",
        },
        tertiary: {
          DEFAULT: "#001624",
          container: "#002c42",
        },
        surface: "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        
        "on-surface": "#0b1c30",
        "on-surface-variant": "#43474d",
        
        "on-primary": "#ffffff",
        "on-primary-container": "#7a92b0",
        
        "outline": "#74777e",
        "outline-variant": "#c3c6ce",
        
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        
        // Add kebab-case versions of the ones that were camelCase in config
        "secondary-fixed-dim": "#4ae176",
        "primary-fixed-dim": "#b0c9e8",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #00152a 0%, #102a43 100%)",
      },
      boxShadow: {
        "glass": "0 20px 40px rgba(11, 28, 48, 0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
      }
    },
  },
  plugins: [],
};
