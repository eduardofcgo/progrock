
drop table if exists spotify_image;
create table spotify_image(
	url string primary key,
	height int not null,
	width int not null
);

drop table if exists spotify_artist;
create table spotify_artist(
	id string primary key,
	href string not null,
	name string not null
);

drop table if exists spotify_album;
create table spotify_album(
	id string primary key,
	href string not null,
	name string not null,
	release_date string not null,
	artist_id int not null,
	foreign key(artist_id) references spotify_artist(id)
);

drop table if exists spotify_album_image;
create table spotify_album_image(
	spotify_image_url string primary key,
	spotify_album_id string not null,
	foreign key(spotify_album_id) references spotify_album(id),
	foreign key(spotify_image_url) references spotify_image(url)
);

drop table if exists spotify_genre;
create table spotify_genre(
	id integer primary key,
	name string not null
);
drop index if exists idx_spotify_genre_name;
create unique index idx_spotify_genre_name on genre(name);

drop table if exists spotify_prog_genre;
create table spotify_prog_genre(
	genre_id integer primary key,
	foreign key(genre_id) references spotify_genre(id)
);

drop table if exists spotify_artist_genre;
create table spotify_artist_genre(
	artist_id int not null,
	genre_id int not null,
	foreign key(artist_id) references spotify_artist(id),
	foreign key(genre_id) references spotify_genre(id)
);
drop index if exists idx_spotify_artist_genre;
create unique index idx_spotify_artist_genre on spotify_artist_genre(artist_id, genre_id);

drop table if exists spotify_result;
create table spotify_result(
	artist_id int not null,
	spotify_artist_id string not null,
	foreign key(artist_id) references artist(id),
	foreign key(spotify_artist_id) references spotify_artist(id)
);
drop index if exists idx_spotify_result;
create unique index idx_spotify_result on spotify_result(artist_id, spotify_artist_id);

drop table if exists spotify_track;
create table spotify_track(
	id string string primary key,
	album_id string not null,
	preview_url string not null,
	popularity int not null,
	name string not null,
	foreign key(album_id) references spotify_album(id)
);

drop table if exists spotify_top_track;
create table spotify_top_track(
	track_id string not null,
	artist_id string not null,
	foreign key(track_id) references spotify_track(id),
	foreign key(artist_id) references spotify_artist(id)
);
drop index if exists idx_spotify_top_track;
create unique index idx_spotify_top_track on spotify_top_track(track_id, artist_id);

drop index if exists idx_spotify_top_track_artist_id;
create index idx_spotify_top_track_artist_id on spotify_top_track(artist_id);
