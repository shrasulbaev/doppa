-- Грамматические уровни: правило и фразы вместо слов из словаря
alter table levels
  add column kind text not null default 'words' check (kind in ('words', 'phrases')),
  add column rule jsonb,
  add column items jsonb;
