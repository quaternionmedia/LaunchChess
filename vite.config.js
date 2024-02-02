/** @type {import('vite').UserConfig} */

import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 1234,
        host: '0.0.0.0'
    },
    root: 'src',
    build: {
        outDir: 'dist'
    }
})
