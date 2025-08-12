# Use the official Golang image as the base image
FROM golang:1.24

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY . .

# Install PostgreSQL and ca-certificates
RUN apt-get update && apt-get install -y postgresql postgresql-contrib ca-certificates tzdata vim

# Set the timezone
ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Expose the PostgreSQL port
EXPOSE 5432

# Expose the application port
EXPOSE 8080

# Copy the PostgreSQL configuration and initialization scripts
COPY init-db.sh /docker-entrypoint-initdb.d/

# Start PostgreSQL and run tests
# CMD service postgresql start && go test ./... && ./main
CMD service postgresql start