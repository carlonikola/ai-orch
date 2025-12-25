
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    react(),
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: i => `__tla_${i}`
    })
  ],
  define: {
    // Kill the 'process is not defined' error globally
    'process.env': {},
    'global': 'window',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-dom/client',
      'lucide-react', 
      'xlsx', 
      'react-markdown', 
      'remark-gfm',
      'pdfjs-dist'
    ]
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true
    }
  }
});
