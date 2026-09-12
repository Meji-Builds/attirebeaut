-- Enable UUID generation
create extension if not exists "pgcrypto";

create type category as enum ('ready_to_wear', 'fabric', 'accessory', 'traditional_wear');
create type size_option as enum ('S', 'M', 'L', 'XL');
create type the_role as enum ('admin', 'buyer');

-- USERS

create table users(
    id              uuid primary key references auth.users(id),
    role            the_role not null
);

-- PRODUCTS

create table products (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    description     text not null,
    price           numeric(10,2) not null,
    image_url       text not null,
    type            category not null,
    is_custom       boolean not null default false,
    delivery_fee    numeric(10,2),
    lead_time_weeks int,
    created_at      timestamptz not null default now()
);


-- PRODUCT_VARIANTS
create table product_variants (
    id              uuid primary key default gen_random_uuid(),
    product_id      uuid references products(id),
    price           numeric(10,2) null,
    size            smallint check(size > 0),
    length          numeric(10,2),
    stock           int not null,

    check(
        (size is not null and length is null) or (size is null and length is not null)
    )
);

create type order_stat as enum ('pending', 'paid', 'shipped', 'delivered');

-- ORDERS
create table orders (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid references users(id),
    address_street      text not null,
    address_city        text not null,
    address_postcode    text not null,
    status              order_stat not null,
    total               numeric(10,2) not null,
    delivery_fee        numeric(10,2) not null,
    placed_at           timestamptz not null default now()  

);


-- ORDER_ITEMS
create table order_items (
    id                      uuid primary key default gen_random_uuid(),
    order_id                 uuid references orders(id),
    product_variant_id      uuid references product_variants(id),
    quantity                int check (quantity > 0) not null,
    price                   numeric(10,2) not null            
);