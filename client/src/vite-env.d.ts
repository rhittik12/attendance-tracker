/// <reference types="vite/client" />

// Extend ImportMeta for Vite env if needed in the project
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Globals injected via Vite define()
declare const __NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY__: string
declare const __NEXT_PUBLIC_API_URL__: string
declare const __NEXT_PUBLIC_SOCKET_URL__: string
