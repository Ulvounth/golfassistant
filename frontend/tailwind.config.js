/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    {
      pattern:
        /(bg|text|border)-(primary|gray|red|green|blue|yellow)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-(0|1|2|3|4|5|6|7|8|9|10|12|16|20|24)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
