# Overview

## The purpose of our project

The purpose of our project is to create a tool for the user to track their daily diet and get recommendations based on nutitional information. The idea is that the user enter the food they ate or planning to eat throughout the day and our tool automatically find and adds up the nutritional information of these foods. We break them down into several categories (such as calories, protien, carbs, fats, etc.) and shows the user if they are eating healthly based on expert recommendation on each criteria. We then recommend some recipe to the user to make their diet healthier.

## The technologies used

- Languages: Go, TypeScript 
- Build Tools: npm, Go, Docker 
- Testing Tools: unittest 
- Front-end: React.js 
- Back-end: Go (net/http)
- Data Persistence: PostgreSQL (Neon)
- Production Deployment: Google Cloud Platform (GCP)
- CI/CD: GitHub Actions, GCP Cloud Build 
- Monitoring: Prometheus


## The deployment method

- Services are packaged with Docker
- Local Dev via Docker Compose
- Secrets managed via Google Secret Manager
- CI/CD Pipeline:
  - PR triggers tests and lint checks
  - Merge to main triggers Docker rebuild on VM

## Communicate important design decisions

- PostgreSQL: We chose PostgreSQL because it is a popular database supported by Neon which is free.
- [Emily Bites](https://emilybites.com/2010/12): We are using this recipe blog as our recipe source because it has detailed nutritional information for each recipe
- [Nutritionix API](https://trackapi.nutritionix.com/v2/natural/nutrients): We are using the Nutritionix API to fetch the nutritional information of the user's food input because it is very comprehensive and it is free.

## Team coordination processes

We coordinated on a group chat in Microsoft teams, used GitHub project to manage our work, and had weekly meetings.

## Work distributed method

- Frontend + CI/CD: Mingye, Ashmitha
- Backend:
  - REST API: Deeptanshu, Saiteja
  - Data collector/analyzer: Qinrun, Adithi
- Testing Mechanisms: everyone

## Testing

Our project includes unit and integration tests for core features.

### To run tests:

Run backend tests:

```bash
go test ./internal/app/... -v
```

## Demo:

[Demo](https://drive.google.com/file/d/1gQB7o1rmXu9C5WKvPWd2KbT43f4SJg3H/view?usp=sharing)

## Presentation:

[PPT](https://docs.google.com/presentation/d/1SHqShV-ZZHyxZDLft2yUzGLXNE25g_DzpJApWEvMF9g/edit?usp=sharing)
