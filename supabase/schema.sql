-- 이 파일은 몇 번을 실행해도 같은 결과가 된다.
-- 기존 데이터는 지우지 않는다. 정책만 지웠다 다시 만든다.

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

-- create policy 에는 if not exists 문법이 없다. 이 파일을 여러 번 돌려도
-- 같은 결과가 되도록 만들기 전에 지운다.

-- 교사는 자기 학급만
drop policy if exists "교사는 자기 학급을 읽는다" on classes;
create policy "교사는 자기 학급을 읽는다" on classes
  for select using (teacher_id = auth.uid());

drop policy if exists "교사는 학급을 만든다" on classes;
create policy "교사는 학급을 만든다" on classes
  for insert with check (teacher_id = auth.uid());

-- 학급을 지우면 on delete cascade 로 그 반의 학생과 제출물도 함께 사라진다.
drop policy if exists "교사는 자기 학급을 지운다" on classes;
create policy "교사는 자기 학급을 지운다" on classes
  for delete using (teacher_id = auth.uid());

-- 학생은 자기 행만, 교사는 자기 학급의 학생 전부
drop policy if exists "학생은 자기 행을 읽는다" on students;
create policy "학생은 자기 행을 읽는다" on students
  for select using (
    anon_uid = auth.uid()
    or class_id in (select id from classes where teacher_id = auth.uid())
  );

-- 제출물: 학생은 자기 것만 쓰고 읽는다
drop policy if exists "학생은 자기 제출물을 넣는다" on submissions;
create policy "학생은 자기 제출물을 넣는다" on submissions
  for insert with check (
    student_id in (select id from students where anon_uid = auth.uid())
  );

drop policy if exists "학생은 자기 제출물을 읽는다" on submissions;
create policy "학생은 자기 제출물을 읽는다" on submissions
  for select using (
    student_id in (select id from students where anon_uid = auth.uid())
  );

drop policy if exists "교사는 자기 학급 제출물을 읽는다" on submissions;
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
-- returns table(...) 의 이름들은 함수 안에서 변수로도 존재한다. 그래서
-- on conflict (class_id, number) 의 class_id 가 컬럼인지 변수인지 모호해진다.
-- 모호하면 컬럼을 택하도록 지시한다.
#variable_conflict use_column
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
