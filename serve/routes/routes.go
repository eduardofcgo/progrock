package routes

import (
	"net/http"

	"progrock.app/queries"
	"progrock.app/template"
)

type App struct {
	PageTemplates *template.TemplateLoader
	CardTemplates *template.TemplateLoader

	Database *queries.Database
}

func (app *App) SetUpRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/", app.HomeHandler)
	mux.HandleFunc("/about", app.AboutHandler)
	mux.HandleFunc("/signin", app.SigninHandler)
	mux.HandleFunc("/me", app.ProfileHandler)
	mux.HandleFunc("/suggest", app.SuggestHandler)
	mux.HandleFunc("/artists", app.ArtistHandler)
	mux.HandleFunc("/albums", app.ArtistAlbunsHandler)
	mux.HandleFunc("/image", app.ImageHandler)
	mux.HandleFunc("/search", app.SearchHandler)

	mux.HandleFunc("/card/bookmark", app.BookmarkCardHandler)
	mux.HandleFunc("/card/suggest/search", app.SuggestSearchCardHandler)
	mux.HandleFunc("/card/suggest/suggested", app.SuggestedCardHandler)
	mux.HandleFunc("/card/recommendations/suggested", app.SuggestedRecommendationsHandler)
}
