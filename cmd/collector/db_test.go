package main

import (
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/lib/pq"
)

const (
	testDSN = "postgres://spyder:spyder@localhost:5432/recipes?sslmode=disable"
)

func TestDB_InsertRecipeAndIngredients(t *testing.T) {
	db, err := sql.Open("postgres", testDSN)
	if err != nil {
		t.Fatalf("❌ failed to connect to db: %v", err)
	}
	defer db.Close()

	// 插入测试数据
	var recipeID int
	err = db.QueryRow(`
		INSERT INTO recipes (slug, name, image_url)
		VALUES ('test-recipe', 'Test Recipe', 'http://example.com/image.jpg')
		RETURNING id
	`).Scan(&recipeID)
	if err != nil {
		t.Fatalf("❌ failed to insert recipe: %v", err)
	}

	_, err = db.Exec(`
		INSERT INTO ingredients (recipe_id, uid, amount, unit, name)
		VALUES ($1, 0, '1', 'cup', 'Test Ingredient')
	`, recipeID)
	if err != nil {
		t.Fatalf("❌ failed to insert ingredient: %v", err)
	}

	// 查询确认
	var count int
	err = db.QueryRow(`SELECT COUNT(*) FROM ingredients WHERE recipe_id = $1`, recipeID).Scan(&count)
	if err != nil || count == 0 {
		t.Fatalf("❌ no ingredient found for recipe_id %d", recipeID)
	}

	fmt.Println("✅ Recipe + Ingredient inserted and found in DB")

	// 清理数据
	_, _ = db.Exec(`DELETE FROM ingredients WHERE recipe_id = $1`, recipeID)
	_, _ = db.Exec(`DELETE FROM recipes WHERE id = $1`, recipeID)
}
