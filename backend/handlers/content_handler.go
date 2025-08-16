package handlers

import (
	"dynamic-table-backend/models"
	"dynamic-table-backend/repository"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type ContentHandler struct {
	contentRepo *repository.ContentRepository
	schemaRepo  *repository.SchemaRepository
}

func NewContentHandler() *ContentHandler {
	return &ContentHandler{
		contentRepo: repository.NewContentRepository(),
		schemaRepo:  repository.NewSchemaRepository(),
	}
}

// CreateContent creates a new content record
func (h *ContentHandler) CreateContent(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	if tableSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug is required"})
		return
	}

	// Verify table exists
	schema, err := h.schemaRepo.GetSchemaBySlug(tableSlug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if schema == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "table not found"})
		return
	}

	var req models.CreateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that keys match schema fields
	if err := h.validateContentAgainstSchema(req.Values, schema.Fields); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	content, err := h.contentRepo.CreateContent(tableSlug, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, content)
}

// GetContent retrieves content by ID
func (h *ContentHandler) GetContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content id is required"})
		return
	}

	content, err := h.contentRepo.GetContentByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if content == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "content not found"})
		return
	}

	c.JSON(http.StatusOK, content)
}

// GetContents retrieves all contents for a specific table with search, filter, and sorting
func (h *ContentHandler) GetContents(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	if tableSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug is required"})
		return
	}

	// Parse query parameters
	params := &models.ContentQueryParams{}

	// Search parameter
	if search := c.Query("search"); search != "" {
		params.Search = search
	}

	// Filters parameter (comma-separated key=value pairs)
	if filtersStr := c.Query("filters"); filtersStr != "" {
		params.Filters = make(map[string]string)
		filterPairs := strings.Split(filtersStr, ",")
		for _, pair := range filterPairs {
			if strings.Contains(pair, "=") {
				parts := strings.SplitN(pair, "=", 2)
				if len(parts) == 2 {
					params.Filters[parts[0]] = parts[1]
				}
			}
		}
	}

	// Sorting parameters
	if sortBy := c.Query("sortBy"); sortBy != "" {
		params.SortBy = sortBy
	}
	if sortDir := c.Query("sortDir"); sortDir != "" {
		params.SortDir = sortDir
	}

	// Pagination parameters
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			params.Page = page
		}
	}
	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 {
			params.PageSize = pageSize
		}
	}

	// Set defaults
	if params.Page == 0 {
		params.Page = 1
	}
	if params.PageSize == 0 {
		params.PageSize = 10
	}

	contents, err := h.contentRepo.GetContentsByTableSlug(tableSlug, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if contents.Contents == nil {
		contents.Contents = []*models.Content{}
	}

	c.JSON(http.StatusOK, contents)
}

// UpdateContent updates an existing content record
func (h *ContentHandler) UpdateContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content id is required"})
		return
	}

	// Get existing content to verify table
	existingContent, err := h.contentRepo.GetContentByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if existingContent == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "content not found"})
		return
	}

	// Get schema for validation
	schema, err := h.schemaRepo.GetSchemaBySlug(existingContent.TableSlug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var req models.UpdateContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that keys match schema fields
	if err := h.validateContentAgainstSchema(req.Values, schema.Fields); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	content, err := h.contentRepo.UpdateContent(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, content)
}

// DeleteContent deletes a content record
func (h *ContentHandler) DeleteContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content id is required"})
		return
	}

	err := h.contentRepo.DeleteContent(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "content deleted successfully"})
}

// validateContentAgainstSchema validates that content values match the schema
func (h *ContentHandler) validateContentAgainstSchema(values map[string]interface{}, fields []models.Field) error {
	// Check if all required fields are present
	for _, field := range fields {
		if field.Required {
			if _, exists := values[field.Name]; !exists {
				return fmt.Errorf("required field '%s' is missing", field.Name)
			}
		}
	}

	// Check if all values exist in schema
	for key := range values {
		found := false
		for _, field := range fields {
			if field.Name == key {
				found = true
				break
			}
		}
		if !found && key[:1] != "_" {
			return fmt.Errorf("field '%s' is not defined in schema", key)
		}
	}

	return nil
}

// GetRelatedData retrieves related data for a specific field
func (h *ContentHandler) GetRelatedData(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	fieldName := c.Param("fieldName")

	if tableSlug == "" || fieldName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug and field name are required"})
		return
	}

	// Get schema to find the field
	schema, err := h.schemaRepo.GetSchemaBySlug(tableSlug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var targetField *models.Field
	for _, field := range schema.Fields {
		if field.Name == fieldName && field.DataType == "relation" {
			targetField = &field
			break
		}
	}

	if targetField == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "relation field not found"})
		return
	}

	// Get related data
	relatedData, err := h.contentRepo.GetRelatedDataForField(targetField.RelationConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, relatedData)
}
