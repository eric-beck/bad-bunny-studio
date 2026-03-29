/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./*.html",
    "./classifieds/**/*.html",
    "./labs/**/*.html",
    "./plans/**/*.html",
    "./scripts/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f4e8",
        "surface-container-high": "#e9e9dd",
        "tertiary-fixed-dim": "#e9c400",
        "primary-container": "#ffdad6",
        "on-surface-variant": "#474747",
        "on-primary-fixed-variant": "#93000d",
        "surface-variant": "#e4e3d7",
        "tertiary-container": "#ffe16d",
        "inverse-on-surface": "#f2f1e5",
        "primary-fixed": "#ffdad6",
        "secondary": "#00668a",
        "surface-container": "#efeee3",
        "primary": "#c00014",
        "inverse-surface": "#303129",
        "surface-tint": "#c00014",
        "tertiary-fixed": "#ffe16d",
        "on-error": "#ffffff",
        "on-tertiary-container": "#544600",
        "secondary-fixed": "#c3e8ff",
        "surface-container-highest": "#e4e3d7",
        "surface-bright": "#fbfaee",
        "on-background": "#1b1c15",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#001e2c",
        "on-primary-fixed": "#410002",
        "inverse-primary": "#ffb4ab",
        "surface-dim": "#dbdbcf",
        "error": "#ba1a1a",
        "surface": "#fbfaee",
        "on-secondary-fixed-variant": "#004c69",
        "outline-variant": "#c6c6c6",
        "secondary-container": "#c3e8ff",
        "primary-fixed-dim": "#ffb4ab",
        "on-tertiary-fixed-variant": "#544600",
        "outline": "#777777",
        "secondary-fixed-dim": "#7ad0ff",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-primary-container": "#93000d",
        "error-container": "#ffdad6",
        "background": "#fbfaee",
        "on-secondary-container": "#004c69",
        "on-error-container": "#93000a",
        "on-surface": "#1b1c15",
        "on-tertiary-fixed": "#221b00",
        "tertiary": "#705d00"
      },
      fontFamily: {
        headline: ["Spline Sans"],
        body: ["Plus Jakarta Sans"],
        label: ["Plus Jakarta Sans"]
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")]
};
