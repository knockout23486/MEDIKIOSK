const fs = require('fs');

fs.writeFileSync('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    useDefineForClassFields: true,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noFallthroughCasesInSwitch: true
  },
  include: ['src', 'server']
}, null, 2));

fs.writeFileSync('tsconfig.server.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    outDir: 'dist',
    rootDir: '.',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  },
  include: ['server/**/*']
}, null, 2));

fs.writeFileSync('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
`);

fs.writeFileSync('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ayush: {
          50: '#f4f8f4',
          100: '#e5f0e5',
          200: '#cce1cc',
          300: '#a3caa3',
          400: '#73ad73',
          500: '#4e904e',
          600: '#3c743c',
          700: '#315c31',
          800: '#2a4a2a',
          900: '#233d23',
          950: '#0f210f',
        },
        clinical: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
`);

fs.writeFileSync('postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

fs.writeFileSync('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233c743c'><path d='M19 14V6c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v8c0 1.86 1.28 3.41 3 3.86V20c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.14c1.72-.45 3-2 3-3.86zM9 8h6v2H9V8zm4 7h-2v-2h2v2z'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MediKiosk — AI Clinical Intake Platform (SIH 2026)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased selection:bg-ayush-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

console.log('Configs written successfully');
