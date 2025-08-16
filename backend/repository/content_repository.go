package repository

import (
	"database/sql"
	"dynamic-table-backend/database"
	"dynamic-table-backend/models"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

type ContentRepository struct{}

func NewContentRepository() *ContentRepository {
	return &ContentRepository{}
}

// CreateContent creates a new content record
func (r *ContentRepository) CreateContent(tableSlug string, content *models.CreateContentRequest) (*models.Content, error) {
	valuesJSON, err := json.Marshal(content.Values)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal values: %v", err)
	}

	query := `
		INSERT INTO contents (table_slug, values)
		VALUES ($1, $2)
		RETURNING id, table_slug, values, created_at, updated_at`

	var contentScan models.ContentScan
	err = database.DB.QueryRow(query, tableSlug, valuesJSON).Scan(
		&contentScan.ID,
		&contentScan.TableSlug,
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
		SELECT id, table_slug, values, created_at, updated_at
		FROM contents
		WHERE id = $1`

	var contentScan models.ContentScan
	err := database.DB.QueryRow(query, id).Scan(
		&contentScan.ID,
		&contentScan.TableSlug,
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

// GetContentsByTableSlug retrieves all contents for a specific table with search, filter, and sorting
func (r *ContentRepository) GetContentsByTableSlug(tableSlug string, params *models.ContentQueryParams) (*models.ContentResponse, error) {
	// Build the base query
	baseQuery := `FROM contents WHERE table_slug = $1`
	args := []interface{}{tableSlug}
	argIndex := 2

	// Add search functionality
	if params.Search != "" {
		searchQuery := ` AND (
			values::text ILIKE $%d
		)`
		searchArg := "%" + params.Search + "%"
		baseQuery += fmt.Sprintf(searchQuery, argIndex)
		args = append(args, searchArg)
		argIndex++
	}

	// Add field-specific filters
	if len(params.Filters) > 0 {
		for fieldName, filterValue := range params.Filters {
			if filterValue != "" {
				filterQuery := ` AND values->>$%d = $%d`
				baseQuery += fmt.Sprintf(filterQuery, argIndex, argIndex+1)
				args = append(args, fieldName, filterValue)
				argIndex += 2
			}
		}
	}

	// Build the complete query with sorting and pagination
	orderBy := "created_at DESC"
	if params.SortBy != "" {
		// Validate sort direction
		sortDir := "ASC"
		if strings.ToUpper(params.SortDir) == "DESC" {
			sortDir = "DESC"
		}

		// Handle special cases for sorting
		switch params.SortBy {
		case "created_at", "updated_at":
			orderBy = fmt.Sprintf("%s %s", params.SortBy, sortDir)
		default:
			// For dynamic fields, sort by JSON value
			orderBy = fmt.Sprintf("values->>'%s' %s", params.SortBy, sortDir)
		}
	}

	// Count total records
	countQuery := fmt.Sprintf("SELECT COUNT(*) %s", baseQuery)
	var total int
	err := database.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count contents: %v", err)
	}

	// Calculate pagination
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 {
		params.PageSize = 10
	}
	if params.PageSize > 100 {
		params.PageSize = 100
	}

	offset := (params.Page - 1) * params.PageSize
	totalPages := (total + params.PageSize - 1) / params.PageSize

	// Build the final query with pagination
	selectQuery := fmt.Sprintf(`
		SELECT id, table_slug, values, created_at, updated_at
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, baseQuery, orderBy, argIndex, argIndex+1)

	args = append(args, params.PageSize, offset)

	rows, err := database.DB.Query(selectQuery, args...)
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

	// Preload related data for relational fields
	contents, err = r.preloadRelatedData(contents, tableSlug)
	if err != nil {
		return nil, fmt.Errorf("failed to preload related data: %v", err)
	}

	return &models.ContentResponse{
		Contents:   contents,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

// GetContents retrieves all contents for a specific table (backward compatibility)
func (r *ContentRepository) GetContents(tableSlug string) ([]*models.Content, error) {
	params := &models.ContentQueryParams{
		Page:     1,
		PageSize: 1000, // Large number to get all
	}

	response, err := r.GetContentsByTableSlug(tableSlug, params)
	if err != nil {
		return nil, err
	}

	return response.Contents, nil
}

// UpdateContent updates an existing content record
func (r *ContentRepository) UpdateContent(id string, updateReq *models.UpdateContentRequest) (*models.Content, error) {
	valuesJSON, err := json.Marshal(updateReq.Values)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal values: %v", err)
	}

	query := `
		UPDATE contents
		SET values = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
		RETURNING id, table_slug, values, created_at, updated_at`

	var contentScan models.ContentScan
	err = database.DB.QueryRow(query, valuesJSON, id).Scan(
		&contentScan.ID,
		&contentScan.TableSlug,
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
	var values map[string]interface{}
	if err := json.Unmarshal(scan.Values, &values); err != nil {
		return nil, fmt.Errorf("failed to unmarshal values: %v", err)
	}

	return &models.Content{
		ID:        scan.ID,
		TableSlug: scan.TableSlug,
		Values:    values,
		CreatedAt: scan.CreatedAt,
		UpdatedAt: scan.UpdatedAt,
	}, nil
}

// preloadRelatedData loads related data for relational fields
func (r *ContentRepository) preloadRelatedData(contents []*models.Content, tableSlug string) ([]*models.Content, error) {
	// Get schema to identify relational fields
	schemaRepo := NewSchemaRepository()
	schema, err := schemaRepo.GetSchemaBySlug(tableSlug)
	if err != nil {
		return nil, err
	}

	// Find relational fields
	var relationFields []models.Field
	for _, field := range schema.Fields {
		if field.DataType == "relation" && field.RelationConfig != nil {
			relationFields = append(relationFields, field)
		}
	}

	if len(relationFields) == 0 {
		return contents, nil
	}

	// Preload related data for each content
	for _, content := range contents {
		for _, field := range relationFields {
			if fieldValue, exists := content.Values[field.Name]; exists {
				relatedData, err := r.getRelatedData(field.RelationConfig, fieldValue)
				if err != nil {
					// Log error but continue
					log.Printf("Failed to load related data for field %s: %v", field.Name, err)
					continue
				}

				// Add related data to content values with a prefix
				content.Values["_"+field.Name+"_related"] = relatedData
			}
		}
	}

	return contents, nil
}

// getRelatedData retrieves related data for a specific field
func (r *ContentRepository) getRelatedData(config *models.RelationConfig, fieldValue interface{}) (interface{}, error) {
	query := `
		SELECT values
		FROM contents 
		WHERE table_slug = $1 
		AND values->>$2 = $3
	`
	var valuesJSON json.RawMessage
	err := database.DB.QueryRow(query, config.RelatedTable, config.RelatedField, fieldValue).Scan(&valuesJSON)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	var values map[string]interface{}
	if err := json.Unmarshal(valuesJSON, &values); err != nil {
		return nil, err
	}
	return values, nil
}

// GetRelatedDataForField retrieves all related data for a specific field configuration
func (r *ContentRepository) GetRelatedDataForField(config *models.RelationConfig) ([]map[string]interface{}, error) {
	query := `
		SELECT values
		FROM contents 
		WHERE table_slug = $1
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(query, config.RelatedTable)
	if err != nil {
		return nil, fmt.Errorf("failed to query related data: %v", err)
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var valuesJSON json.RawMessage
		err := rows.Scan(&valuesJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to scan related data: %v", err)
		}

		var values map[string]interface{}
		if err := json.Unmarshal(valuesJSON, &values); err != nil {
			return nil, fmt.Errorf("failed to unmarshal related data: %v", err)
		}

		results = append(results, values)
	}

	return results, nil
}
