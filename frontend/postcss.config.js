module.exports = {
  plugins: [
    require('postcss-nesting'),  // Plugin de nesting ANTES de Tailwind
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
