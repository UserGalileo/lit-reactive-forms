/// <reference types="vitest" />
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    minify: true
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      name: 'LitReactiveForms'
    },
    rollupOptions: {
      external: ['lit', 'lit-html', 'rxjs']
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
