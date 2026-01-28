import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages tip:
  // - Project pages: set `base: '/<repo-name>/'`
  // - The default `./` keeps built asset URLs relative (works well with Hash Router)
  base: './'
})
