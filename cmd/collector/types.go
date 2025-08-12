// types.go
package main

// Recipe represents a recipe with its details and associated ingredients.
type Recipe struct {
	ID                  int          `db:"id"`
	Slug                string       `db:"slug"`
	Name                string       `db:"name"`
	ImageURL            string       `db:"image_url"`
	Calories            float64      `db:"calories"`
	NumberOfIngredients int          `db:"number_of_ingredients"`
	Ingredients         []Ingredient // Associated ingredients
}

// Ingredient represents an ingredient of a recipe.
type Ingredient struct {
	ID       int    `db:"id"`
	UID      int    `db:"uid"`
	Name     string `db:"name"`
	Amount   string `db:"amount"`
	Unit     string `db:"unit"`
	Notes    string `db:"notes"`
	Position int    `db:"position"`
}

// RecipeIngredient represents the association between a recipe and its ingredients.
type RecipeIngredient struct {
	ID           int    `db:"id"`
	RecipeID     int    `db:"recipe_id"`
	IngredientID int    `db:"ingredient_id"`
	Amount       string `db:"amount"`
	Unit         string `db:"unit"`
	Notes        string `db:"notes"`
	Position     int    `db:"position"`
}
