FROM golang:1.13 AS build
COPY serve/ /
RUN CGO_ENABLED=1 && GOOS=linux && go build -a -ldflags '-linkmode external -extldflags "-static"' -o /serve --tags "fts5" /main.go

FROM scratch as bin
COPY data/progrock.db /data/
COPY --from=build /serve /serve/
COPY templates/ /templates/ 
COPY static/ /static/
EXPOSE 8080
WORKDIR /serve
ENV config "/config/prod.json"
CMD ["./serve"]
