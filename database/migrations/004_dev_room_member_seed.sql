-- 開発用メンバー

insert into room_members (room_id, user_id)
values (
  (select id from rooms where name = 'general'),
  '00000000-0000-0000-0000-000000000000'
);
