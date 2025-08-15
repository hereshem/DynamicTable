package handlers

import (
	"dynamic-table-backend/models"
	"dynamic-table-backend/repository"
	"fmt"
	"net/http"

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
	if err := h.validateContentAgainstSchema(req.Keys, req.Values, schema.Fields); err != nil {
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

// GetContents retrieves all contents for a specific table
func (h *ContentHandler) GetContents(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	if tableSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug is required"})
		return
	}

	contents, err := h.contentRepo.GetContentsByTableSlug(tableSlug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(contents) == 0 {
		contents = []*models.Content{}
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
	if err := h.validateContentAgainstSchema(req.Keys, req.Values, schema.Fields); err != nil {
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

// validateContentAgainstSchema validates that content keys and values match the schema
func (h *ContentHandler) validateContentAgainstSchema(keys, values map[string]interface{}, fields []models.Field) error {
	// Check if all required fields are present
	for _, field := range fields {
		if field.Required {
			if _, exists := keys[field.Name]; !exists {
				return fmt.Errorf("required field '%s' is missing", field.Name)
			}
		}
	}

	// Check if all keys exist in schema
	for key := range keys {
		found := false
		for _, field := range fields {
			if field.Name == key {
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("field '%s' is not defined in schema", key)
		}
	}

	return nil
}
