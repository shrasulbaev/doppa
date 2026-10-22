-- Doppa: контент курса и прогресс пользователей

-- Контент (читают все, меняют только через панель Supabase / seed)
create table words (
  id int primary key,
  topic text not null,
  ug text not null,
  arabic text,
  latin text,
  ru text not null,
  ru_short text not null,
  pos text,
  review_status text not null default 'не проверено',
  audio_file text
);

create table sections (
  id text primary key,
  position int not null,
  title text not null,
  city text not null
);

create table levels (
  id text primary key,
  section_id text not null references sections (id) on delete cascade,
  position int not null,
  title text not null,
  word_ids int[] not null
);

create table letters (
  position int primary key,
  upper text not null,
  arabic text not null,
  example_word_id int references words (id),
  is_uyghur boolean not null default false
);

create table stories (
  id text primary key,
  position int not null,
  title text not null,
  audience text not null,
  minutes int not null,
  art text not null,
  word_id int references words (id),
  paragraphs text[] not null,
  quiz jsonb not null default '[]'
);

-- Пользователи
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Друг',
  avatar text not null default 'raihan' check (avatar in ('alim', 'raihan')),
  xp int not null default 0,
  streak int not null default 0,
  last_active_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table level_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id text not null references levels (id) on delete cascade,
  stars int not null check (stars between 1 and 3),
  completed_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

create table story_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  story_id text not null references stories (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

-- Доступ
alter table words enable row level security;
alter table sections enable row level security;
alter table levels enable row level security;
alter table letters enable row level security;
alter table stories enable row level security;
alter table profiles enable row level security;
alter table level_progress enable row level security;
alter table story_progress enable row level security;

create policy "content is public" on words for select using (true);
create policy "content is public" on sections for select using (true);
create policy "content is public" on levels for select using (true);
create policy "content is public" on letters for select using (true);
create policy "content is public" on stories for select using (true);

create policy "own profile" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "own level progress" on level_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own story progress" on story_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Аудио носителей: публичное чтение, файлы называются как в словаре (ug_0001.mp3)
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
  on conflict (id) do nothing;
