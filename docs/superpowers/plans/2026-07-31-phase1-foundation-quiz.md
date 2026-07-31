# 1단계: 기반 + 퀴즈 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학생이 학급 코드로 입장해 퀴즈를 풀고 제출하면, 교사가 자기 학급의 제출물을 한 화면에서 확인할 수 있다.

**Architecture:** 기존 Vite + React + TS 뼈대에 react-router를 얹는다. 학생은 Supabase 익명 인증으로 uid를 받고, `security definer` RPC `enter_class` 가 학급 조회와 학생 행 upsert를 한 번에 처리한다. 테이블은 RLS로 완전히 잠가 두고 학생은 RPC를 통해서만 학급에 들어온다. 활동은 `Activity` 인터페이스만 지키는 독립 모듈로 만들어, 2단계부터 활동을 추가할 때 기존 코드를 건드리지 않는다.

**Tech Stack:** Vite 8, React 19, TypeScript 6, react-router 7, @supabase/supabase-js 2, Vitest + Testing Library

## Global Constraints

- 패키지 매니저는 npm. `package-lock.json` 을 커밋한다.
- 코드 실행 런타임(Pyodide, Blockly)을 도입하지 않는다.
- 교사용 문항 저작 화면을 만들지 않는다. 문항은 `src/content/` 의 TS 파일에 둔다.
- 학생 계정·비밀번호를 만들지 않는다. 인증은 Supabase 익명 인증만 쓴다.
- 기준 해상도는 학교 PC실 데스크톱. 태블릿 레이아웃은 1단계 범위 밖.
- 모든 테스트 파일은 `src/` 안에 대상 파일과 나란히 둔다 (`foo.ts` → `foo.test.ts`). `tsconfig.app.json` 의 `include` 가 `["src"]` 이기 때문이다.
- Vitest 전역(globals)을 켜지 않는다. 각 테스트 파일에서 `import { describe, it, expect } from 'vitest'` 로 명시적으로 가져온다.
- 커밋 메시지는 한국어로 쓰고, 본문 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 를 붙인다.

## 선행 조건

Task 2부터는 살아 있는 Supabase 프로젝트가 필요하다. Task 1은 이것 없이도 된다.

- [ ] supabase.com 에서 프로젝트를 만든다 (무료 등급으로 충분하다).
- [ ] Project Settings → API 에서 Project URL 과 anon key 를 복사해
      `.env.local` 의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 에 채운다.
- [ ] `npm run dev` 를 다시 시작한다. Vite 는 환경 변수를 시작할 때만 읽는다.

`.env.local` 은 `.gitignore` 의 `*.local` 규칙으로 커밋되지 않는다. 저장소가
공개이므로 키를 다른 파일에 적어 넣지 않도록 주의한다.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `supabase/schema.sql` | 테이블·RLS·RPC 정의. Supabase SQL 편집기에 붙여넣어 적용 |
| `src/main.tsx` | 라우터 마운트 |
| `src/App.tsx` | 라우트 정의 |
| `src/lib/supabase.ts` | (있음) Supabase 클라이언트 |
| `src/lib/classCode.ts` | 학급 코드 정규화·검증 (순수 함수) |
| `src/lib/session.ts` | 익명 로그인 + `enter_class` 호출 + 세션 보관 |
| `src/lib/submission.ts` | 제출물 저장·조회 단일 창구 |
| `src/content/quiz.ts` | 퀴즈 문항 데이터와 타입 |
| `src/activities/types.ts` | `Activity` 인터페이스 |
| `src/activities/index.ts` | 활동 레지스트리 |
| `src/activities/quiz/grade.ts` | 채점 (순수 함수) |
| `src/activities/quiz/QuizActivity.tsx` | 퀴즈 화면 |
| `src/routes/Home.tsx` | 학급 코드 입장 |
| `src/routes/ActivityList.tsx` | 활동 목록 |
| `src/routes/ActivityPage.tsx` | 활동 셸 — 활동을 찾아 제출을 저장 |
| `src/routes/TeacherLogin.tsx` | 교사 로그인 |
| `src/routes/TeacherDashboard.tsx` | 학급 개설 + 제출물 확인 |

순수 로직(`classCode`, `grade`)을 컴포넌트에서 떼어낸 이유는 그 부분이 가장 많이 틀리고 가장 테스트하기 쉬운 부분이기 때문이다.

---

### Task 1: 테스트 환경과 라우팅 뼈대

**Files:**
- Modify: `package.json` (의존성·스크립트)
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `npm test` 명령. `App` 컴포넌트가 라우트를 정의하고, `main.tsx` 가 `BrowserRouter` 로 감싼다.

- [ ] **Step 1: 의존성 설치**

```bash
npm install react-router
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: `package.json` 에 test 스크립트 추가**

`scripts` 에 아래 두 줄을 넣는다.

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: `vite.config.ts` 에 테스트 설정 추가**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 4: `src/test/setup.ts` 작성**

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library 의 자동 정리는 전역 afterEach 가 있을 때만 등록된다.
// 이 프로젝트는 Vitest 전역을 쓰지 않으므로 직접 걸어 준다.
// 없으면 테스트마다 DOM 이 쌓여 같은 요소가 여러 개 잡힌다.
afterEach(cleanup)
```

- [ ] **Step 5: 실패하는 테스트 작성**

`src/App.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'

describe('App 라우팅', () => {
  it('루트 경로에서 학급 코드 입장 화면을 보여준다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '너희 반 앱' })).toBeInTheDocument()
  })

  it('알 수 없는 경로에서는 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter initialEntries={['/없는길']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('페이지를 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `App` 이 아직 라우트를 렌더하지 않아 두 테스트 모두 요소를 못 찾는다.

- [ ] **Step 7: `src/App.tsx` 구현**

```tsx
import { Route, Routes } from 'react-router'

function Placeholder({ title }: { title: string }) {
  return <h1>{title}</h1>
}

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Placeholder title="너희 반 앱" />} />
        <Route path="/activities" element={<Placeholder title="활동 목록" />} />
        <Route path="/activities/:activityId" element={<Placeholder title="활동" />} />
        <Route path="/teacher" element={<Placeholder title="교사 로그인" />} />
        <Route path="/teacher/dashboard" element={<Placeholder title="교사 화면" />} />
        <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
      </Routes>
    </main>
  )
}

export default App
```

- [ ] **Step 8: `src/main.tsx` 에서 라우터로 감싸기**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 9: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 테스트 2개 PASS, 빌드 성공

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "테스트 환경(Vitest)과 라우팅 뼈대 추가"
```

---

### Task 2: Supabase 스키마·RLS·RPC

**Files:**
- Create: `supabase/schema.sql`
- Modify: `README.md` (적용 절차)

