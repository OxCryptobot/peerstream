import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svgr(), react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Uncomment and adjust if you have a backend API
      // '/api': {
      //   target: 'http://localhost:5000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020'
  },
  define: {
    'process.env': process.env
  },
  resolve: {
    alias: {
      events: 'events'
    }
  },
  assetsInclude: ['**/*.svg'],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})
