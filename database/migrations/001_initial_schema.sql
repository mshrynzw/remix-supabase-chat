-- =========================================================
-- Supabase Discord型チャットDB
-- users / rooms / room_members / messages
-- Row Level Security + Realtime 対応
-- =========================================================


-- =========================================================
-- 1. UUID拡張
-- Supabaseでは通常有効だが念のため
-- =========================================================
create extension if not exists "uuid-ossp";


-- =========================================================
-- 2. users テーブル
-- Supabase Auth のユーザーと紐付ける
-- =========================================================
create table public.users (
  -- auth.users のIDと一致
  id uuid primary key references auth.users(id) on delete cascade,

  -- 表示名
  username text not null,

  -- アバター画像URL
  avatar_url text,

  -- 作成日時
  created_at timestamp with time zone default now()
);


-- =========================================================
-- 3. rooms テーブル
-- チャットルーム
-- =========================================================
create table public.rooms (

  -- ルームID
  id uuid primary key default uuid_generate_v4(),

  -- ルーム名
  name text not null,

  -- 作成日時
  created_at timestamp with time zone default now()
);


-- =========================================================
-- 4. room_members テーブル
-- ユーザーとルームの中間テーブル
-- many-to-many関係
-- =========================================================
create table public.room_members (

  -- ID
  id uuid primary key default uuid_generate_v4(),

  -- ルームID
  room_id uuid references rooms(id) on delete cascade,

  -- ユーザーID
  user_id uuid references users(id) on delete cascade,

  -- 参加日時
  created_at timestamp with time zone default now(),

  -- 同じユーザーが同じルームに2回入らないよう制約
  unique(room_id, user_id)
);


-- =========================================================
-- 5. messages テーブル
-- チャットメッセージ
-- =========================================================
create table public.messages (

  -- メッセージID
  id uuid primary key default uuid_generate_v4(),

  -- どのルームのメッセージか
  room_id uuid references rooms(id) on delete cascade,

  -- 送信者
  user_id uuid references users(id) on delete cascade,

  -- メッセージ本文
  content text not null,

  -- 送信日時
  created_at timestamp with time zone default now()
);


-- =========================================================
-- 6. index（パフォーマンス向上）
-- チャットはメッセージ取得が多い
-- =========================================================

-- ルームごとのメッセージ検索高速化
create index idx_messages_room_id
on messages(room_id);

-- 新しいメッセージ順
create index idx_messages_created_at
on messages(created_at desc);


-- =========================================================
-- 7. Realtime対応
-- Supabase Realtimeでメッセージを配信
-- =========================================================
alter publication supabase_realtime add table messages;


-- =========================================================
-- 8. Row Level Security 有効化
-- =========================================================
alter table users enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table messages enable row level security;


-- =========================================================
-- 9. users RLS
-- =========================================================

-- 全ユーザーのプロフィール閲覧OK
create policy "Users can view profiles"
on users
for select
using (true);

-- 自分のプロフィールのみ更新可能
create policy "Users can update own profile"
on users
for update
using (auth.uid() = id);


-- =========================================================
-- 10. rooms RLS
-- =========================================================

-- 参加しているルームのみ閲覧可能
create policy "Users can view rooms they belong to"
on rooms
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = rooms.id
    and room_members.user_id = auth.uid()
  )
);


-- =========================================================
-- 11. room_members RLS
-- =========================================================

-- 自分が属しているメンバー情報のみ取得
create policy "Users can see their room memberships"
on room_members
for select
using (
  user_id = auth.uid()
);


-- =========================================================
-- 12. messages RLS
-- =========================================================

-- ルームメンバーのみメッセージ閲覧
create policy "Users can read messages in their rooms"
on messages
for select
using (
  exists (
    select 1
    from room_members
    where room_members.room_id = messages.room_id
    and room_members.user_id = auth.uid()
  )
);


-- =========================================================
-- 13. メッセージ送信
-- =========================================================

-- ルームメンバーのみ送信可能
create policy "Users can send messages"
on messages
for insert
with check (
  exists (
    select 1
    from room_members
    where room_members.room_id = messages.room_id
    and room_members.user_id = auth.uid()
  )
);