**Interfaces:**
- Consumes: 없음
- Produces: 테이블 `classes`, `students`, `submissions`. RPC `enter_class(p_code text, p_number int, p_name text)` → `(student_id uuid, class_id uuid, class_name text)` 1행.

이 태스크는 코드가 아니라 SQL이라 자동 테스트를 붙이지 않는다. 대신 Step 4에서 사람이 직접 확인한다.

- [ ] **Step 1: `supabase/schema.sql` 작성**

```sql
-- 테이블 -----------------------------------------------------------------
create table if not exists classes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references classes(id) on delete cascade,
  number       int  not null,
  display_name text not null,
  anon_uid     uuid,
  created_at   timestamptz not null default now(),
  unique (class_id, number)
);

create table if not exists submissions (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references students(id) on delete cascade,
  activity_id text not null,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists submissions_student_idx on submissions (student_id);
create index if not exists students_class_idx on students (class_id);

-- RLS --------------------------------------------------------------------
alter table classes     enable row level security;
alter table students    enable row level security;
alter table submissions enable row level security;

-- 교사는 자기 학급만
create policy "교사는 자기 학급을 읽는다" on classes
  for select using (teacher_id = auth.uid());
create policy "교사는 학급을 만든다" on classes
  for insert with check (teacher_id = auth.uid());

-- 학생은 자기 행만, 교사는 자기 학급의 학생 전부
create policy "학생은 자기 행을 읽는다" on students
  for select using (
    anon_uid = auth.uid()
    or class_id in (select id from classes where teacher_id = auth.uid())
  );

-- 제출물: 학생은 자기 것만 쓰고 읽는다
create policy "학생은 자기 제출물을 넣는다" on submissions
  for insert with check (
    student_id in (select id from students where anon_uid = auth.uid())
  );
create policy "학생은 자기 제출물을 읽는다" on submissions
  for select using (
    student_id in (select id from students where anon_uid = auth.uid())
  );
create policy "교사는 자기 학급 제출물을 읽는다" on submissions
  for select using (
    student_id in (
      select s.id from students s
      join classes c on c.id = s.class_id
      where c.teacher_id = auth.uid()
    )
  );

-- 입장 RPC ---------------------------------------------------------------
-- classes 를 익명 사용자에게 열지 않으려고 security definer 로 감싼다.
-- 학급 코드를 아는 사람만 자기 행 하나를 얻는다.
create or replace function enter_class(p_code text, p_number int, p_name text)
returns table (student_id uuid, class_id uuid, class_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class   classes%rowtype;
  v_student students%rowtype;
begin
  if auth.uid() is null then
    raise exception '인증되지 않은 요청입니다';
  end if;
  if p_number is null or p_number < 1 or p_number > 100 then
    raise exception '번호는 1에서 100 사이여야 합니다';
  end if;
  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception '이름을 입력해야 합니다';
  end if;

  select * into v_class from classes where code = upper(btrim(p_code));
  if not found then
    raise exception '학급 코드를 찾을 수 없습니다';
  end if;

  insert into students (class_id, number, display_name, anon_uid)
  values (v_class.id, p_number, btrim(p_name), auth.uid())
  on conflict (class_id, number) do update
    set anon_uid = auth.uid(), display_name = excluded.display_name
  returning * into v_student;

  return query select v_student.id, v_class.id, v_class.name;
end;
$$;

revoke all on function enter_class(text, int, text) from public;
grant execute on function enter_class(text, int, text) to authenticated;
```

- [ ] **Step 2: Supabase 대시보드에서 익명 인증 켜기**

Authentication → Providers → Anonymous sign-ins 를 켠다. 이걸 빼먹으면 Task 4가 통째로 실패한다.

- [ ] **Step 3: SQL 적용**

Supabase 대시보드 → SQL Editor 에 `supabase/schema.sql` 전체를 붙여넣고 실행한다.

- [ ] **Step 4: 사람이 직접 확인**

SQL Editor 에서 아래를 실행해 세 테이블에 RLS가 켜져 있는지 본다.

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('classes','students','submissions');
```

Expected: 세 행 모두 `rowsecurity = true`

- [ ] **Step 5: README에 적용 절차 추가**

`README.md` 의 "Supabase 설정" 절 끝에 아래를 덧붙인다.

```markdown
3. `supabase/schema.sql` 을 Supabase SQL Editor 에 붙여넣어 실행합니다.
4. Authentication > Providers 에서 Anonymous sign-ins 를 켭니다.
```

- [ ] **Step 6: 커밋**

```bash
git add supabase/schema.sql README.md
git commit -m "Supabase 스키마·RLS·입장 RPC 추가"
```

---

### Task 3: 학급 코드 정규화·검증

**Files:**
- Create: `src/lib/classCode.ts`
- Test: `src/lib/classCode.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `normalizeClassCode(input: string): string`, `isValidClassCode(code: string): boolean`, `generateClassCode(): string`

학생이 손으로 치는 값이라 공백·소문자·하이픈이 섞여 들어온다. 서버로 보내기 전에 한 곳에서 정리한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/classCode.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalizeClassCode, isValidClassCode, generateClassCode } from './classCode'

describe('normalizeClassCode', () => {
  it('소문자를 대문자로 바꾼다', () => {
    expect(normalizeClassCode('ab12cd')).toBe('AB12CD')
  })

  it('공백과 하이픈을 없앤다', () => {
    expect(normalizeClassCode(' ab1 -2cd ')).toBe('AB12CD')
  })

  it('빈 문자열은 빈 문자열로 둔다', () => {
    expect(normalizeClassCode('   ')).toBe('')
  })
})

describe('isValidClassCode', () => {
  it('영숫자 6자리를 통과시킨다', () => {
    expect(isValidClassCode('AB12CD')).toBe(true)
  })

  it('길이가 다르면 거부한다', () => {
    expect(isValidClassCode('AB12C')).toBe(false)
    expect(isValidClassCode('AB12CDE')).toBe(false)
  })

  it('영숫자가 아닌 글자를 거부한다', () => {
    expect(isValidClassCode('AB12C!')).toBe(false)
    expect(isValidClassCode('한글코드다')).toBe(false)
  })
})

