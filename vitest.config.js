import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Configuración de Vitest para testing
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno de testing
    environment: 'jsdom',
    // Archivos de test
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    // Configuración de coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/main.tsx',
        'src/App.tsx',
      ],
    },
    // Configuración de globals
    globals: true,
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    // Tiempo máximo por test
    timeout: 10000,
    // Pool de workers
    pool: 'forks',
    // Limpiar between tests
    clearMocks: true,
    // Restore mocks entre tests
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
