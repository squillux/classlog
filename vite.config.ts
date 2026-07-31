/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // supabase.ts 는 환경 변수가 비면 import 시점에 던진다. 테스트에서는
    // 네트워크를 타지 않으므로 더미 값을 준다. 이게 없으면 supabase 를
    // 간접적으로 끌어오는 모든 테스트가 모킹을 강요당한다.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
