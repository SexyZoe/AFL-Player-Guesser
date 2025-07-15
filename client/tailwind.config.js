module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'afl-red': '#E53E3E',
        'afl-blue': '#2B6CB0',
        'afl-yellow': '#F6E05E'
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // require('tailwind-scrollbar'), // 暂时移除避免版本冲突
  ],
}

