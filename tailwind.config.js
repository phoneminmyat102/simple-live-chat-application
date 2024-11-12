/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.css",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {
        zIndex: {
            '99999': '99999'
        }
    },
  },
  plugins: [],
  corePlugins: {
        flexDirection: true
    }
}

