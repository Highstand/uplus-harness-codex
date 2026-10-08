-- M6: 새 Supabase DB에 관리자로 적용할 스키마 초안. 이 파일은 원격 실행하지 않는다.
-- 기존 객체가 있으면 실패한다. IF NOT EXISTS나 DROP으로 기존 데이터를 덮지 않는다.
-- PRD 5장의 Subscription 컬럼 8개만 사용한다.
--
-- 클라이언트 연결 계약 (이번 작업에서 화면 연결은 구현하지 않음):
-- 1. crypto.randomUUID()로 id를 먼저 만들고 현재 화면 메모리에만 유지한다.
-- 2. anon 키로 INSERT한다. 별도의 요청 헤더는 필요하지 않다.
--    입력 컬럼: id, name, phone, plan_id, privacy_agreed; status는 생략하거나 received.
--    application_no와 created_at은 보내지 않는다. 서버 기본값만 사용한다.
-- 3. INSERT 후 .select(...).eq('id', id).single()로 방금 만든 1건을 읽는다.
--    화면 종료 후 메모리를 지운다.
-- 실습용 한계: 화면의 id 필터는 보안 경계가 아니다. anon은 이름·휴대폰 번호를
-- 포함한 모든 행을 조회할 수 있다. 실제 개인정보가 아닌 가상 데이터로만 실습한다.

begin;

create sequence public.subscription_application_number_seq
  as integer minvalue 0 maxvalue 999999 start with 0 increment by 1 no cycle;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique
    default ('SUB-' || lpad(nextval('public.subscription_application_number_seq'::regclass)::text, 6, '0'))
    check (application_no ~ '^SUB-[0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 20 and char_length(btrim(name)) > 0),
  phone text not null check (phone ~ '^010[0-9]{8}$'),
  plan_id text not null check (plan_id in ('p01', 'p02', 'p03', 'p04')),
  privacy_agreed boolean not null check (privacy_agreed is true),
  status text not null default 'received'
    check (status in ('received', 'processing', 'completed', 'canceled')),
  created_at timestamptz not null default now()
);

alter sequence public.subscription_application_number_seq
  owned by public.subscriptions.application_no;

alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

-- Supabase의 기존 기본 권한도 제거한 뒤 필요한 권한만 다시 부여한다.
revoke all privileges on table public.subscriptions from public, anon, authenticated;
revoke all privileges on sequence public.subscription_application_number_seq from public, anon, authenticated;
grant usage on schema public to anon;
grant insert (id, name, phone, plan_id, privacy_agreed, status)
  on table public.subscriptions to anon;
grant select on table public.subscriptions to anon;
-- 기본값 nextval에 필요하다. UPDATE/setval 권한은 주지 않아 번호를 되돌릴 수 없다.
grant usage on sequence public.subscription_application_number_seq to anon;

create policy subscriptions_anon_insert
  on public.subscriptions for insert to anon
  with check (
    status = 'received'
    and privacy_agreed is true
  );

create policy subscriptions_anon_select
  on public.subscriptions for select to anon
  using (true);

-- UPDATE/DELETE 정책 및 권한 없음. authenticated도 이번 공개키 흐름에서는 접근 불가.
-- NO CYCLE + UNIQUE로 번호 재사용을 막는다. 최대 백만 번호 소진 시 INSERT는 실패한다.
-- 실패한 트랜잭션도 시퀀스를 소비할 수 있어 번호는 연속적이지 않을 수 있다.
commit;
