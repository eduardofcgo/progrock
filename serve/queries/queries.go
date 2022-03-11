package queries

import (
	"database/sql"
	"fmt"

	"progrock.app/entities"
)

type Database struct {
	SqlDb *sql.DB
}

func (db *Database) GetImage(imageId int) (*entities.Image, error) {
	row := db.SqlDb.QueryRow(`
        select thumbnail, content_type from thumbnail
        where image_id = (?)
   `, imageId)

	var image entities.Image
	err := row.Scan(&image.Data, &image.ContentType)

	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	return &image, nil
}

func (db *Database) GetArtist(artistId int) (*entities.Artist, error) {
	row := db.SqlDb.QueryRow(`
	    select artist.id, artist.name, artist.image_id, genre.name from artist
	    left join genre on genre.id = artist.genre_id
	    where artist.id = (?)
	`, artistId)

	var artist entities.Artist
	err := row.Scan(&artist.Id, &artist.Name, &artist.ImageId, &artist.GenreName)

	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	return &artist, nil
}

func (db *Database) getSpotifyArtist(artistId int) (*entities.SpotifyArtist, error) {
	rows, err := db.SqlDb.Query(`
        select
		    spotify_artist_id,
		    track_id,
		    track_name,
		    track_preview_url,
		    track_image_url
        from matched_artist_top_track
        where artist_id = (?)
        order by track_popularity desc
        limit 10
   `, artistId)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	spotifyArtist := entities.SpotifyArtist{}
	topTracks := []entities.SpotifyTrack{}

	for rows.Next() {
		var topTrack entities.SpotifyTrack

		var trackId sql.NullString
		var trackName sql.NullString
		var trackPreviewUrl sql.NullString
		var trackAlbumImageUrl sql.NullString

		err := rows.Scan(&spotifyArtist.Id, &trackId, &trackName, &trackPreviewUrl, &trackAlbumImageUrl)
		if err != nil {
			return nil, err
		}

		if trackId.Valid && trackPreviewUrl.Valid {
			topTrack.Id = trackId.String
			topTrack.Name = trackName.String
			topTrack.PreviewUrl = trackPreviewUrl.String
			topTrack.AlbumImageUrl = trackAlbumImageUrl.String

			topTracks = append(topTracks, topTrack)
		}
	}

	if len(topTracks) == 0 {
		return nil, nil
	}

	spotifyArtist.TopTracks = &topTracks

	return &spotifyArtist, nil
}

func (db *Database) RecommendAlbums(artistId int) (*entities.AlbumRecommendations, error) {
	rows, err := db.SqlDb.Query(`
        select
        	matching_artist_id,
        	matching_artist_name,
        	matching_artist_image_id,
        	matching_artist_country_name,
        	matching_artist_genre_name,

            album_id,
            album_name,
            album_image_id,
            artist_id,
            artist_name
        from artist_album_similarity
        where matching_artist_id = (?)
        order by score desc
        limit 100;
    `, artistId)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	recommendations := entities.AlbumRecommendations{}

	albums := []entities.Album{}
	artist := entities.Artist{}

	count := 0

	for rows.Next() {
		count += 1

		var album entities.Album
		var albumArtist entities.Artist

		var albumId sql.NullInt64
		var albumName sql.NullString
		var imageId sql.NullInt64
		var artistId sql.NullInt64
		var artistName sql.NullString

		err := rows.Scan(
			&artist.Id,
			&artist.Name,
			&artist.ImageId,
			&artist.CountryName,
			&artist.GenreName,
			&albumId,
			&albumName,
			&imageId,
			&artistId,
			&artistName,
		)

		if err != nil {
			return nil, err
		}

		if albumId.Valid {
			album.Id = int(albumId.Int64)
			album.Name = albumName.String
			album.ImageId = imageId
			albumArtist.Id = int(artistId.Int64)
			albumArtist.Name = artistName.String

			album.Artist = &albumArtist
			albums = append(albums, album)
		}
	}

	if count == 0 {
		return nil, nil
	}

	recommendations.Artist = &artist
	recommendations.Recommendations = &albums

	spotifyArtist, err := db.getSpotifyArtist(artistId)
	if err != nil {
		return nil, err
	}

	recommendations.SpotifyArtist = spotifyArtist

	return &recommendations, nil
}

func (db *Database) RecommendArtists(artistId int) (*entities.ArtistRecommendations, error) {
	rows, err := db.SqlDb.Query(`
        select
        	matching_artist_id,
        	matching_artist_name,
        	matching_artist_image_id,
        	matching_artist_country_name,
        	matching_artist_genre_name,

            artist_id,
            artist_name,
            artist_genre_name,
            artist_country_name,
            artist_image_id
        from artist_album_similarity
        where matching_artist_id = (?)
        group by artist_id
        order by sum(score) desc
        limit 40;
    `, artistId)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	recommendations := entities.ArtistRecommendations{}
	artists := []entities.Artist{}
	artist := entities.Artist{}

	count := 0

	for rows.Next() {
		count += 1

		var id sql.NullInt64
		var name sql.NullString
		var genreName sql.NullString
		var countryName sql.NullString
		var imageId sql.NullInt64

		var recommendation entities.Artist

		err := rows.Scan(
			&artist.Id,
			&artist.Name,
			&artist.ImageId,
			&artist.CountryName,
			&artist.GenreName,
			&id,
			&name,
			&genreName,
			&countryName,
			&imageId,
		)

		if err != nil {
			return nil, err
		}

		if id.Valid {
			recommendation.Id = int(id.Int64)
			recommendation.Name = name.String
			recommendation.GenreName = genreName.String
			recommendation.CountryName = countryName.String
			recommendation.ImageId = imageId

			artists = append(artists, recommendation)
		}

	}

	if count == 0 {
		return nil, nil
	}

	recommendations.Artist = &artist
	recommendations.Recommendations = &artists

	spotifyArtist, err := db.getSpotifyArtist(artistId)
	if err != nil {
		return nil, err
	}

	recommendations.SpotifyArtist = spotifyArtist

	return &recommendations, nil
}

func (db *Database) SearchArtist(query string) (*entities.SearchResult, error) {
	ftsQuery := fmt.Sprintf(`"%s"*`, query)
	rows, err := db.SqlDb.Query(`
    	select artist.id, artist.name, genre.name, country.name, artist.image_id
    	from artist_fts
    	left join artist on artist_fts.id = artist.id
    	left join country on artist.country_id = country.id
    	left join genre on artist.genre_id = genre.id
    	where artist_fts.content match (?) order by artist_fts.rank desc
    	limit 5;
    `, ftsQuery)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	artists := []entities.Artist{}

	for rows.Next() {
		var artist entities.Artist
		err = rows.Scan(
			&artist.Id,
			&artist.Name,
			&artist.GenreName,
			&artist.CountryName,
			&artist.ImageId,
		)
		if err != nil {
			return nil, err
		}

		artists = append(artists, artist)
	}

	searchResult := entities.SearchResult{
		Query:   query,
		Artists: &artists,
	}

	return &searchResult, nil
}
