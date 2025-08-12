package main

import (
	"fmt"
	"log"
	"net/http"
)

func startServer() {
	// Start the web server
	http.HandleFunc("/health/db", dbHealthCheck)
	http.HandleFunc("/health/scraper", scraperHealthCheck)

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}

// dbHealthCheck checks the database connection health.
func dbHealthCheck(w http.ResponseWriter, r *http.Request) {
	db, err := InitializeDB()
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		http.Error(w, "Database ping failed", http.StatusInternalServerError)
		return
	}

	fmt.Fprintln(w, "Database connection is healthy")
}

// scraperHealthCheck checks the scraper's health.
func scraperHealthCheck(w http.ResponseWriter, r *http.Request) {
	// For simplicity, we'll just return a static message.
	// You can enhance this by checking the last successful scrape time or other metrics.
	fmt.Fprintln(w, "Scraper is running")
}
