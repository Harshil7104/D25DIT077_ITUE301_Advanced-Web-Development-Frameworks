import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist-unoptimized/stats.html',
      title: 'Practical 8: Baseline Monolithic Bundle Analysis (Unoptimized)',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    outDir: 'dist-unoptimized',
    sourcemap: true,
    rollupOptions: {
      input: 'index-unoptimized.html',
      output: {
        // Force all code into a single monolithic bundle file for baseline measurement
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
