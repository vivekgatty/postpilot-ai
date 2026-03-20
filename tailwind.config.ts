import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#1D9E75',
          dark: '#178a64',
        },
        navy: {
          DEFAULT: '#0A2540',
          dark: '#0d2f4f',
        },
      },
    },
  },
  plugins: [],
}

export default config
