create table if not exists user_accounts (
    id uuid primary key,
    username varchar(255) not null unique,
    password_hash varchar(255) not null,
    role varchar(30) not null,
    enabled boolean not null default true,
    must_change_password boolean not null default true,
    created_at timestamp
);
