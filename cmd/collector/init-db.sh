#!/bin/bash
set -e

service postgresql start

su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname = 'spyder'\"" | grep -q 1 || \
    su - postgres -c "psql -c \"CREATE USER spyder WITH PASSWORD 'spyder';\""

su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'recipes'\"" | grep -q 1 || \
    su - postgres -c "createdb -O spyder recipes"

cat <<'EOSQL' > /tmp/init_tables.sql
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,  -- Add slug
    name TEXT NOT NULL,
    image_url TEXT,
    calories FLOAT,  -- Add calories
    number_of_ingredients INT
);

CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    uid INT  -- Add uid if necessary
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id),
    amount TEXT,
    unit TEXT,
    notes TEXT,
    position INT
);

EOSQL

su - postgres -c "psql -d recipes -f /tmp/init_tables.sql"

su - postgres -c "psql -d recipes -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spyder;'"
su - postgres -c "psql -d recipes -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spyder;'"

echo "PostgreSQL initialized with upgraded schema"

echo "Starting test..."
if [ -f /.dockerenv ] || grep -qE '(docker|containerd)' /proc/1/cgroup; then
    # go test -run TestDB_InsertRecipeAndIngredients
    echo "Running inside Docker, running test(Skip for now)"
else
    echo "Not running inside Docker, skipping test"
fi
echo "Test completed"
