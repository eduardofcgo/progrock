package routes

import (
	"net/http"
	"strconv"
)

func (app *App) HomeHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	err := app.PageTemplates.Execute(w, "index.html", nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) AboutHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	err := app.PageTemplates.Execute(w, "about.html", nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) SigninHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	err := app.PageTemplates.Execute(w, "signin.html", nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) ProfileHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	err := app.PageTemplates.Execute(w, "profile.html", nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) RecommendationsForYouHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	err := app.PageTemplates.Execute(w, "me.html", nil)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) SuggestHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var formArtistId string = r.FormValue("id")
	artistId, err := strconv.Atoi(formArtistId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	artist, err := app.Database.GetArtist(artistId)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		panic(err)
	} else if artist == nil {
		http.NotFound(w, r)
	} else {
		err = app.PageTemplates.Execute(w, "suggest.html", &artist)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			panic(err)
		}
	}
}

func (app *App) ArtistHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var formArtistId string = r.FormValue("id")
	artistId, err := strconv.Atoi(formArtistId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	recommendations, err := app.Database.RecommendArtists(artistId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}

	err = app.PageTemplates.Execute(w, "artists.html", &recommendations)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) ArtistAlbunsHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var formArtistId string = r.FormValue("id")
	artistId, err := strconv.Atoi(formArtistId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	recommendations, err := app.Database.RecommendAlbums(artistId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}

	err = app.PageTemplates.Execute(w, "albums.html", &recommendations)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) ImageHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var formImageId string = r.FormValue("id")
	imageId, err := strconv.Atoi(formImageId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	image, err := app.Database.GetImage(imageId)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		panic(err)
	} else if image == nil {
		http.NotFound(w, r)
	} else {
		w.Header().Set("Content-Type", image.ContentType)
		w.Write(image.Data)
	}
}

func (app *App) SearchHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	query := r.FormValue("query")

	defer r.Body.Close()

	searchResults, err := app.Database.SearchArtist(query)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}

	err = app.PageTemplates.Execute(w, "search.html", searchResults)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}
