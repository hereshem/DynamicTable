package repository

import (
	"database/sql"
	"dynamic-table-backend/database"
	"dynamic-table-backend/models"
	"encoding/json"
	"fmt"
)

type ContentRepository struct{}

func NewContentRepository() *ContentRepository {
	return &ContentRepository{}
}

// CreateContent creates a new content record
func (r *ContentRepository) CreateContent(tableSlug string, content *models.CreateContentRequest) (*models.Content, error) {
	keysJSON, err := json.Marshal(content.Keys)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal keys: %v", err)
	}

	valuesJSON, err := json.Marshal(content.Values)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal values: %v", err)
	}

	query := `
		INSERT INTO contents (table_slug, keys, values)
		VALUES ($1, $2, $3)
		RETURNING id, table_slug, keys, values, created_at, updated_at`

	var contentScan models.ContentScan
	err = database.DB.QueryRow(query, tableSlug, keysJSON, valuesJSON).Scan(
		&contentScan.ID,
		&contentScan.TableSlug,
		&contentScan.Keys,
		&contentScan.Values,
		&contentScan.CreatedAt,
		&contentScan.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create content: %v", err)
	}

	return r.scanToContent(contentScan)
}

// GetContentByID retrieves content by ID
func (r *ContentRepository) GetContentByID(id string) (*models.Content, error) {
	query := `
		SELECT id, table_slug, keys, values, created_at, updated_at
		FROM contents
		WHERE id = $1`

	var contentScan models.ContentScan
	err := database.DB.QueryRow(query, id).Scan(
		&contentScan.ID,
		&contentScan.TableSlug,
		&contentScan.Keys,
		&contentScan.Values,
		&contentScan.CreatedAt,
		&contentScan.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get content: %v", err)
	}

	return r.scanToContent(contentScan)
}

// GetContentsByTableSlug retrieves all contents for a specific table
func (r *ContentRepository) GetContentsByTableSlug(tableSlug string) ([]*models.Content, error) {
	query := `
		SELECT id, table_slug, keys, values, created_at, updated_at
		FROM contents
		WHERE table_slug = $1
		ORDER BY created_at DESC`

	rows, err := database.DB.Query(query, tableSlug)
	if err != nil {
		return nil, fmt.Errorf("failed to query contents: %v", err)
	}
	defer rows.Close()

	var contents []*models.Content
	for rows.Next() {
		var contentScan models.ContentScan
		err := rows.Scan(
			&contentScan.ID,
			&contentScan.TableSlug,
			&contentScan.Keys,
			&contentScan.Values,
			&contentScan.CreatedAt,
			&contentScan.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan content: %v", err)
		}

		content, err := r.scanToContent(contentScan)
		if err != nil {
			return nil, err
		}
		contents = append(contents, content)
	}

	return contents, nil
}

// UpdateContent updates an existing content record
func (r *ContentRepository) UpdateContent(id string, updateReq *models.UpdateContentRequest) (*models.Content, error) {
	keysJSON, err := json.Marshal(updateReq.Keys)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal keys: %v", err)
	}

	valuesJSON, err := json.Marshal(updateReq.Values)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal values: %v", err)
	}

	query := `
		UPDATE contents
		SET keys = $1, values = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
		RETURNING id, table_slug, keys, values, created_at, updated_at`

	var contentScan models.ContentScan
	err = database.DB.QueryRow(query, keysJSON, valuesJSON, id).Scan(
		&contentScan.ID,
		&contentScan.TableSlug,
		&contentScan.Keys,
		&contentScan.Values,
		&contentScan.CreatedAt,
		&contentScan.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to update content: %v", err)
	}

	return r.scanToContent(contentScan)
}

// DeleteContent deletes a content record
func (r *ContentRepository) DeleteContent(id string) error {
	query := `DELETE FROM contents WHERE id = $1`
	result, err := database.DB.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete content: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("content not found")
	}

	return nil
}

// DeleteContentsByTableSlug deletes all contents for a specific table
func (r *ContentRepository) DeleteContentsByTableSlug(tableSlug string) error {
	query := `DELETE FROM contents WHERE table_slug = $1`
	_, err := database.DB.Exec(query, tableSlug)
	if err != nil {
		return fmt.Errorf("failed to delete contents: %v", err)
	}

	return nil
}

// scanToContent converts ContentScan to Content
func (r *ContentRepository) scanToContent(scan models.ContentScan) (*models.Content, error) {
	var keys map[string]interface{}
	if err := json.Unmarshal(scan.Keys, &keys); err != nil {
		return nil, fmt.Errorf("failed to unmarshal keys: %v", err)
	}

	var values map[string]interface{}
	if err := json.Unmarshal(scan.Values, &values); err != nil {
		return nil, fmt.Errorf("failed to unmarshal values: %v", err)
	}

	return &models.Content{
		ID:        scan.ID,
		TableSlug: scan.TableSlug,
		Keys:      keys,
		Values:    values,
		CreatedAt: scan.CreatedAt,
		UpdatedAt: scan.UpdatedAt,
	}, nil
}
