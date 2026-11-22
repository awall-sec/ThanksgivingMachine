import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://awall-sec.github.io/ThanksgivingMachine/
export default defineConfig({
  plugins: [react()],
  base: '/ThanksgivingMachine/',
})
