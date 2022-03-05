package entities

import (
	"database/sql"
)

type Artist struct {
	Id          int
	Name        string
	ImageId     sql.NullInt64
	GenreName   string
	CountryName string
}

type Album struct {
	Id      int
	Name    string
	ImageId sql.NullInt64
	Artist  *Artist
}

type SearchResult struct {
	Query   string
	Artists *[]Artist
}

type ArtistRecommendations struct {
	Artist          *Artist
	SpotifyArtist   *SpotifyArtist
	Recommendations *[]Artist
}

type AlbumRecommendations struct {
	Artist          *Artist
	SpotifyArtist   *SpotifyArtist
	Recommendations *[]Album
}

type SpotifyTrack struct {
	Id            string
	Name          string
	PreviewUrl    string
	AlbumImageUrl string
}

type SpotifyArtist struct {
	Id        string
	TopTracks *[]SpotifyTrack
}

type Image struct {
	Data        []byte
	ContentType string
}
