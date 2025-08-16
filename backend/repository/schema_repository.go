package repository

import (
	"database/sql"
	"dynamic-table-backend/database"
	"dynamic-table-backend/models"
	"encoding/json"
	"fmt"
)

type SchemaRepository struct{}

func NewSchemaRepository() *SchemaRepository {
	return &SchemaRepository{}
}

// CreateSchema creates a new table schema
func (r *SchemaRepository) CreateSchema(schema *models.CreateSchemaRequest) (*models.Schema, error) {
	fieldsJSON, err := json.Marshal(schema.Fields)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal fields: %v", err)
	}

	query := `
		INSERT INTO schemas (table_slug, table_name, fields)
		VALUES ($1, $2, $3)
		RETURNING id, table_slug, table_name, fields, created_at, updated_at`

	var schemaScan models.SchemaScan
	err = database.DB.QueryRow(query, schema.TableSlug, schema.TableName, fieldsJSON).Scan(
		&schemaScan.ID,
		&schemaScan.TableSlug,
		&schemaScan.TableName,
		&schemaScan.Fields,
		&schemaScan.CreatedAt,
		&schemaScan.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create schema: %v", err)
	}

	return r.scanToSchema(schemaScan)
}

// GetSchemaBySlug retrieves a schema by table slug
func (r *SchemaRepository) GetSchemaBySlug(tableSlug string) (*models.Schema, error) {
	query := `
		SELECT id, table_slug, table_name, fields, created_at, updated_at
		FROM schemas
		WHERE table_slug = $1`

	var schemaScan models.SchemaScan
	err := database.DB.QueryRow(query, tableSlug).Scan(
		&schemaScan.ID,
		&schemaScan.TableSlug,
		&schemaScan.TableName,
		&schemaScan.Fields,
		&schemaScan.CreatedAt,
		&schemaScan.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get schema: %v", err)
	}

	return r.scanToSchema(schemaScan)
}

// GetAllSchemas retrieves all table schemas
func (r *SchemaRepository) GetAllSchemas() ([]*models.Schema, error) {
	query := `
		SELECT id, table_slug, table_name, fields, created_at, updated_at
		FROM schemas
		ORDER BY created_at DESC`

	rows, err := database.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query schemas: %v", err)
	}
	defer rows.Close()

	var schemas []*models.Schema
	for rows.Next() {
		var schemaScan models.SchemaScan
		err := rows.Scan(
			&schemaScan.ID,
			&schemaScan.TableSlug,
			&schemaScan.TableName,
			&schemaScan.Fields,
			&schemaScan.CreatedAt,
			&schemaScan.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan schema: %v", err)
		}

		schema, err := r.scanToSchema(schemaScan)
		if err != nil {
			return nil, err
		}
		schemas = append(schemas, schema)
	}

	return schemas, nil
}

// UpdateSchema updates an existing schema
func (r *SchemaRepository) UpdateSchema(tableSlug string, updateReq *models.UpdateSchemaRequest) (*models.Schema, error) {
	fieldsJSON, err := json.Marshal(updateReq.Fields)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal fields: %v", err)
	}

	query := `
		UPDATE schemas
		SET table_name = $1, fields = $2, updated_at = CURRENT_TIMESTAMP
		WHERE table_slug = $3
		RETURNING id, table_slug, table_name, fields, created_at, updated_at`

	var schemaScan models.SchemaScan
	err = database.DB.QueryRow(query, updateReq.TableName, fieldsJSON, tableSlug).Scan(
		&schemaScan.ID,
		&schemaScan.TableSlug,
		&schemaScan.TableName,
		&schemaScan.Fields,
		&schemaScan.CreatedAt,
		&schemaScan.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to update schema: %v", err)
	}

	return r.scanToSchema(schemaScan)
}

// DeleteSchema deletes a schema and all its contents
func (r *SchemaRepository) DeleteSchema(tableSlug string) error {
	query := `DELETE FROM schemas WHERE table_slug = $1`
	result, err := database.DB.Exec(query, tableSlug)
	if err != nil {
		return fmt.Errorf("failed to delete schema: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("schema not found")
	}

	return nil
}

// scanToSchema converts SchemaScan to Schema
func (r *SchemaRepository) scanToSchema(scan models.SchemaScan) (*models.Schema, error) {
	var fields []models.Field
	if err := json.Unmarshal(scan.Fields, &fields); err != nil {
		return nil, fmt.Errorf("failed to unmarshal fields: %v", err)
	}

	return &models.Schema{
		ID:        scan.ID,
		TableSlug: scan.TableSlug,
		TableName: scan.TableName,
		Fields:    fields,
		CreatedAt: scan.CreatedAt,
		UpdatedAt: scan.UpdatedAt,
	}, nil
}
