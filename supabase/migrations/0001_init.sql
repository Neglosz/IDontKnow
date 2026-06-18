-- ============================================================================
-- เราสงสัย.exe — Initial production schema
-- ----------------------------------------------------------------------------
-- ครอบคลุม: โปรไฟล์ผู้เรียน, การสแกนวัตถุ + % ความเชื่อมโยงศาสตร์,
--           Dynamic Skill Tree, การประเมิน (evidence packet + AI rubric),
--           ระบบดาว/streak (server-authoritative), แผนที่ความทรงจำ, ร้านค้า,
--           คลังเนื้อหาที่ผู้พัฒนาอนุมัติ
--
-- ทุกตารางเปิด Row Level Security — ผู้ใช้เห็น/แก้ได้เฉพาะข้อมูลของตัวเอง
-- ตารางคะแนน (star_ledger / node_attempts / assessments) ห้าม client เขียนตรง
-- ให้เขียนผ่าน Edge Function (service_role) เท่านั้น เพื่อกันโกง
-- ============================================================================

-- ── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── ENUMS ───────────────────────────────────────────────────────────────────
do $$ begin
  create type node_status   as enum ('locked', 'available', 'in_progress', 'done');
  create type tree_status   as enum ('active', 'completed');
  create type completeness  as enum ('full', 'partial', 'none');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1) PROFILES — ต่อ 1:1 กับ auth.users
-- ============================================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  character_name text,                         -- null = ยังไม่ตั้งชื่อ → เป็น new user
  avatar_config  jsonb   not null default '{}'::jsonb,
  total_stars    integer not null default 0,
  current_streak integer not null default 0,
  best_streak    integer not null default 0,
  last_active_date date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- สร้าง profile อัตโนมัติเมื่อมี user ใหม่ (ดึง full_name จาก metadata ตอนสมัคร)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2) DISCIPLINES — มุมมอง/ศาสตร์ความรู้ (seed คงที่ ผู้ใช้อ่านได้อย่างเดียว)
-- ============================================================================
create table if not exists public.disciplines (
  key      text primary key,                   -- 'embedded', 'iot', ...
  th       text not null,
  en       text not null,
  icon     text,
  phase    integer not null default 1,         -- เฟส 1 = IoT + Embedded
  is_active boolean not null default true
);

-- ============================================================================
-- 3) SCANS — รูปที่นักเรียนสแกน + ตำแหน่ง (สำหรับแผนที่ความทรงจำ)
-- ============================================================================
create table if not exists public.scans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  image_path    text,                          -- path ใน storage bucket 'scans'
  object_label  text,                          -- ผลจาก AI: ชื่อวัตถุ
  province      text,                          -- จังหวัดที่สแกน
  ai_confidence numeric(4,3),                  -- 0..1
  created_at    timestamptz not null default now()
);
create index if not exists scans_user_idx on public.scans(user_id, created_at desc);

-- % ความเชื่อมโยง วัตถุ ↔ ศาสตร์ พร้อม "เหตุผล" (ตอบข้อเสีย: อธิบายไม่ชัด)
create table if not exists public.scan_disciplines (
  scan_id         uuid not null references public.scans(id) on delete cascade,
  discipline_key  text not null references public.disciplines(key),
  relevance_pct   integer not null check (relevance_pct between 0 and 100),
  evidence        jsonb not null default '[]'::jsonb,   -- เหตุผลจาก AI
  primary key (scan_id, discipline_key)
);

-- ============================================================================
-- 4) SKILL TREE — สร้างต่อ (วัตถุ + ศาสตร์ + บริบท) ของผู้เรียนแต่ละคน
-- ============================================================================
create table if not exists public.skill_trees (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  scan_id        uuid references public.scans(id) on delete set null,
  discipline_key text not null references public.disciplines(key),
  object_label   text,
  context_level  text,                         -- 'home' | 'automation' | 'industrial'
  status         tree_status not null default 'active',
  created_at     timestamptz not null default now()
);
create index if not exists skill_trees_user_idx on public.skill_trees(user_id);

create table if not exists public.skill_nodes (
  id          uuid primary key default gen_random_uuid(),
  tree_id     uuid not null references public.skill_trees(id) on delete cascade,
  parent_id   uuid references public.skill_nodes(id) on delete set null,
  tier        text not null,                   -- 'T0'..'T4'
  title_th    text not null,
  content     jsonb not null default '{}'::jsonb,
  status      node_status not null default 'locked',
  is_remedial boolean not null default false,  -- โหนดเสริมที่ AI สร้างหลังตอบไม่ครบ
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists skill_nodes_tree_idx on public.skill_nodes(tree_id);

-- ============================================================================
-- 5) ASSESSMENT — evidence packet (simulation) + AI rubric (open-ended)
-- ============================================================================
create table if not exists public.node_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  node_id        uuid references public.skill_nodes(id) on delete set null,
  evidence_packet jsonb not null default '{}'::jsonb,   -- จาก simEngine
  quiz_accuracy  integer,                       -- /60 ตามสูตร proposal
  level_score    integer,                       -- /100
  band           text,                          -- 'fast' | 'normal' | 'slow' | 'review'
  created_at     timestamptz not null default now()
);
create index if not exists node_attempts_user_idx on public.node_attempts(user_id, created_at desc);

