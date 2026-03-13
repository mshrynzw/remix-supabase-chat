-- DEV ONLY
-- messages を自由に読み書き

create policy "Allow insert messages"
on messages
for insert
with check (true);

create policy "Allow read messages"
on messages
for select
using (true);
