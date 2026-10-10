create table if not exists password_reset_token (
    id uuid primary key,
    user_id uuid not null references user_accounts(id),
    code_hash varchar(255) not null,
    expires_at timestamp not null,
    used boolean not null default false,
    created_at timestamp not null
);
create index if not exists idx_password_reset_user on password_reset_token(user_id, created_at);
