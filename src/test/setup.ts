import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library 의 자동 정리는 전역 afterEach 가 있을 때만 등록된다.
// 이 프로젝트는 Vitest 전역을 쓰지 않으므로 직접 걸어 준다.
// 없으면 테스트마다 DOM 이 쌓여 같은 요소가 여러 개 잡힌다.
afterEach(cleanup)
