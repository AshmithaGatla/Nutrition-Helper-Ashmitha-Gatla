// db.go
package main

import (
	"database/sql"
	"os"

	_ "github.com/lib/pq"
)

// InitializeDB initializes the database connection.
func InitializeDB() (*sql.DB, error) {
	connStr := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func InsertRecipeIngredient(db *sql.DB, recipeIngredient RecipeIngredient) error {
	query := `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, notes, position) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := db.Exec(query, recipeIngredient.RecipeID, recipeIngredient.IngredientID, recipeIngredient.Amount, recipeIngredient.Unit, recipeIngredient.Notes, recipeIngredient.Position)
	return err
}

// InsertRecipe inserts a new recipe into the database.
func InsertRecipe(db *sql.DB, recipe Recipe) error {
	query := `INSERT INTO recipes (slug, name, image_url, calories, number_of_ingredients) VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := db.QueryRow(query, recipe.Slug, recipe.Name, recipe.ImageURL, recipe.Calories, recipe.NumberOfIngredients).Scan(&recipe.ID)
	if err != nil {
		return err
	}

	for _, ingredient := range recipe.Ingredients {
		ingredientID, err := InsertIngredient(db, ingredient)
		if err != nil {
			return err
		}
		recipeIngredient := RecipeIngredient{
			RecipeID:     recipe.ID,
			IngredientID: ingredientID,
			Amount:       ingredient.Amount,
			Unit:         ingredient.Unit,
			Notes:        ingredient.Notes,
			Position:     ingredient.Position,
		}
		err = InsertRecipeIngredient(db, recipeIngredient)
		if err != nil {
			return err
		}
	}

	return nil
}

// InsertIngredient inserts a new ingredient into the database.
func InsertIngredient(db *sql.DB, ingredient Ingredient) (int, error) {
	query := `INSERT INTO ingredients (name, uid) VALUES ($1, $2) RETURNING id`
	var ingredientID int
	err := db.QueryRow(query, ingredient.Name, ingredient.UID).Scan(&ingredientID)
	return ingredientID, err
}

func RecipeExists(db *sql.DB, recipe Recipe) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM recipes WHERE name = $1)`
	err := db.QueryRow(query, recipe.Name).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
