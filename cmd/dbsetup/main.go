package main

import (
	"log"
	"os"

	"github.com/coloradocollective/go-capstone-starter/internal/db/setup"
	"github.com/coloradocollective/go-capstone-starter/pkg/dbsupport"
	"github.com/coloradocollective/go-capstone-starter/pkg/websupport"
	"github.com/joho/godotenv"
)

func main() {

	// Load .env file if present
	_ = godotenv.Load()

	dbURL := websupport.RequireEnvironmentVariable[string]("DATABASE_URL")

	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
		if dbURL == "" {
			log.Fatal("Database URL must be provided via -db flag or DATABASE_URL environment variable")
		}
	}

	db := dbsupport.CreateConnection(dbURL)
	defer db.Close()

	if err := setup.CreateTables(db); err != nil {
		log.Fatalf("Failed to create tables: %v", err)
	}
	log.Println("Database setup completed successfully")
}
