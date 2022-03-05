
drop table if exists artist_fts;
create virtual table artist_fts using fts5(id, content);
insert into artist_fts select id, name from artist;

drop table if exists review_fts;
create virtual table review_fts using fts5(id, content);
insert into review_fts select id, content from review;

drop table if exists album_track_fts;
create virtual table album_track_fts using fts5(id, content);
insert into album_track_fts select id, tracks from album;

drop table if exists album_credits_fts;
create virtual table album_credits_fts using fts5(id, content);
insert into album_credits_fts select id, credits from album;

drop table if exists album_info_fts;
create virtual table album_info_fts using fts5(id, content);
insert into album_info_fts select id, info from album;

drop table if exists album_name_fts;
create virtual table album_name_fts using fts5(id, content);
insert into album_name_fts select id, name from album;

drop index if exists idx_review_album_id;
create index idx_review_album_id on review(album_id);

drop index if exists idx_album_artist_id;
create index idx_album_artist_id on album(artist_id);

drop view if exists artist_mentions_artist;
create view artist_mentions_artist as
    select
        match_artist.id as matching_artist_id,
        artist_fts.id as artist_id
    from artist_fts, artist match_artist
    where artist_fts.content match generate_artist_search_query(match_artist.name);

drop view if exists artist_albums_mentions_artist;
create view artist_albums_mentions_artist as
    select
        match_artist.id as matching_artist_id,
        artist.id as artist_id
    from album_name_fts, artist match_artist
    left join album on album.id = album_name_fts.id
    left join artist on artist.id = album.artist_id
    where album_name_fts.content match generate_artist_search_query(match_artist.name)
    group by match_artist.id, artist.id;

drop view if exists album_nreviews;
create view album_nreviews as
    select
        review.album_id,
        count(review.album_id) as nreviews
    from review
    group by review.album_id;

drop view if exists album_nmatches;
create view album_nmatches as
    select
        artist.id as artist_id,
        review.album_id,
        count(review.album_id) as nmatches
    from review_fts, artist
    left join review on review.id = review_fts.id
    left join album on album.id = review.album_id
    where review_fts.content match generate_artist_search_query(artist.name)
    group by artist.id, review.album_id;

drop view if exists album_tracks_mentions_artist;
create view album_tracks_mentions_artist as
    select
        artist.id as artist_id,
        album_track_fts.id as album_id
    from album_track_fts, artist
    where album_track_fts.content match generate_artist_search_query(artist.name);

drop view if exists album_credits_mentions_artist;
create view album_credits_mentions_artist as
    select
        artist.id as artist_id,
        album_credits_fts.id as album_id
    from album_credits_fts, artist
    where album_credits_fts.content match generate_artist_search_query(artist.name);

drop view if exists album_info_mentions_artist;
create view album_info_mentions_artist as
    select
        artist.id as artist_id,
        album_info_fts.id as album_id
    from album_info_fts, artist
    where album_info_fts.content match generate_artist_search_query(artist.name);

drop table if exists banned_artist;
create table banned_artist (
    artist_id int primary key,
    foreign key(artist_id) references artist(id)
);
insert into banned_artist (artist_id) values
    (2633), (2634), (2635);

drop view if exists album_score;
create view album_score as
select
    album_nmatches.artist_id,
    album_nmatches.album_id,
    calculate_score(nmatches, nreviews) as score
from album_nmatches
left join album_nreviews on album_nmatches.album_id = album_nreviews.album_id
where
    nmatches > 0 and
    1.0 * nmatches / nreviews > 0.4; --TODO: is this really good?

