package main

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

func isValidArticleURL(url string) bool {
	return strings.HasPrefix(url, "https://emilybites.com/") && strings.HasSuffix(url, ".html")
}

func fetchHTMLAndDoc(url string) (string, *goquery.Document, error) {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Accept-Encoding", "gzip")

	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	var reader io.Reader
	if resp.Header.Get("Content-Encoding") == "gzip" {
		reader, err = gzip.NewReader(resp.Body)
		if err != nil {
			return "", nil, err
		}
	} else {
		reader = resp.Body
	}

	htmlBytes, err := io.ReadAll(reader)
	if err != nil {
		return "", nil, err
	}
	html := string(htmlBytes)
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		return "", nil, err
	}

	return html, doc, nil
}

func extractWPRMRecipesFromScript(doc *goquery.Document) string {
	var result string

	doc.Find("script[type='rocketlazyloadscript']").Each(func(i int, s *goquery.Selection) {
		scriptText := s.Text()
		// 仅继续处理含关键字的 script
		if !strings.Contains(scriptText, "window.wprm_recipes") {
			return
		}

		// 用正则提取完整 JSON 字符串
		re := regexp.MustCompile(`window\.wprm_recipes\s*=\s*(\{.*\})`)
		matches := re.FindStringSubmatch(scriptText)
		if len(matches) >= 2 {
			raw := matches[1]

			var pretty bytes.Buffer
			err := json.Indent(&pretty, []byte(raw), "", "  ")
			if err != nil {
				log.Println("⚠️ JSON format error:", err)
				result = raw
			} else {
				result = pretty.String()
			}
		}
	})

	if result == "" {
		log.Println("⚠️ No wprm_recipes data found in any <script>")
	}
	return result
}

// Example function to generate a slug from a name
func generateSlug(name string) string {
	// Convert the name to a slug (e.g., "Chocolate Cake" -> "chocolate-cake")
	return strings.ToLower(strings.ReplaceAll(name, " ", "-"))
}

func recipeJSONToDB(recipeJSON string) error {
	// parse json
	var recipeData map[string]interface{}
	err := json.Unmarshal([]byte(recipeJSON), &recipeData)
	if err != nil {
		return err
	}

	// assuming the first key is the recipe ID
	for _, v := range recipeData {
		recipeMap, ok := v.(map[string]interface{})
		if !ok {
			continue
		}

		// extract fields
		name, _ := recipeMap["name"].(string)
		imageURL, _ := recipeMap["image_url"].(string)
		ingredients, _ := recipeMap["ingredients"].([]interface{})
		numberOfIngredients := len(ingredients)

		// Generate or extract slug
		slug, _ := recipeMap["slug"].(string)
		if slug == "" {
			slug = generateSlug(name) // Function to generate a slug from the name
		}

		// create Recipe object
		recipe := Recipe{
			Slug:                slug,
			Name:                name,
			ImageURL:            imageURL,
			NumberOfIngredients: numberOfIngredients,
		}

		// insert into database
		db, err := InitializeDB()
		if err != nil {
			return err
		}
		defer db.Close()

		exists, err := RecipeExists(db, recipe)
		if err != nil {
			return err
		}
		if exists {
			log.Printf("Recipe %s already exists in the database. Skipping insertion.\n", name)
			continue
		}

		// process ingredients
		for _, ingredient := range ingredients {
			if ingredientMap, ok := ingredient.(map[string]interface{}); ok {
				ingredientName, _ := ingredientMap["name"].(string)
				amount, _ := ingredientMap["amount"].(string)
				unit, _ := ingredientMap["unit"].(string)
				notes, _ := ingredientMap["notes"].(string)
				position, _ := ingredientMap["position"].(int)

				recipe.Ingredients = append(recipe.Ingredients, Ingredient{
					Name:     ingredientName,
					Amount:   amount,
					Unit:     unit,
					Notes:    notes,
					Position: position,
				})
			}
		}

		err = InsertRecipe(db, recipe)
		if err != nil {
			return err
		}

		break // exit after processing the first recipe
	}

	return nil
}

func scrapeData() {
	startDate := time.Date(2010, 12, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Now()
	currentPage := 0

	for date := startDate; date.Before(endDate); date = date.AddDate(0, 1, 0) {
		currentPage++
		// if currentPage > 5 {
		// 	break //
		// }

		year := date.Year()
		month := int(date.Month())
		url := fmt.Sprintf("https://emilybites.com/%d/%02d", year, month)
		fmt.Printf("Fetching: %s\n", url)

		_, doc, err := fetchHTMLAndDoc(url)
		if err != nil {
			log.Printf("Error fetching %s: %v\n", url, err)
			continue
		}

		// fileName := fmt.Sprintf("emilybites_%d_%02d.html", year, month)
		// err = os.WriteFile(fileName, []byte(html), 0644)
		// if err != nil {
		// 	log.Printf("Failed to save HTML for %s: %v\n", url, err)
		// } else {
		// 	fmt.Printf("Saved HTML to %s\n", fileName)
		// }

		doc.Find("div.item.archive-post a.block").Each(func(i int, s *goquery.Selection) {
			href, exists := s.Attr("href")
			if !exists || !isValidArticleURL(href) {
				return
			}

			title := s.Find("h3.title span.inline").Text()
			img := s.Find("img")
			imgSrc, _ := img.Attr("data-src")
			if imgSrc == "" {
				imgSrc, _ = img.Attr("src")
			}

			fmt.Println("Link:", href)
			fmt.Println("Image:", imgSrc)
			fmt.Println("Title:", title)
			fmt.Println(strings.Repeat("-", 40))

			// 立即访问该文章页面，尝试提取 JSON
			_, doc, err := fetchHTMLAndDoc(href)
			if err != nil {
				log.Printf("Error fetching %s: %v\n", href, err)
				return
			}

			recipeJSON := extractWPRMRecipesFromScript(doc)
			// fmt.Println("Extracted JSON:", recipeJSON)
			err = recipeJSONToDB(recipeJSON)
			if err != nil {
				log.Printf("Error saving recipe to DB: %v\n", err)
			}

			// wait user input
			// fmt.Println("Press Enter to continue...")
			// fmt.Scanln()
		})
	}
}
