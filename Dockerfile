FROM golang:1.13 AS build
COPY serve/ /
RUN CGO_ENABLED=1 && GOOS=linux && go build -a -ldflags '-linkmode external -extldflags "-static"' -o /serve --tags "fts5" /main.go

FROM alpine:3.5 AS data
RUN apk add -U unzip && rm -rf /var/cache/apk/*
COPY data/zip/progrock/ /
RUN cat progrock.z* > joined-progrock.zip && unzip -qq joined-progrock.zip; exit 0 && ls progrock.db

FROM scratch AS bin
COPY --from=data /progrock.db /data/
COPY --from=build /serve /serve/
COPY templates/ /templates/ 
COPY static/ /static/
COPY config/ /config/
EXPOSE 8080
WORKDIR /serve
ENV config "/config/prod.json"
CMD ["./serve"]
