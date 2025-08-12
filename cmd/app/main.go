package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"
	"net/http"
	"cloud.google.com/go/pubsub"
	"github.com/alicebob/miniredis/v2"
	"github.com/coloradocollective/go-capstone-starter/internal/app"
	"github.com/coloradocollective/go-capstone-starter/internal/utils"
	"github.com/coloradocollective/go-capstone-starter/pkg/dbsupport"
	"github.com/coloradocollective/go-capstone-starter/pkg/websupport"
	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var pubsubClient *pubsub.Client
var pubsubTopic *pubsub.Topic


var httpRequestsTotal = prometheus.NewCounter(
	prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests processed",
	},
)

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("%s %s %s", r.Method, r.URL.Path, r.RemoteAddr)

		httpRequestsTotal.Inc()

		next.ServeHTTP(w, r)
		log.Printf("Completed in %v", time.Since(start))
	})
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	mr, err := miniredis.Run()
	if err != nil {
		log.Fatalf("Failed to start Redis server: %v", err)
	}
	defer mr.Close()

	utils.InitRedisWithAddr(mr.Addr())
	log.Printf("Redis server started at %s", mr.Addr())

	projectID := os.Getenv("GCP_PROJECT_ID")
	pubsubClient, err = pubsub.NewClient(context.Background(), projectID)
	if err != nil {
		log.Fatalf("Failed to create Pub/Sub client: %v", err)
	}
	defer pubsubClient.Close()

	topicName := "nutrition-helper-topic"
if err := utils.InitPubSub(pubsubClient, topicName); err != nil {
	log.Fatalf("Failed to initialize Pub/Sub: %v", err)
}

	host := websupport.EnvironmentVariable("HOST", "")
	port := websupport.EnvironmentVariable("BACKEND_PORT", 8778)
	databaseUrl := websupport.RequireEnvironmentVariable[string]("DATABASE_URL")
	log.Printf("Host: %s, Port: %d\n", host, port)
	log.Printf("Database string: %v\n", databaseUrl)

	db := dbsupport.CreateConnection(databaseUrl)
	mainMux := http.NewServeMux()

	app.Handlers(db)(mainMux)

	metricsMux := http.NewServeMux()
	prometheus.MustRegister(httpRequestsTotal)
	metricsMux.Handle("/metrics", promhttp.Handler())

	finalMux := http.NewServeMux()

	finalMux.Handle("/metrics", metricsMux)

	finalMux.Handle("/", mainMux)

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:5173", "http://localhost:8080", "https://s25-team-3-capstone-450859268851.us-central1.run.app"}), 
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE"}), 
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}), 
	)(loggingMiddleware(finalMux))

	server := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", host, port),
		Handler: corsHandler, 
	}
	log.Fatal(server.ListenAndServe()) 
}
