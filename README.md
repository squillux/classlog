# 너희 반 앱 (classlog)

Vite + React + TypeScript 뼈대. Supabase 클라이언트가 미리 준비되어 있습니다.

## 실행

```bash
npm install
npm run dev
```

## Supabase 설정

1. `.env.example` 을 참고해 `.env.local` 의 두 값을 채웁니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (Supabase 대시보드 > Project Settings > API 에서 복사)

2. 개발 서버를 다시 시작합니다. Vite 는 환경 변수를 시작 시점에만 읽습니다.
3. `supabase/schema.sql` 을 Supabase SQL Editor 에 붙여넣어 실행합니다.
   몇 번을 실행해도 안전합니다. 기존 데이터는 지우지 않습니다.
4. Authentication > Providers 에서 Anonymous sign-ins 를 켭니다.

`.env.local` 은 `.gitignore` 의 `*.local` 규칙으로 커밋되지 않습니다.

## 사용법

```ts
import { supabase } from './lib/supabase'

const { data, error } = await supabase.from('students').select()
```

`src/lib/supabase.ts` 는 import 되는 시점에 환경 변수를 검사하고, 비어 있으면 에러를
던집니다. 그래서 현재 `App.tsx` 는 이 모듈을 import 하지 않습니다 — 실제로 Supabase
데이터를 쓰는 화면을 만들 때 import 하세요.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | oxlint |
