package config

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

type Config struct {
	Address           string                 `json:"address"`
	DatabasePath      string                 `json:"databasePath"`
	SignInRedirectUrl string                 `json:"signInRedirectUrl"`
	Release           string                 `json:"release"`
	GoogleAnalytics   bool                   `json:"googleAnalytics"`
	Sentry            bool                   `json:"sentry"`
	SentryDsn         string                 `json:"sentryDsn"`
	Hotjar            bool                   `json:"hotjar"`
	Firebase          map[string]interface{} `json:"firebase"`
}

func Load(path string) (*Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	defer file.Close()

	fileBytes, _ := ioutil.ReadAll(file)

	var config Config
	err = json.Unmarshal(fileBytes, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
