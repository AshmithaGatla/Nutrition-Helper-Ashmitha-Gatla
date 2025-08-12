CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    provider TEXT NOT NULL DEFAULT 'local',
    security_answer TEXT, -- Security answer for password reset
    created_at TIMESTAMPTZ DEFAULT NOW(),
    profile_image_url TEXT
);


CREATE TABLE food_entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    portion INT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    calories INT NOT NULL,
    protein INT NOT NULL,
    carbohydrates INT NOT NULL,
    fat INT NOT NULL,
    fiber INT NOT NULL,
    sugar INT NOT NULL,
    meal_type VARCHAR(20) NOT NULL,   -- e.g., breakfast, lunch, dinner, snack
    consumed_at TIMESTAMPTZ NOT NULL, -- Timestamp when the meal was consumed
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timestamp of when the entry is created
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP -- Timestamp of the last update
);
