#!/bin/sh

cd serve
find . -name '*.go' -o -name '*.html' | entr -r go run -tags "fts5" main.go ../config/dev.json
