-- 新規登録時に自分のプロフィール行を挿入できるようにする
create policy "Users can insert own profile"
on users
for insert
with check (auth.uid() = id);
