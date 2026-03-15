-- 自分自身をルームに参加させる挿入を許可
create policy "Users can join rooms"
on room_members
for insert
with check (user_id = auth.uid());
