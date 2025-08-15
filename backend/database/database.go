package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() error {
	// Database connection string
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	// Open database connection
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// Test connection
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	// Create tables
	if err = createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %v", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

func createTables() error {
	// Create schema table
	schemaTable := `
	CREATE TABLE IF NOT EXISTS schema (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		table_slug VARCHAR(255) UNIQUE NOT NULL,
		table_name VARCHAR(255) NOT NULL,
		fields JSONB NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	// Create contents table
	contentsTable := `
	CREATE TABLE IF NOT EXISTS contents (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		table_slug VARCHAR(255) NOT NULL,
		keys JSONB NOT NULL,
		values JSONB NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (table_slug) REFERENCES schema(table_slug) ON DELETE CASCADE
	);`

	// Create indexes
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_contents_table_slug ON contents(table_slug);",
		"CREATE INDEX IF NOT EXISTS idx_contents_keys ON contents USING GIN(keys);",
		"CREATE INDEX IF NOT EXISTS idx_contents_values ON contents USING GIN(values);",
	}

	// Execute table creation
	if _, err := DB.Exec(schemaTable); err != nil {
		return fmt.Errorf("failed to create schema table: %v", err)
	}

	if _, err := DB.Exec(contentsTable); err != nil {
		return fmt.Errorf("failed to create contents table: %v", err)
	}

	// Execute indexes
	for _, index := range indexes {
		if _, err := DB.Exec(index); err != nil {
			return fmt.Errorf("failed to create index: %v", err)
		}
	}

	return nil
}
