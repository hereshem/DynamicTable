package models

import (
	"encoding/json"
	"time"
)

// Schema represents the table schema
type Schema struct {
	ID        string    `json:"id" db:"id"`
	TableSlug string    `json:"tableSlug" db:"table_slug"`
	TableName string    `json:"tableName" db:"table_name"`
	Fields    []Field   `json:"fields" db:"fields"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// Field represents a dynamic form field
type Field struct {
	Name           string   `json:"name"`
	Label          string   `json:"label"`
	DataType       string   `json:"dataType"`
	DataValidation string   `json:"dataValidation,omitempty"`
	Required       bool     `json:"required"`
	Options        []string `json:"options,omitempty"`
}

// Content represents a table record
type Content struct {
	ID        string                 `json:"id" db:"id"`
	TableSlug string                 `json:"tableSlug" db:"table_slug"`
	Values    map[string]interface{} `json:"values" db:"values"`
	CreatedAt time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time              `json:"updatedAt" db:"updated_at"`
}

// CreateSchemaRequest represents the request to create a new table schema
type CreateSchemaRequest struct {
	TableName string  `json:"tableName" binding:"required"`
	TableSlug string  `json:"tableSlug" binding:"required"`
	Fields    []Field `json:"fields" binding:"required"`
}

// UpdateSchemaRequest represents the request to update a table schema
type UpdateSchemaRequest struct {
	TableName string  `json:"tableName" binding:"required"`
	Fields    []Field `json:"fields" binding:"required"`
}

// CreateContentRequest represents the request to create a new content record
type CreateContentRequest struct {
	Values map[string]interface{} `json:"values" binding:"required"`
}

// UpdateContentRequest represents the request to update a content record
type UpdateContentRequest struct {
	Values map[string]interface{} `json:"values" binding:"required"`
}

// ContentQueryParams represents query parameters for content filtering
type ContentQueryParams struct {
	Search   string            `form:"search"`
	Filters  map[string]string `form:"filters"`
	SortBy   string            `form:"sortBy"`
	SortDir  string            `form:"sortDir"` // "asc" or "desc"
	Page     int               `form:"page"`
	PageSize int               `form:"pageSize"`
}

// ContentResponse represents the paginated content response
type ContentResponse struct {
	Contents   []*Content `json:"contents"`
	Total      int        `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
	TotalPages int        `json:"totalPages"`
}

// SchemaScan is used for scanning database results
type SchemaScan struct {
	ID        string          `db:"id"`
	TableSlug string          `db:"table_slug"`
	TableName string          `db:"table_name"`
	Fields    json.RawMessage `db:"fields"`
	CreatedAt time.Time       `db:"created_at"`
	UpdatedAt time.Time       `db:"updated_at"`
}

// ContentScan is used for scanning database results
type ContentScan struct {
	ID        string          `db:"id"`
	TableSlug string          `db:"table_slug"`
	Values    json.RawMessage `db:"values"`
	CreatedAt time.Time       `db:"created_at"`
	UpdatedAt time.Time       `db:"updated_at"`
}
