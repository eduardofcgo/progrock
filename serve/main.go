package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
	_ "github.com/mattn/go-sqlite3"

	"progrock.app/config"
	"progrock.app/queries"
	"progrock.app/routes"
	"progrock.app/template"
)

func main() {
	configPath := os.Getenv("config")

	cnfig, err := config.Load(configPath)
	if err != nil {
		log.Fatal(err)
	}

	if cnfig.Sentry {
		err = sentry.Init(sentry.ClientOptions{
			Dsn:     cnfig.SentryDsn,
			Release: cnfig.Release,
		})
		if err != nil {
			log.Fatalf("sentry.Init: %s", err)
		}

		defer sentry.Flush(2 * time.Second)
	}

	databaseURI := fmt.Sprintf("file:%s?cache=shared&mode=ro", cnfig.DatabasePath)
	db, err := sql.Open("sqlite3", databaseURI)
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()

	context := struct {
		Config *config.Config
	}{
		cnfig,
	}

	commonTemplatesGlob := "../templates/common/*.html"
	pageTemplates, err := template.Load(commonTemplatesGlob, "../templates/pages/*.html", context)
	if err != nil {
		log.Fatal(err)
	}
	cardTemplates, err := template.Load(commonTemplatesGlob, "../templates/cards/*.html", context)
	if err != nil {
		log.Fatal(err)
	}

	app := routes.App{
		PageTemplates: pageTemplates,
		CardTemplates: cardTemplates,
		Database:      &queries.Database{SqlDb: db},
	}

	mux := http.NewServeMux()
	app.SetUpRoutes(mux)

	fs := http.FileServer(http.Dir("../static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	server := &http.Server{
		Addr:         cnfig.Address,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Println("Listening...")

	log.Fatal(server.ListenAndServe())
}