describe('generateClassCode', () => {
  it('유효한 코드를 만든다', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidClassCode(generateClassCode())).toBe(true)
    }
  })

  it('헷갈리는 글자(0, O, 1, I)를 쓰지 않는다', () => {
    const codes = Array.from({ length: 200 }, generateClassCode).join('')
    expect(codes).not.toMatch(/[01OI]/)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- classCode`
Expected: FAIL — `./classCode` 모듈이 없다

- [ ] **Step 3: `src/lib/classCode.ts` 구현**

```ts
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function normalizeClassCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidClassCode(code: string): boolean {
  return new RegExp(`^[A-Z0-9]{${CODE_LENGTH}}$`).test(code)
}

export function generateClassCode(): string {
  const bytes = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- classCode`
Expected: PASS (9개)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/classCode.ts src/lib/classCode.test.ts
git commit -m "학급 코드 정규화·검증·생성 함수 추가"
```

---

### Task 4: 학생 세션

**Files:**
- Create: `src/lib/session.ts`
- Test: `src/lib/session.test.ts`

**Interfaces:**
- Consumes: `normalizeClassCode` (Task 3), `supabase` (`src/lib/supabase.ts`)
- Produces:
  - `type StudentSession = { studentId: string; classId: string; className: string; number: number; displayName: string }`
  - `enterClass(code: string, number: number, displayName: string): Promise<StudentSession>`
  - `loadSession(): StudentSession | null`
  - `saveSession(session: StudentSession): void`
  - `clearSession(): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/session.test.ts`. Supabase는 통째로 가짜로 바꾼다 — 여기서 검증할 것은 "우리 코드가 RPC를 어떻게 부르고 응답을 어떻게 다루는가"이지 Supabase 자체가 아니다.

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

const signInAnonymously = vi.fn()
const getSession = vi.fn()
const rpc = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: () => signInAnonymously(),
      getSession: () => getSession(),
    },
    rpc: (name: string, args: unknown) => rpc(name, args),
  },
}))

const { enterClass, saveSession, loadSession, clearSession } = await import('./session')

beforeEach(() => {
  localStorage.clear()
  signInAnonymously.mockReset()
  getSession.mockReset()
  rpc.mockReset()
  getSession.mockResolvedValue({ data: { session: null } })
  signInAnonymously.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
})

describe('enterClass', () => {
  it('코드를 정규화해서 RPC에 넘긴다', async () => {
    rpc.mockResolvedValue({
      data: [{ student_id: 's1', class_id: 'c1', class_name: '1학년 3반' }],
      error: null,
    })

    await enterClass(' ab12cd ', 7, ' 김하늘 ')

    expect(rpc).toHaveBeenCalledWith('enter_class', {
      p_code: 'AB12CD',
      p_number: 7,
      p_name: '김하늘',
    })
  })

  it('세션 정보를 돌려주고 저장한다', async () => {
    rpc.mockResolvedValue({
      data: [{ student_id: 's1', class_id: 'c1', class_name: '1학년 3반' }],
      error: null,
    })

    const session = await enterClass('AB12CD', 7, '김하늘')

    expect(session).toEqual({
      studentId: 's1',
      classId: 'c1',
      className: '1학년 3반',
      number: 7,
      displayName: '김하늘',
    })
    expect(loadSession()).toEqual(session)
  })

  it('로그인 세션이 이미 있으면 익명 로그인을 다시 하지 않는다', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    rpc.mockResolvedValue({
      data: [{ student_id: 's1', class_id: 'c1', class_name: '1반' }],
      error: null,
    })

    await enterClass('AB12CD', 1, '홍길동')

    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('코드 형식이 틀리면 RPC를 부르지 않고 거절한다', async () => {
    await expect(enterClass('AB12', 7, '김하늘')).rejects.toThrow('학급 코드는 6자리')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('RPC 오류를 그대로 알린다', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: '학급 코드를 찾을 수 없습니다' } })
    await expect(enterClass('AB12CD', 7, '김하늘')).rejects.toThrow('학급 코드를 찾을 수 없습니다')
  })
})

