create table if not exists genre (
    id integer primary key autoincrement,
    name string not null unique
);
create unique index if not exists
idx_genre_name on genre(name);

create table if not exists country (
    id integer primary key autoincrement,
    name string not null unique
);
create unique index if not exists
idx_country_name on country(name);

create table if not exists image (
    id integer primary key autoincrement,
    url text not null unique,
    image blob not null,
    content_type string not null
);
create unique index if not exists
idx_image_url on image(url);

create table if not exists artist (
    id integer primary key,
    name string not null,
    bio string,
    image_id int,
    genre_id int not null,
    country_id int not null,
    foreign key(image_id) references image(id),
    foreign key(genre_id) references genre(id),
    foreign key(country_id) references country(id)
);
-- TODO: create index for country id
-- TODO: create index for genre_id

create table if not exists album (
    id int primary key,
    name string not null,
    year int not null,
    realese string not null,
    info string,
    tracks string,
    credits string,
    image_id int,
    artist_id int not null,
    genre_id int not null,
    foreign key(image_id) references image(id),
    foreign key(artist_id) references artist(id),
    foreign key(genre_id) references genre(id)
);
-- TODO: create index for artist id

create table if not exists user (
    id string primary key
);

create table if not exists rating (
    id integer primary key autoincrement,
    number int not null,
    user_id int not null,
    album_id int not null,
    stars int not null,
    foreign key(user_id) references user(id),
    foreign key(album_id) references album(id)
);
create unique index if not exists
idx_rating_user_album on rating(user_id, album_id);

create table if not exists review (
    id integer primary key autoincrement,
    created text not null,
    user_id int not null,
    album_id int not null,
    stars int not null,
    content string,
    foreign key(user_id) references user(id),
    foreign key(album_id) references album(id)
);
create unique index if not exists
idx_review_user_album on review(user_id, album_id);
