drop table if exists spotify_album_fts;
create virtual table spotify_album_fts using fts5(id, content);
insert into spotify_album_fts select id, name from spotify_album;

drop view if exists spotify_matching_album;
create view spotify_matching_album as
    select
        artist.id as artist_id,
        album.id as album_id,
        album.artist_id as album_artist_id,
        spotify_album.id as spotify_album_id,
        spotify_album.artist_id as spotify_artist_id
    from spotify_album_fts, album
    left join spotify_album on spotify_album.id = spotify_album_fts.id
    left join spotify_result on spotify_result.spotify_artist_id = spotify_album.artist_id
    left join artist on artist.id = spotify_result.artist_id
    where
        artist.id = album.artist_id and
        album.year = strftime("%Y", spotify_album.release_date) and
        spotify_album_fts.content match generate_album_search_query(album.name);

drop view if exists spotify_match_album_score;
create view spotify_match_album_score as
    select
        artist_id,
        spotify_artist_id,
        count(spotify_artist_id) as score
    from spotify_matching_album
    group by artist_id, spotify_artist_id;

drop view if exists spotify_artist_progriness;
create view spotify_artist_progriness as
    select
        spotify_artist_genre.artist_id as spotify_artist_id,
        count(spotify_artist_genre.genre_id) as score
    from spotify_artist_genre
    inner join spotify_prog_genre on spotify_prog_genre.genre_id = spotify_artist_genre.genre_id
    group by spotify_artist_genre.artist_id;

drop table if exists artist_spotify_match_score;
create table artist_spotify_match_score(
    artist_id int not null,
    spotify_artist_id string,
    score real,
    foreign key(artist_id) references artist(id),
    foreign key(spotify_artist_id) references spotify_artist(id)
);

insert into artist_spotify_match_score
    select
        artist.id,
        spotify_match_album_score.spotify_artist_id,
        ifnull(spotify_match_album_score.score, 0) + ifnull(spotify_artist_progriness.score, 0) as score
    from artist
    left join spotify_match_album_score on spotify_match_album_score.artist_id = artist.id
    left join spotify_artist_progriness on
        spotify_artist_progriness.spotify_artist_id = spotify_match_album_score.spotify_artist_id;

drop index if exists idx_artist_spotify_match_score;
create index idx_artist_spotify_match_score on artist_spotify_match_score(artist_id, score desc);

drop table if exists matched_artist_top_track;
create table matched_artist_top_track(
    artist_id int not null,
    spotify_artist_id string not null,

    track_id string string,
    track_name string,
    track_preview_url string,
    track_image_url string,
    track_popularity int,

    foreign key(artist_id) references artist(id),
    foreign key(spotify_artist_id) references spotify_artist(id),
    foreign key(track_id) references spotify_track(id),
    foreign key(track_image_url) references spotify_image(url)
);

drop view if exists spotify_album_thumbnail;
create view spotify_album_thumbnail as 
    select
        spotify_album_image.spotify_album_id as album_id,
        spotify_album_image.spotify_image_url as url,
        spotify_image.height,
        spotify_image.width,
        min(spotify_image.height) as height
    from spotify_album_image
    inner join spotify_image on spotify_image.url = spotify_album_image.spotify_image_url
    group by spotify_album_image.spotify_album_id;

drop view if exists artist_spotify_matched;
create view artist_spotify_matched as
    select artist_id, spotify_artist_id, max(score) as score from artist_spotify_match_score
    group by artist_id;

insert into matched_artist_top_track
    select
        artist_spotify_matched.artist_id,
        artist_spotify_matched.spotify_artist_id,
        spotify_track.id as track_id,
        spotify_track.name as track_name,
        spotify_track.preview_url as track_preview_url,
        spotify_album_thumbnail.url as track_image_url,
        spotify_track.popularity as track_popularity
    from artist_spotify_matched
    left join spotify_top_track on
        spotify_top_track.artist_id = artist_spotify_matched.spotify_artist_id
    left join spotify_track on spotify_track.id = spotify_top_track.track_id
    left join spotify_album_thumbnail on spotify_album_thumbnail.album_id = spotify_track.album_id
    where artist_spotify_matched.spotify_artist_id is not null;

drop index if exists idx_matched_artist_top_track_artist;
create index idx_matched_artist_top_track_artist on matched_artist_top_track(artist_id, track_popularity desc);

drop view if exists artist_match_undecided;
create view artist_match_undecided as
    select
        artist_id,
        count(artist_id) as matched,
        max(score) - min(score) as score_delta
    from artist_spotify_match_score
    where score > 0
    group by artist_id
    having matched > 1
    order by score_delta desc;

drop view if exists artist_match_undecided_options;
create view artist_match_undecided_options as
    select
        artist_match_undecided.artist_id,
        artist_spotify_match_score.spotify_artist_id,
        artist_spotify_match_score.score
    from artist_match_undecided
    left join artist_spotify_match_score
    on artist_spotify_match_score.artist_id = artist_match_undecided.artist_id;

vacuum;
