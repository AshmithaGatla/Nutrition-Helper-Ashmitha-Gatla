package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq"
	"github.com/sashabaranov/go-openai"
)

type Ingredient struct {
	Name     string
	Amount   string
	Unit     string
	Notes    string
	Position int
}

type NutritionEstimate struct {
	Calories      int `json:"calories"`
	Protein       int `json:"protein"`
	Fat           int `json:"fat"`
	Carbohydrates int `json:"carbohydrates"`
}

func main() {
	connStr := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}
	defer db.Close()

	recipes, err := GetAllRecipes(db)
	if err != nil {
		log.Fatalf("Failed to get recipes: %v", err)
	}

	for _, recipe := range recipes {
		ingredients, err := GetIngredientsForRecipe(db, recipe.ID)
		if err != nil {
			log.Printf("Skipping recipe ID %d: %v", recipe.ID, err)
			continue
		}

		prompt := fmt.Sprintf(`Estimate the total nutrition for the following ingredients:

%s

Return only a JSON object with the following keys: "calories", "protein", "fat", "carbohydrates". 
Use these units: kcal for calories, grams for protein, fat, and carbohydrates. Use integers only. Do not include units in the keys or values.
`, formatIngredientsForPrompt(ingredients))

		resp, err := QueryModel(prompt)
		if err != nil {
			log.Printf("Model query failed for recipe ID %d: %v", recipe.ID, err)
			continue
		}

		var nutrition NutritionEstimate
		if err := json.Unmarshal([]byte(resp), &nutrition); err != nil {
			log.Printf("Invalid JSON response for recipe ID %d: %v\nRaw: %s", recipe.ID, err, resp)
			continue
		}

		err = UpsertNutrition(db, recipe.ID, nutrition)
		if err != nil {
			log.Printf("Failed to save nutrition for recipe ID %d: %v", recipe.ID, err)
			continue
		}

		fmt.Printf("Saved nutrition for \"%s\"\n", recipe.Name)
	}
}

func GetRecipeWithIngredients(db *sql.DB, recipeID int) (string, []Ingredient, error) {
	var recipeName string
	err := db.QueryRow(`SELECT name FROM recipes WHERE id = $1`, recipeID).Scan(&recipeName)
	if err != nil {
		return "", nil, err
	}

	query := `
	SELECT i.name, ri.amount, ri.unit, ri.notes, ri.position
	FROM recipe_ingredients ri
	JOIN ingredients i ON ri.ingredient_id = i.id
	WHERE ri.recipe_id = $1
	ORDER BY ri.position;
	`
	rows, err := db.Query(query, recipeID)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()

	var ingredients []Ingredient
	for rows.Next() {
		var ing Ingredient
		err := rows.Scan(&ing.Name, &ing.Amount, &ing.Unit, &ing.Notes, &ing.Position)
		if err != nil {
			return "", nil, err
		}
		ingredients = append(ingredients, ing)
	}
	return recipeName, ingredients, nil
}

func formatIngredientsForPrompt(ingredients []Ingredient) string {
	var sb strings.Builder
	for _, ing := range ingredients {
		line := fmt.Sprintf("- %s: %s %s", ing.Name, ing.Amount, ing.Unit)
		if ing.Notes != "" {
			line += fmt.Sprintf(" (%s)", ing.Notes)
		}
		sb.WriteString(line + "\n")
	}
	return sb.String()
}

func QueryModel(prompt string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("MODEL_BASE_URL") // e.g. "https://api.openai.com/v1" or "http://localhost:8000/v1"
	model := os.Getenv("MODEL_NAME")

	cfg := openai.DefaultConfig(apiKey)
	cfg.BaseURL = baseURL

	client := openai.NewClientWithConfig(cfg)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: model,
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleSystem, Content: "You are a nutritionist."},
				{Role: openai.ChatMessageRoleUser, Content: prompt},
			},
			ResponseFormat: &openai.ChatCompletionResponseFormat{Type: openai.ChatCompletionResponseFormatTypeJSONObject},
		},
	)
	if err != nil {
		return "", err
	}

	text := resp.Choices[0].Message.Content
	var pretty bytes.Buffer
	if err := json.Indent(&pretty, []byte(text), "", "  "); err != nil {
		// If not valid JSON, return raw text
		return text, nil
	}
	return pretty.String(), nil
}

type Recipe struct {
	ID   int
	Name string
}

func GetAllRecipes(db *sql.DB) ([]Recipe, error) {
	rows, err := db.Query(`SELECT id, name FROM recipes`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []Recipe
	for rows.Next() {
		var r Recipe
		if err := rows.Scan(&r.ID, &r.Name); err != nil {
			return nil, err
		}
		recipes = append(recipes, r)
	}
	return recipes, nil
}

func GetIngredientsForRecipe(db *sql.DB, recipeID int) ([]Ingredient, error) {
	query := `
	SELECT i.name, ri.amount, ri.unit, ri.notes, ri.position
	FROM recipe_ingredients ri
	JOIN ingredients i ON ri.ingredient_id = i.id
	WHERE ri.recipe_id = $1
	ORDER BY ri.position;
	`
	rows, err := db.Query(query, recipeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ingredients []Ingredient
	for rows.Next() {
		var ing Ingredient
		if err := rows.Scan(&ing.Name, &ing.Amount, &ing.Unit, &ing.Notes, &ing.Position); err != nil {
			return nil, err
		}
		ingredients = append(ingredients, ing)
	}
	return ingredients, nil
}

func UpsertNutrition(db *sql.DB, recipeID int, n NutritionEstimate) error {
	query := `
	INSERT INTO recipe_nutrition (recipe_id, calories, protein, fat, carbohydrates)
	VALUES ($1, $2, $3, $4, $5)
	ON CONFLICT (recipe_id) DO UPDATE SET
		calories = EXCLUDED.calories,
		protein = EXCLUDED.protein,
		fat = EXCLUDED.fat,
		carbohydrates = EXCLUDED.carbohydrates;
	`
	_, err := db.Exec(query, recipeID, n.Calories, n.Protein, n.Fat, n.Carbohydrates)
	return err
}