describe('세션 보관', () => {
  it('저장한 세션을 다시 읽는다', () => {
    const session = {
      studentId: 's1', classId: 'c1', className: '1반', number: 7, displayName: '김하늘',
    }
    saveSession(session)
    expect(loadSession()).toEqual(session)
  })

  it('저장된 것이 없으면 null', () => {
    expect(loadSession()).toBeNull()
  })

  it('망가진 값이 들어 있으면 null 을 주고 지운다', () => {
    localStorage.setItem('classlog.session', '{깨진 JSON')
    expect(loadSession()).toBeNull()
    expect(localStorage.getItem('classlog.session')).toBeNull()
  })

  it('clearSession 이 지운다', () => {
    saveSession({
      studentId: 's1', classId: 'c1', className: '1반', number: 7, displayName: '김하늘',
    })
    clearSession()
    expect(loadSession()).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- session`
Expected: FAIL — `./session` 모듈이 없다

- [ ] **Step 3: `src/lib/session.ts` 구현**

```ts
import { supabase } from './supabase'
import { isValidClassCode, normalizeClassCode } from './classCode'

const STORAGE_KEY = 'classlog.session'

export type StudentSession = {
  studentId: string
  classId: string
  className: string
  number: number
  displayName: string
}

async function ensureSignedIn(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error(`익명 로그인에 실패했습니다: ${error.message}`)
}

export async function enterClass(
  code: string,
  number: number,
  displayName: string,
): Promise<StudentSession> {
  const normalized = normalizeClassCode(code)
  if (!isValidClassCode(normalized)) {
    throw new Error('학급 코드는 6자리 영문·숫자입니다.')
  }
  const name = displayName.trim()
  if (!name) throw new Error('이름을 입력해 주세요.')

  await ensureSignedIn()

  const { data, error } = await supabase.rpc('enter_class', {
    p_code: normalized,
    p_number: number,
    p_name: name,
  })
  if (error) throw new Error(error.message)

  const row = (data as { student_id: string; class_id: string; class_name: string }[])?.[0]
  if (!row) throw new Error('학급 정보를 받지 못했습니다.')

  const session: StudentSession = {
    studentId: row.student_id,
    classId: row.class_id,
    className: row.class_name,
    number,
    displayName: name,
  }
  saveSession(session)
  return session
}

export function saveSession(session: StudentSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function loadSession(): StudentSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StudentSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- session`
Expected: PASS (9개)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/session.ts src/lib/session.test.ts
git commit -m "학생 세션(익명 로그인 + 학급 입장) 추가"
```

---

### Task 5: 학급 입장 화면

**Files:**
- Create: `src/routes/Home.tsx`
- Modify: `src/App.tsx` (`/` 라우트 연결)
- Modify: `src/App.test.tsx` (제목 기대값 갱신)
- Test: `src/routes/Home.test.tsx`

**Interfaces:**
- Consumes: `enterClass`, `loadSession` (Task 4)
- Produces: `/` 에서 입장에 성공하면 `/activities` 로 이동한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/routes/Home.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

const enterClass = vi.fn()
const navigate = vi.fn()

vi.mock('../lib/session', () => ({
  enterClass: (...args: unknown[]) => enterClass(...args),
  loadSession: () => null,
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

const Home = (await import('./Home')).default

beforeEach(() => {
  enterClass.mockReset()
  navigate.mockReset()
})

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>)
}

describe('Home', () => {
  it('입력값을 모아 enterClass 를 부르고 활동 목록으로 보낸다', async () => {
    enterClass.mockResolvedValue({ studentId: 's1' })
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('학급 코드'), 'ab12cd')
    await user.type(screen.getByLabelText('번호'), '7')
    await user.type(screen.getByLabelText('이름'), '김하늘')
    await user.click(screen.getByRole('button', { name: '들어가기' }))

    expect(enterClass).toHaveBeenCalledWith('ab12cd', 7, '김하늘')
    expect(navigate).toHaveBeenCalledWith('/activities')
  })

  it('실패하면 이유를 화면에 보여주고 이동하지 않는다', async () => {
    enterClass.mockRejectedValue(new Error('학급 코드를 찾을 수 없습니다'))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('학급 코드'), 'ZZ99ZZ')
    await user.type(screen.getByLabelText('번호'), '7')
    await user.type(screen.getByLabelText('이름'), '김하늘')
    await user.click(screen.getByRole('button', { name: '들어가기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('학급 코드를 찾을 수 없습니다')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('보내는 동안 버튼을 잠가 두 번 눌리지 않게 한다', async () => {
    let release: (v: unknown) => void = () => {}
    enterClass.mockReturnValue(new Promise((r) => { release = r }))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('학급 코드'), 'AB12CD')
    await user.type(screen.getByLabelText('번호'), '7')
    await user.type(screen.getByLabelText('이름'), '김하늘')
    await user.click(screen.getByRole('button', { name: '들어가기' }))

    expect(screen.getByRole('button', { name: '들어가는 중…' })).toBeDisabled()
    release({ studentId: 's1' })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- Home`
Expected: FAIL — `./Home` 모듈이 없다

- [ ] **Step 3: `src/routes/Home.tsx` 구현**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { enterClass } from '../lib/session'

export default function Home() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await enterClass(code, Number(number), name)
      navigate('/activities')
    } catch (err) {
      setError(err instanceof Error ? err.message : '들어가지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>너희 반 앱</h1>

      <label htmlFor="code">학급 코드</label>
      <input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />

      <label htmlFor="number">번호</label>
      <input
        id="number" type="number" min="1" max="100" value={number}
        onChange={(e) => setNumber(e.target.value)} required
      />

      <label htmlFor="name">이름</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={busy}>{busy ? '들어가는 중…' : '들어가기'}</button>
    </form>
  )
}
```

- [ ] **Step 4: `src/App.tsx` 의 `/` 라우트를 Home 으로 교체**

`Placeholder title="너희 반 앱"` 을 `<Home />` 로 바꾸고 `import Home from './routes/Home'` 를 추가한다.

- [ ] **Step 5: `src/App.test.tsx` 손보기**

`/` 테스트가 이제 Home 을 렌더하므로 `vi.mock('./lib/session', () => ({ enterClass: vi.fn(), loadSession: () => null }))` 를 파일 맨 위에 추가한다. 기대값(`heading`, 이름 `너희 반 앱`)은 그대로 통과한다.

- [ ] **Step 6: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "학급 코드 입장 화면 추가"
```

---

### Task 6: 퀴즈 콘텐츠와 채점

**Files:**
- Create: `src/content/quiz.ts`
- Create: `src/activities/quiz/grade.ts`
- Test: `src/activities/quiz/grade.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type QuizQuestion = { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number } | { id: string; kind: 'blank'; prompt: string; answer: string }`
  - `quizQuestions: QuizQuestion[]`
  - `type QuizAnswer = { questionId: string; value: string }`
  - `type QuizResult = { graded: { questionId: string; correct: boolean; given: string; expected: string }[]; score: number; total: number }`
  - `gradeQuiz(questions: QuizQuestion[], answers: QuizAnswer[]): QuizResult`

빈칸 답은 학생이 손으로 치므로 앞뒤 공백, 대소문자, 사이 공백이 제각각이다. 채점 전에 한 곳에서 정리한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/quiz/grade.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { gradeQuiz } from './grade'
import type { QuizQuestion } from '../../content/quiz'

const questions: QuizQuestion[] = [
  { id: 'q1', kind: 'choice', prompt: '순서도에서 판단을 나타내는 도형은?',
    choices: ['타원', '마름모', '직사각형'], answerIndex: 1 },
  { id: 'q2', kind: 'blank', prompt: '같은 일을 여러 번 하는 제어 구조를 □□ 구조라 한다.',
    answer: '반복' },
]

describe('gradeQuiz', () => {
  it('객관식은 선택지 번호로 채점한다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q1', value: '1' }])
    expect(result.graded[0].correct).toBe(true)
  })

  it('객관식 오답을 잡아낸다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q1', value: '0' }])
    expect(result.graded[0].correct).toBe(false)
    expect(result.graded[0].expected).toBe('마름모')
  })

  it('빈칸은 앞뒤 공백과 사이 공백을 무시한다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q2', value: '  반 복  ' }])
    expect(result.graded[1].correct).toBe(true)
  })

  it('빈칸은 대소문자를 무시한다', () => {
    const withEnglish: QuizQuestion[] = [
      { id: 'q3', kind: 'blank', prompt: '반복 구조의 영어 표현은?', answer: 'loop' },
    ]
    const result = gradeQuiz(withEnglish, [{ questionId: 'q3', value: 'LOOP' }])
    expect(result.graded[0].correct).toBe(true)
  })

  it('답을 안 낸 문항은 오답으로 두고 빈 문자열을 기록한다', () => {
    const result = gradeQuiz(questions, [])
    expect(result.graded.map((g) => g.correct)).toEqual([false, false])
    expect(result.graded[0].given).toBe('')
  })

  it('점수와 총점을 센다', () => {
    const result = gradeQuiz(questions, [
      { questionId: 'q1', value: '1' },
      { questionId: 'q2', value: '반복' },
    ])
    expect(result.score).toBe(2)
    expect(result.total).toBe(2)
  })

  it('문항 순서대로 결과를 돌려준다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q2', value: '반복' }])
    expect(result.graded.map((g) => g.questionId)).toEqual(['q1', 'q2'])
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- grade`
Expected: FAIL — `./grade` 모듈이 없다

- [ ] **Step 3: `src/content/quiz.ts` 작성**

```ts
export type QuizQuestion =
  | { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number }
  | { id: string; kind: 'blank'; prompt: string; answer: string }

// 교과서를 보고 채우기 전까지 파이프라인 검증용으로 쓰는 샘플이다.
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1', kind: 'choice',
    prompt: '순서도에서 조건을 판단할 때 쓰는 도형은 무엇인가요?',
    choices: ['타원', '마름모', '직사각형', '평행사변형'],
    answerIndex: 1,
  },
  {
    id: 'q2', kind: 'choice',
    prompt: '문제를 작은 문제로 나누어 푸는 것을 무엇이라고 하나요?',
    choices: ['추상화', '문제 분해', '패턴 인식', '자동화'],
    answerIndex: 1,
  },
  {
    id: 'q3', kind: 'blank',
    prompt: '같은 명령을 여러 번 되풀이하는 제어 구조를 □□ 구조라고 합니다.',
    answer: '반복',
  },
]
```

- [ ] **Step 4: `src/activities/quiz/grade.ts` 구현**

```ts
import type { QuizQuestion } from '../../content/quiz'

export type QuizAnswer = { questionId: string; value: string }

export type GradedQuestion = {
  questionId: string
  correct: boolean
  given: string
  expected: string
}

export type QuizResult = {
  graded: GradedQuestion[]
  score: number
  total: number
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function expectedOf(question: QuizQuestion): string {
  return question.kind === 'choice' ? question.choices[question.answerIndex] : question.answer
}

function givenOf(question: QuizQuestion, raw: string): string {
  if (question.kind !== 'choice') return raw
  const index = Number(raw)
  return question.choices[index] ?? ''
}

export function gradeQuiz(questions: QuizQuestion[], answers: QuizAnswer[]): QuizResult {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]))

  const graded = questions.map((question) => {
    const raw = byId.get(question.id) ?? ''
    const expected = expectedOf(question)
    const given = raw === '' ? '' : givenOf(question, raw)
    const correct =
      question.kind === 'choice'
        ? Number(raw) === question.answerIndex && raw !== ''
        : normalizeText(raw) !== '' && normalizeText(raw) === normalizeText(question.answer)
    return { questionId: question.id, correct, given, expected }
  })

  return {
    graded,
    score: graded.filter((g) => g.correct).length,
    total: questions.length,
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- grade`
Expected: PASS (7개)

- [ ] **Step 6: 커밋**

```bash
git add src/content src/activities
git commit -m "퀴즈 문항 데이터와 채점 함수 추가"
```

---

### Task 7: 퀴즈 활동 컴포넌트와 활동 레지스트리

**Files:**
- Create: `src/activities/types.ts`
- Create: `src/activities/index.ts`
- Create: `src/activities/quiz/QuizActivity.tsx`
- Test: `src/activities/quiz/QuizActivity.test.tsx`

**Interfaces:**
- Consumes: `quizQuestions` (Task 6), `gradeQuiz` (Task 6)
- Produces:
  - `type ActivityProps = { onSubmit: (payload: unknown) => void | Promise<void> }`
  - `type Activity = { id: string; title: string; Component: React.FC<ActivityProps> }`
  - `activities: Activity[]`, `findActivity(id: string): Activity | undefined`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/quiz/QuizActivity.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizActivity from './QuizActivity'

describe('QuizActivity', () => {
  it('모든 문항을 보여준다', () => {
    render(<QuizActivity onSubmit={vi.fn()} />)
    expect(screen.getByText(/조건을 판단할 때 쓰는 도형/)).toBeInTheDocument()
    expect(screen.getByText(/작은 문제로 나누어/)).toBeInTheDocument()
    expect(screen.getByText(/되풀이하는 제어 구조/)).toBeInTheDocument()
  })

  it('제출하면 채점 결과를 onSubmit 으로 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<QuizActivity onSubmit={onSubmit} />)

    await user.click(screen.getByRole('radio', { name: '마름모' }))
    await user.click(screen.getByRole('radio', { name: '문제 분해' }))
    await user.type(screen.getByLabelText(/되풀이하는 제어 구조/), '반복')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.score).toBe(3)
    expect(payload.total).toBe(3)
    expect(payload.answers).toHaveLength(3)
  })

  it('제출 후 점수를 화면에 보여준다', async () => {
    const user = userEvent.setup()
    render(<QuizActivity onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('radio', { name: '마름모' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('3문항 중 1문항 맞았습니다.')).toBeInTheDocument()
  })

  it('제출 전에는 점수를 보여주지 않는다', () => {
    render(<QuizActivity onSubmit={vi.fn()} />)
    expect(screen.queryByText(/맞았습니다/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- QuizActivity`
Expected: FAIL — `./QuizActivity` 모듈이 없다

- [ ] **Step 3: `src/activities/types.ts` 작성**

```ts
import type { FC } from 'react'

export type ActivityProps = {
  onSubmit: (payload: unknown) => void | Promise<void>
}

export type Activity = {
  id: string
  title: string
  Component: FC<ActivityProps>
}
```

- [ ] **Step 4: `src/activities/quiz/QuizActivity.tsx` 구현**

```tsx
import { useState } from 'react'
import { quizQuestions } from '../../content/quiz'
import { gradeQuiz, type QuizResult } from './grade'
import type { ActivityProps } from '../types'

export default function QuizActivity({ onSubmit }: ActivityProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)

  function set(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit() {
    const answers = quizQuestions.map((q) => ({
      questionId: q.id,
      value: values[q.id] ?? '',
    }))
    const graded = gradeQuiz(quizQuestions, answers)
    setResult(graded)
    await onSubmit({ answers, ...graded })
  }

  return (
    <section>
      <h2>퀴즈</h2>

      {quizQuestions.map((question) => (
        <fieldset key={question.id}>
          <legend>{question.prompt}</legend>

          {question.kind === 'choice' ? (
            question.choices.map((choice, index) => (
              <label key={choice}>
                <input
                  type="radio"
                  name={question.id}
                  value={index}
                  checked={values[question.id] === String(index)}
                  onChange={() => set(question.id, String(index))}
                />
                {choice}
              </label>
            ))
          ) : (
            <input
              aria-label={question.prompt}
              value={values[question.id] ?? ''}
              onChange={(e) => set(question.id, e.target.value)}
            />
          )}
        </fieldset>
      ))}

      <button type="button" onClick={handleSubmit}>제출하기</button>

      {result && (
        <p>{result.total}문항 중 {result.score}문항 맞았습니다.</p>
      )}
    </section>
  )
}
```

- [ ] **Step 5: `src/activities/index.ts` 작성**

```ts
import QuizActivity from './quiz/QuizActivity'
import type { Activity } from './types'

export type { Activity, ActivityProps } from './types'

export const activities: Activity[] = [
  { id: 'quiz', title: '퀴즈 · 빈칸 채우기', Component: QuizActivity },
]

export function findActivity(id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id)
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test -- QuizActivity`
Expected: PASS (4개)

- [ ] **Step 7: 커밋**

```bash
git add src/activities
git commit -m "퀴즈 활동 컴포넌트와 활동 레지스트리 추가"
```

---

### Task 8: 제출물 저장과 활동 셸

**Files:**
- Create: `src/lib/submission.ts`
- Test: `src/lib/submission.test.ts`
- Create: `src/routes/ActivityList.tsx`
- Create: `src/routes/ActivityPage.tsx`
- Test: `src/routes/ActivityPage.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `supabase`, `loadSession` (Task 4), `findActivity`/`activities` (Task 7)
- Produces:
  - `saveSubmission(studentId: string, activityId: string, payload: unknown): Promise<void>`
  - `type SubmissionRow = { id: string; activityId: string; payload: unknown; createdAt: string; studentName: string; studentNumber: number }`
  - `listSubmissions(classId: string): Promise<SubmissionRow[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/submission.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

const insert = vi.fn()
const select = vi.fn()

vi.mock('./supabase', () => ({
  supabase: { from: (table: string) => ({ insert, select: (cols: string) => select(table, cols) }) },
}))

const { saveSubmission, listSubmissions } = await import('./submission')

beforeEach(() => {
  insert.mockReset()
  select.mockReset()
})

describe('saveSubmission', () => {
  it('제출물을 넣는다', async () => {
    insert.mockResolvedValue({ error: null })
    await saveSubmission('s1', 'quiz', { score: 3 })
    expect(insert).toHaveBeenCalledWith({
      student_id: 's1', activity_id: 'quiz', payload: { score: 3 },
    })
  })

  it('오류를 알린다', async () => {
    insert.mockResolvedValue({ error: { message: '권한이 없습니다' } })
    await expect(saveSubmission('s1', 'quiz', {})).rejects.toThrow('권한이 없습니다')
  })
})

describe('listSubmissions', () => {
  it('학급의 제출물을 최신순으로 평평하게 만들어 돌려준다', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'sub1', activity_id: 'quiz', payload: { score: 3 },
          created_at: '2026-07-31T01:00:00Z',
          students: { display_name: '김하늘', number: 7, class_id: 'c1' },
        },
      ],
      error: null,
    })
    select.mockReturnValue({ eq: () => ({ order }) })

    const rows = await listSubmissions('c1')

    expect(rows).toEqual([
      {
        id: 'sub1', activityId: 'quiz', payload: { score: 3 },
        createdAt: '2026-07-31T01:00:00Z', studentName: '김하늘', studentNumber: 7,
      },
    ])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('오류를 알린다', async () => {
    select.mockReturnValue({
      eq: () => ({ order: vi.fn().mockResolvedValue({ data: null, error: { message: '실패' } }) }),
    })
    await expect(listSubmissions('c1')).rejects.toThrow('실패')
  })
})
```

`src/routes/ActivityPage.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

const saveSubmission = vi.fn()
const loadSession = vi.fn()

vi.mock('../lib/submission', () => ({ saveSubmission: (...a: unknown[]) => saveSubmission(...a) }))
vi.mock('../lib/session', () => ({ loadSession: () => loadSession() }))
vi.mock('../activities', () => ({
  findActivity: (id: string) =>
    id === 'demo'
      ? {
          id: 'demo', title: '데모',
          Component: ({ onSubmit }: { onSubmit: (p: unknown) => void }) => (
            <button type="button" onClick={() => onSubmit({ ok: true })}>보내기</button>
          ),
        }
      : undefined,
}))

const ActivityPage = (await import('./ActivityPage')).default

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/activities/:activityId" element={<ActivityPage />} /></Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  saveSubmission.mockReset()
  loadSession.mockReset()
  loadSession.mockReturnValue({ studentId: 's1', className: '1학년 3반' })
})

describe('ActivityPage', () => {
  it('활동이 낸 제출물을 저장한다', async () => {
    saveSubmission.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAt('/activities/demo')

    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(saveSubmission).toHaveBeenCalledWith('s1', 'demo', { ok: true })
    expect(await screen.findByRole('status')).toHaveTextContent('제출했습니다')
  })

  it('저장에 실패하면 알린다', async () => {
    saveSubmission.mockRejectedValue(new Error('권한이 없습니다'))
    const user = userEvent.setup()
    renderAt('/activities/demo')

    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('권한이 없습니다')
  })

  it('세션이 없으면 입장 안내를 보여준다', () => {
    loadSession.mockReturnValue(null)
    renderAt('/activities/demo')
    expect(screen.getByText('먼저 학급 코드로 들어와 주세요.')).toBeInTheDocument()
  })

  it('없는 활동이면 안내를 보여준다', () => {
    renderAt('/activities/없는활동')
    expect(screen.getByText('활동을 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- submission ActivityPage`
Expected: FAIL — 두 모듈 다 없다

- [ ] **Step 3: `src/lib/submission.ts` 구현**

```ts
import { supabase } from './supabase'

export type SubmissionRow = {
  id: string
  activityId: string
  payload: unknown
  createdAt: string
  studentName: string
  studentNumber: number
}

type RawRow = {
  id: string
  activity_id: string
  payload: unknown
  created_at: string
  students: { display_name: string; number: number; class_id: string }
}

export async function saveSubmission(
  studentId: string,
  activityId: string,
  payload: unknown,
): Promise<void> {
  const { error } = await supabase.from('submissions').insert({
    student_id: studentId,
    activity_id: activityId,
    payload,
  })
  if (error) throw new Error(error.message)
}

export async function listSubmissions(classId: string): Promise<SubmissionRow[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, activity_id, payload, created_at, students!inner(display_name, number, class_id)')
    .eq('students.class_id', classId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    activityId: row.activity_id,
    payload: row.payload,
    createdAt: row.created_at,
    studentName: row.students.display_name,
    studentNumber: row.students.number,
  }))
}
```

- [ ] **Step 4: `src/routes/ActivityPage.tsx` 구현**

```tsx
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { findActivity } from '../activities'
import { loadSession } from '../lib/session'
import { saveSubmission } from '../lib/submission'

export default function ActivityPage() {
  const { activityId = '' } = useParams()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const session = loadSession()
  if (!session) return <p>먼저 학급 코드로 들어와 주세요.</p>

  const activity = findActivity(activityId)
  if (!activity) return <p>활동을 찾을 수 없습니다.</p>

  async function handleSubmit(payload: unknown) {
    setError(null)
    try {
      await saveSubmission(session!.studentId, activityId, payload)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출하지 못했습니다.')
    }
  }

  const { Component } = activity
  return (
    <section>
      <Link to="/activities">← 활동 목록</Link>
      <Component onSubmit={handleSubmit} />
      {saved && <p role="status">제출했습니다.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
```

- [ ] **Step 5: `src/routes/ActivityList.tsx` 구현**

```tsx
import { Link } from 'react-router'
import { activities } from '../activities'
import { loadSession } from '../lib/session'

export default function ActivityList() {
  const session = loadSession()
  if (!session) return <p>먼저 학급 코드로 들어와 주세요.</p>

  return (
    <section>
      <h1>{session.className} · {session.number}번 {session.displayName}</h1>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>
            <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 6: `src/App.tsx` 에 두 라우트 연결**

`/activities` 를 `<ActivityList />` 로, `/activities/:activityId` 를 `<ActivityPage />` 로 바꾸고 import 를 추가한다.

- [ ] **Step 7: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "제출물 저장과 활동 목록·활동 셸 추가"
```

---

### Task 9: 교사 로그인과 학급 개설

**Files:**
- Create: `src/routes/TeacherLogin.tsx`
- Test: `src/routes/TeacherLogin.test.tsx`
- Create: `src/lib/teacher.ts`
- Test: `src/lib/teacher.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `supabase`, `generateClassCode` (Task 3)
- Produces:
  - `signInTeacher(email: string, password: string): Promise<void>`
  - `type ClassRow = { id: string; code: string; name: string }`
  - `createClass(name: string): Promise<ClassRow>`
  - `listClasses(): Promise<ClassRow[]>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/teacher.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

const signInWithPassword = vi.fn()
const getUser = vi.fn()
const insert = vi.fn()
const select = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (c: unknown) => signInWithPassword(c),
      getUser: () => getUser(),
    },
    from: () => ({ insert, select: (cols: string) => select(cols) }),
  },
}))

const { signInTeacher, createClass, listClasses } = await import('./teacher')

beforeEach(() => {
  signInWithPassword.mockReset(); getUser.mockReset(); insert.mockReset(); select.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 't1' } } })
})

describe('signInTeacher', () => {
  it('이메일과 비밀번호로 로그인한다', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    await signInTeacher('a@b.c', 'pw')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' })
  })

  it('실패를 알린다', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: '자격 증명이 올바르지 않습니다' } })
    await expect(signInTeacher('a@b.c', 'x')).rejects.toThrow('자격 증명이 올바르지 않습니다')
  })
})

describe('createClass', () => {
  it('코드를 만들어 학급을 넣고 만든 행을 돌려준다', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'c1', code: 'AB23CD', name: '1학년 3반' }, error: null,
    })
    insert.mockReturnValue({ select: () => ({ single }) })

    const created = await createClass('1학년 3반')

    expect(created).toEqual({ id: 'c1', code: 'AB23CD', name: '1학년 3반' })
    const arg = insert.mock.calls[0][0]
    expect(arg.name).toBe('1학년 3반')
    expect(arg.teacher_id).toBe('t1')
    expect(arg.code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('오류를 알린다', async () => {
    insert.mockReturnValue({
      select: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: { message: '실패' } }) }),
    })
    await expect(createClass('1반')).rejects.toThrow('실패')
  })
})

