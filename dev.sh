#!/bin/sh

cd serve

export config="../config/dev.json"
find . -name '*.go' -o -name '*.html' | entr -r go run -tags "fts5" main.go
