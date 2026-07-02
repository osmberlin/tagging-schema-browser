/// <reference types="vite/client" />

// Fontsource packages ship CSS only (no JS/types); declare them so tsc accepts
// the side-effect imports in main.tsx.
declare module '@fontsource-variable/*'

declare module 'itemsjs'