create table if not exists public.assessments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  node_id        uuid references public.skill_nodes(id) on delete set null,
  question       text not null,
  student_answer text,
  completeness   completeness,                  -- AI ตัดสินความเข้าใจ (ไม่ใช่ keyword)
  ai_score       numeric(5,2),
  ai_feedback    text,
  rubric         jsonb not null default '{}'::jsonb,  -- คะแนนต่อเกณฑ์มโนทัศน์
  misconceptions jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists assessments_user_idx on public.assessments(user_id, created_at desc);

-- ============================================================================
-- 6) STARS — server-authoritative ledger (client เขียนตรงไม่ได้)
-- ============================================================================
create table if not exists public.star_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  delta      integer not null,
  reason     text not null,                     -- 'quiz' | 'boss_bonus' | 'streak' | 'shop'
  combo_mult numeric(3,1),
  created_at timestamptz not null default now()
);
create index if not exists star_ledger_user_idx on public.star_ledger(user_id, created_at desc);

create table if not exists public.daily_activity (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  nodes_done   integer not null default 0,
  primary key (user_id, activity_date)
);

-- ============================================================================
-- 7) MAP — พินความทรงจำต่อจังหวัด
-- ============================================================================
create table if not exists public.map_pins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  scan_id    uuid references public.scans(id) on delete cascade,
  province   text not null,
  created_at timestamptz not null default now()
);
create index if not exists map_pins_user_idx on public.map_pins(user_id, province);

-- ============================================================================
-- 8) CONTENT LIBRARY — template ที่ผู้พัฒนาอนุมัติ (AI ต้อง gen ในกรอบนี้)
-- ============================================================================
create table if not exists public.content_library (
  id             uuid primary key default gen_random_uuid(),
  discipline_key text not null references public.disciplines(key),
  node_template  jsonb not null,
  approved       boolean not null default false,
  approved_by    uuid references auth.users(id),
  approved_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- ============================================================================
-- 9) SHOP & INVENTORY
-- ============================================================================
create table if not exists public.shop_items (
  id        text primary key,                   -- 'glasses', 'hat_pump', ...
  name_th   text not null,
  slot      text not null,                      -- 'hat' | 'glasses' | 'shirt' | ...
  price     integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.inventory (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item_id     text not null references public.shop_items(id),
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.disciplines      enable row level security;
alter table public.scans            enable row level security;
alter table public.scan_disciplines enable row level security;
alter table public.skill_trees      enable row level security;
alter table public.skill_nodes      enable row level security;
alter table public.node_attempts    enable row level security;
alter table public.assessments      enable row level security;
alter table public.star_ledger      enable row level security;
alter table public.daily_activity   enable row level security;
alter table public.map_pins         enable row level security;
alter table public.content_library  enable row level security;
alter table public.shop_items       enable row level security;
alter table public.inventory        enable row level security;

-- profiles: เจ้าของอ่าน/แก้ได้
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ตารางอ่านอย่างเดียวสำหรับทุกคนที่ล็อกอิน (catalog/seed)
create policy "read disciplines" on public.disciplines for select to authenticated using (true);
create policy "read shop"        on public.shop_items  for select to authenticated using (true);
create policy "read approved content"
  on public.content_library for select to authenticated using (approved = true);

-- scans + ลูก: เจ้าของจัดการได้
create policy "own scans"  on public.scans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own scan_disciplines" on public.scan_disciplines for select
  using (exists (select 1 from public.scans s where s.id = scan_id and s.user_id = auth.uid()));

create policy "own trees" on public.skill_trees for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own nodes" on public.skill_nodes for all
  using (exists (select 1 from public.skill_trees t where t.id = tree_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.skill_trees t where t.id = tree_id and t.user_id = auth.uid()));

-- attempts/assessments: เจ้าของ "อ่าน" ได้ ส่วนการเขียนปล่อยให้ Edge Function (service_role) ทำ
create policy "own attempts read"    on public.node_attempts for select using (auth.uid() = user_id);
create policy "own assessments read" on public.assessments   for select using (auth.uid() = user_id);

-- star_ledger / daily_activity: อ่านของตัวเองเท่านั้น (เขียนผ่าน server)
create policy "own stars read"    on public.star_ledger    for select using (auth.uid() = user_id);
create policy "own activity read" on public.daily_activity for select using (auth.uid() = user_id);

-- map pins + inventory: เจ้าของจัดการได้
create policy "own pins"      on public.map_pins  for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own inventory" on public.inventory for select using (auth.uid() = user_id);

-- ============================================================================
-- SEED — disciplines เฟส 1
-- ============================================================================
insert into public.disciplines (key, th, en, icon, phase) values
  ('embedded', 'ระบบฝังตัว',   'Embedded System', 'hardware-chip-outline', 1),
  ('iot',      'สมาร์ทไอโอที',  'Smart IoT',       'wifi-outline',          1),
  ('software', 'การเขียนโค้ด',  'Software',         'code-slash-outline',    1)
on conflict (key) do nothing;
