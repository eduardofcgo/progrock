package routes

import (
	"net/http"
	"strconv"
)

func (app *App) BookmarkCardHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	formArtistId := r.FormValue("id")
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
		err = app.CardTemplates.Execute(w, "bookmark.html", &artist)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			panic(err)
		}
	}
}

func (app *App) FavoriteCardHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	formArtistId := r.FormValue("id")
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
		err = app.CardTemplates.Execute(w, "favorite.html", &artist)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			panic(err)
		}
	}
}

func (app *App) SuggestSearchCardHandler(w http.ResponseWriter, r *http.Request) {
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

	err = app.CardTemplates.Execute(w, "suggest_search.html", searchResults)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		panic(err)
	}
}

func (app *App) SuggestedCardHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	formArtistId := r.FormValue("id")
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
		err = app.CardTemplates.Execute(w, "suggested.html", &artist)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			panic(err)
		}
	}
}

func (app *App) SuggestedRecommendationsHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	formArtistId := r.FormValue("id")
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
		err = app.CardTemplates.Execute(w, "recommendations_suggested.html", &artist)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			panic(err)
		}
	}
}
