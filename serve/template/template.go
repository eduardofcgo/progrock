package template

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"path/filepath"
)

type TemplateLoader struct {
	context           interface{}
	compiledTemplates map[string]*template.Template
}

type templateData struct {
	Data    interface{}
	Context interface{}
}

func withFuncs(templ *template.Template) *template.Template {
	marshal := func(data interface{}) template.JS {
		jsonBytes, err := json.Marshal(data)
		if err != nil {
			panic(err)
		}

		return template.JS(jsonBytes)
	}

	return templ.Funcs(template.FuncMap{
		"marshal": marshal,
	})
}

func compileTemplate(common *template.Template, templatePath string) (*template.Template, error) {
	templates, err := common.ParseFiles(templatePath)
	if err != nil {
		return nil, err
	}

	templateName := filepath.Base(templatePath)

	return templates.Lookup(templateName), nil
}

func Load(commonGlob string, templatesGlob string, context interface{}) (*TemplateLoader, error) {
	common, err := withFuncs(template.New("common")).ParseGlob(commonGlob)
	if err != nil {
		return nil, err
	}

	templatePaths, err := filepath.Glob(templatesGlob)
	if err != nil {
		return nil, err
	}

	loader := TemplateLoader{context: context, compiledTemplates: make(map[string]*template.Template)}

	for _, templatePath := range templatePaths {
		clonedCommon, err := common.Clone()
		if err != nil {
			return nil, err
		}

		template, err := compileTemplate(clonedCommon, templatePath)
		if err != nil {
			return nil, err
		}

		templateName := filepath.Base(templatePath)
		loader.compiledTemplates[templateName] = template
	}

	return &loader, nil
}

func (loader *TemplateLoader) wrapContext(data interface{}) *templateData {
	return &templateData{Data: data, Context: loader.context}
}

func (loader *TemplateLoader) Lookup(templateName string) *template.Template {
	return loader.compiledTemplates[templateName]
}

func (loader *TemplateLoader) Execute(wr io.Writer, templateName string, data interface{}) error {
	templ := loader.Lookup(templateName)

	if templ == nil {
		return fmt.Errorf("Template %s not found", templateName)
	}

	return templ.Execute(wr, loader.wrapContext(data))
}
