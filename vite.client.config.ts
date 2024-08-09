import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname, 'src/client'),
    resolve: {
        alias: {
          '@shared': path.resolve(__dirname, '../shared')
        }
    },
    build: {
        outDir: path.resolve(__dirname, 'dist/client'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: './src/client/index.html',
                secondary: './src/client/map.html',
            },
        }
    },
});