-- ======================================================
-- 002_rooms_read_policy.sql
-- Allow public read access to rooms (development)
-- ======================================================

create policy "Allow read rooms"
on rooms
for select
using (true);