describe('listClasses', () => {
  it('학급 목록을 돌려준다', async () => {
    select.mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [{ id: 'c1', code: 'AB23CD', name: '1학년 3반' }], error: null,
      }),
    })
    expect(await listClasses()).toEqual([{ id: 'c1', code: 'AB23CD', name: '1학년 3반' }])
  })
})
```

`src/routes/TeacherLogin.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

const signInTeacher = vi.fn()
const navigate = vi.fn()

vi.mock('../lib/teacher', () => ({ signInTeacher: (...a: unknown[]) => signInTeacher(...a) }))
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

const TeacherLogin = (await import('./TeacherLogin')).default

beforeEach(() => { signInTeacher.mockReset(); navigate.mockReset() })

describe('TeacherLogin', () => {
  it('로그인에 성공하면 대시보드로 보낸다', async () => {
    signInTeacher.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MemoryRouter><TeacherLogin /></MemoryRouter>)

    await user.type(screen.getByLabelText('이메일'), 'a@b.c')
    await user.type(screen.getByLabelText('비밀번호'), 'pw')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(signInTeacher).toHaveBeenCalledWith('a@b.c', 'pw')
    expect(navigate).toHaveBeenCalledWith('/teacher/dashboard')
  })

  it('실패하면 이유를 보여준다', async () => {
    signInTeacher.mockRejectedValue(new Error('자격 증명이 올바르지 않습니다'))
    const user = userEvent.setup()
    render(<MemoryRouter><TeacherLogin /></MemoryRouter>)

    await user.type(screen.getByLabelText('이메일'), 'a@b.c')
    await user.type(screen.getByLabelText('비밀번호'), 'x')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('자격 증명이 올바르지 않습니다')
    expect(navigate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- teacher TeacherLogin`
Expected: FAIL — 두 모듈 다 없다

- [ ] **Step 3: `src/lib/teacher.ts` 구현**

```ts
import { supabase } from './supabase'
import { generateClassCode } from './classCode'

export type ClassRow = { id: string; code: string; name: string }

export async function signInTeacher(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function createClass(name: string): Promise<ClassRow> {
  const { data: userData } = await supabase.auth.getUser()
  const teacherId = userData.user?.id
  if (!teacherId) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('classes')
    .insert({ name: name.trim(), code: generateClassCode(), teacher_id: teacherId })
    .select('id, code, name')
    .single()
  if (error) throw new Error(error.message)
  return data as ClassRow
}

export async function listClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, code, name')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ClassRow[]
}
```

- [ ] **Step 4: `src/routes/TeacherLogin.tsx` 구현**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { signInTeacher } from '../lib/teacher'

export default function TeacherLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signInTeacher(email, password)
      navigate('/teacher/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>교사 로그인</h1>

      <label htmlFor="email">이메일</label>
      <input id="email" type="email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />

      <label htmlFor="password">비밀번호</label>
      <input id="password" type="password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
    </form>
  )
}
```

- [ ] **Step 5: `src/App.tsx` 의 `/teacher` 라우트 연결**

- [ ] **Step 6: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "교사 로그인과 학급 개설 기능 추가"
```

---

### Task 10: 교사 대시보드

**Files:**
- Create: `src/routes/TeacherDashboard.tsx`
- Test: `src/routes/TeacherDashboard.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `listClasses`, `createClass` (Task 9), `listSubmissions` (Task 8)
- Produces: `/teacher/dashboard` 화면

- [ ] **Step 1: 실패하는 테스트 작성**

`src/routes/TeacherDashboard.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const listClasses = vi.fn()
const createClass = vi.fn()
const listSubmissions = vi.fn()

vi.mock('../lib/teacher', () => ({
  listClasses: () => listClasses(),
  createClass: (n: string) => createClass(n),
}))
vi.mock('../lib/submission', () => ({ listSubmissions: (id: string) => listSubmissions(id) }))

const TeacherDashboard = (await import('./TeacherDashboard')).default

beforeEach(() => {
  listClasses.mockReset(); createClass.mockReset(); listSubmissions.mockReset()
  listClasses.mockResolvedValue([{ id: 'c1', code: 'AB23CD', name: '1학년 3반' }])
  listSubmissions.mockResolvedValue([])
})

describe('TeacherDashboard', () => {
  it('학급과 학급 코드를 보여준다', async () => {
    render(<TeacherDashboard />)
    expect(await screen.findByText('1학년 3반')).toBeInTheDocument()
    expect(screen.getByText('AB23CD')).toBeInTheDocument()
  })

  it('첫 학급의 제출물을 불러와 보여준다', async () => {
    listSubmissions.mockResolvedValue([
      {
        id: 'sub1', activityId: 'quiz', payload: { score: 2, total: 3 },
        createdAt: '2026-07-31T01:00:00Z', studentName: '김하늘', studentNumber: 7,
      },
    ])
    render(<TeacherDashboard />)

    expect(await screen.findByText('7번 김하늘')).toBeInTheDocument()
    expect(screen.getByText('quiz')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('제출물이 없으면 안내를 보여준다', async () => {
    render(<TeacherDashboard />)
    expect(await screen.findByText('아직 제출된 것이 없습니다.')).toBeInTheDocument()
  })

  it('학급을 새로 만들면 목록에 더한다', async () => {
    createClass.mockResolvedValue({ id: 'c2', code: 'XY45ZW', name: '1학년 4반' })
    const user = userEvent.setup()
    render(<TeacherDashboard />)
    await screen.findByText('1학년 3반')

    await user.type(screen.getByLabelText('새 학급 이름'), '1학년 4반')
    await user.click(screen.getByRole('button', { name: '학급 만들기' }))

    expect(await screen.findByText('1학년 4반')).toBeInTheDocument()
    expect(screen.getByText('XY45ZW')).toBeInTheDocument()
  })

  it('학급이 하나도 없으면 안내를 보여준다', async () => {
    listClasses.mockResolvedValue([])
    render(<TeacherDashboard />)
    expect(await screen.findByText('학급을 먼저 만들어 주세요.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- TeacherDashboard`
Expected: FAIL — `./TeacherDashboard` 모듈이 없다

- [ ] **Step 3: `src/routes/TeacherDashboard.tsx` 구현**

```tsx
import { useEffect, useState, type FormEvent } from 'react'
import { createClass, listClasses, type ClassRow } from '../lib/teacher'
import { listSubmissions, type SubmissionRow } from '../lib/submission'

function scoreOf(payload: unknown): string {
  const p = payload as { score?: number; total?: number } | null
  return p && typeof p.score === 'number' && typeof p.total === 'number'
    ? `${p.score} / ${p.total}`
    : '—'
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listClasses()
      .then((rows) => {
        setClasses(rows)
        setSelected(rows[0]?.id ?? null)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selected) return
    listSubmissions(selected)
      .then(setSubmissions)
      .catch((err: Error) => setError(err.message))
  }, [selected])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const created = await createClass(newName)
      setClasses((prev) => [created, ...prev])
      setSelected(created.id)
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '학급을 만들지 못했습니다.')
    }
  }

  return (
    <section>
      <h1>교사 화면</h1>

      <form onSubmit={handleCreate}>
        <label htmlFor="newClass">새 학급 이름</label>
        <input id="newClass" value={newName}
          onChange={(e) => setNewName(e.target.value)} required />
        <button type="submit">학급 만들기</button>
      </form>

      {error && <p role="alert">{error}</p>}

      {classes.length === 0 ? (
        <p>학급을 먼저 만들어 주세요.</p>
      ) : (
        <ul>
          {classes.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => setSelected(row.id)}>{row.name}</button>
              <code>{row.code}</code>
            </li>
          ))}
        </ul>
      )}

      <h2>제출물</h2>
      {submissions.length === 0 ? (
        <p>아직 제출된 것이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr><th>학생</th><th>활동</th><th>점수</th><th>제출 시각</th></tr>
          </thead>
          <tbody>
            {submissions.map((row) => (
              <tr key={row.id}>
                <td>{row.studentNumber}번 {row.studentName}</td>
                <td>{row.activityId}</td>
                <td>{scoreOf(row.payload)}</td>
                <td>{new Date(row.createdAt).toLocaleString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
```

- [ ] **Step 4: `src/App.tsx` 의 `/teacher/dashboard` 라우트 연결**

이 시점에 `Placeholder` 컴포넌트는 더 쓰이지 않으므로 지운다.

- [ ] **Step 5: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 6: 커밋과 푸시**

```bash
git add -A
git commit -m "교사 대시보드(학급 개설·제출물 확인) 추가"
git push origin main
```

---

## 통합 검증

자동 테스트가 끝난 뒤, 이 단계들은 사람이 직접 밟는다. 단위 테스트는 Supabase를
가짜로 바꿔 두었으므로 **RLS가 실제로 막는지는 여기서만 확인된다.**

- [ ] **교사 계정 만들기** — Supabase 대시보드 Authentication → Users → Add user
- [ ] **교사 흐름** — `npm run dev` 후 `/teacher` 로그인 → 학급 생성 → 학급 코드 확인
- [ ] **학생 흐름** — 새 시크릿 창에서 `/` → 학급 코드·번호·이름 입력 → 퀴즈 풀고 제출
- [ ] **교사 화면에서 제출물이 보이는지 확인**
- [ ] **재입장 확인** — 학생 창의 localStorage 를 비우고 같은 코드·번호로 다시 들어간다.
      제출물이 새 학생으로 갈라지지 않고 같은 학생에 붙어야 한다.
- [ ] **RLS 확인 (중요)** — 두 번째 학급을 만들고 다른 코드로 학생을 하나 더 넣는다.
      브라우저 콘솔에서 학생 세션으로 아래를 실행한다.

```js
const { data } = await window.supabase.from('submissions').select('*')
console.log(data.length)
```

  Expected: 자기 제출물 개수만 나온다. 다른 학급 제출물이 섞여 나오면 RLS 정책이
  잘못된 것이므로 Task 2로 돌아간다. (확인용으로 `main.tsx` 에서 `window.supabase`
  를 잠시 노출하고, 확인 후 되돌린다.)

- [ ] **헤드리스 렌더 확인**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --virtual-time-budget=4000 --screenshot=shot.png --window-size=1200,800 \
  http://localhost:5173/
```

## 남는 일

- 스타일링은 손대지 않았다. 화면은 기본 HTML 모양이다. 2단계 이후 또는 별도
  작업으로 정리한다.
- 퀴즈 문항 3개는 샘플이다. 교과서를 보고 `src/content/quiz.ts` 를 채운다.
- 교사 대시보드에 제출물 상세(어떤 문항을 틀렸는지)는 아직 없다. 5단계에서 붙인다.