drop view if exists curated_album_score;
create view curated_album_score as
    select * from album_score
    left join album on album.id = album_score.album_id
    left join artist on artist.id = album.artist_id
    left join banned_artist on banned_artist.artist_id = artist.id
    left join album_info_mentions_artist on
        album_info_mentions_artist.artist_id = album_score.artist_id and
        album_info_mentions_artist.album_id = album_score.album_id 
    left join album_tracks_mentions_artist on
        album_tracks_mentions_artist.artist_id = album_score.artist_id and
        album_tracks_mentions_artist.album_id = album_score.album_id 
    left join album_credits_mentions_artist on
        album_credits_mentions_artist.artist_id = album_score.artist_id and
        album_credits_mentions_artist.album_id = album_score.album_id
    left join artist_albums_mentions_artist on
        artist_albums_mentions_artist.matching_artist_id = album_score.artist_id and
        artist_albums_mentions_artist.artist_id = artist.id
    left join artist_mentions_artist on
        artist_mentions_artist.matching_artist_id = album_score.artist_id and
        artist_mentions_artist.artist_id = artist.id
    where
        artist.id != album_score.artist_id and
        banned_artist.artist_id is null and
        album_info_mentions_artist.album_id is null and
        album_tracks_mentions_artist.album_id is null and
        album_credits_mentions_artist.album_id is null and
        artist_albums_mentions_artist.artist_id is null and
        artist_mentions_artist.artist_id is null;


drop table if exists artist_album_similarity;
create table artist_album_similarity (
    matching_artist_id int not null,
    matching_artist_name string not null,
    matching_artist_image_id int,
    matching_artist_country_id int not null,
    matching_artist_country_name string not null,
    matching_artist_genre_id int not null,
    matching_artist_genre_name string not null,

    album_id int,
    album_name string,
    album_image_id int,
    album_genre_id int,
    album_genre_name string,

    artist_id int,
    artist_name string,
    artist_image_id int,
    artist_country_id int,
    artist_country_name string,
    artist_genre_id int,
    artist_genre_name string,

    score real,

    foreign key(matching_artist_id) references artist(id),
    foreign key(matching_artist_image_id) references image(id),
    foreign key(matching_artist_country_id) references country(id),
    foreign key(matching_artist_genre_id) references genre(id),

    foreign key(album_id) references album(id),
    foreign key(album_image_id) references image(id),
    foreign key(album_genre_id) references genre(id),

    foreign key(artist_id) references album(id),
    foreign key(artist_image_id) references image(id),
    foreign key(artist_country_id) references country(id),
    foreign key(artist_genre_id) references genre(id)
);
drop index if exists idx_artist_album_similarity;
create unique index idx_artist_album_similarity on artist_album_similarity(matching_artist_id, album_id);

insert into artist_album_similarity
    select
        matching_artist.id as matching_artist_id,
        matching_artist.name as matching_artist_name,
        matching_artist.image_id as matching_artist_image_id,
        matching_artist_country.id as matching_artist_country_id,
        matching_artist_country.name as matching_artist_country_name,
        matching_artist_genre.id as matching_artist_genre_id,
        matching_artist_genre.name as matching_artist_genre_name,

        album.id as album_id,
        album.name as album_name,
        album.image_id as album_image_id,
        album_genre.id as album_genre_id,
        album_genre.name as album_genre_name,

        artist.id as artist_id,
        artist.name as artist_name,
        artist.image_id as artist_image_id,
        country.id as artist_country_id,
        country.name as artist_country_name,
        genre.id as artist_genre_id,
        genre.name as artist_genre_name,

        curated_album_score.score as score

    from artist matching_artist

    left join curated_album_score on curated_album_score.artist_id = matching_artist.id
    left join country matching_artist_country on matching_artist_country.id = matching_artist.country_id
    left join genre matching_artist_genre on matching_artist_genre.id = matching_artist.genre_id

    left join album on album.id = curated_album_score.album_id
    left join genre album_genre on album_genre.id = album.genre_id
    
    left join artist on artist.id = album.artist_id
    left join country on country.id = artist.country_id
    left join genre on genre.id = album.genre_id;

drop index if exists idx_artist_album_similarity;
create index idx_artist_album_similarity on artist_album_similarity(matching_artist_id, score desc);

vacuum;
