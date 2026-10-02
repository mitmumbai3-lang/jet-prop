/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#05070a',
          900: '#080a0f',
          850: '#0c0f17',
          800: '#10141e',
          700: '#161c29',
          600: '#1f2738',
          500: '#2d374d',
        },
        laser: {
          cyan: '#00f0ff',
          amber: '#ff7300',
          red: '#ff3366',
          green: '#00ff88',
          purple: '#8a2be2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        'glow-cyan-lg': '0 0 30px rgba(0, 240, 255, 0.45)',
        'glow-amber': '0 0 15px rgba(255, 115, 0, 0.35)',
        'glow-green': '0 0 15px rgba(0, 255, 136, 0.35)',
        'glow-red': '0 0 15px rgba(255, 51, 102, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'reticle-spin': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
