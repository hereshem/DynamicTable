package handlers

import (
	"dynamic-table-backend/models"
	"dynamic-table-backend/repository"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SchemaHandler struct {
	schemaRepo *repository.SchemaRepository
}

func NewSchemaHandler() *SchemaHandler {
	return &SchemaHandler{
		schemaRepo: repository.NewSchemaRepository(),
	}
}

// CreateSchema creates a new table schema
func (h *SchemaHandler) CreateSchema(c *gin.Context) {
	var req models.CreateSchemaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate fields
	if len(req.Fields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one field is required"})
		return
	}

	// Validate field names are unique
	fieldNames := make(map[string]bool)
	for _, field := range req.Fields {
		if field.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "field name cannot be empty"})
			return
		}
		if fieldNames[field.Name] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "duplicate field names are not allowed"})
			return
		}
		fieldNames[field.Name] = true
	}

	schema, err := h.schemaRepo.CreateSchema(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, schema)
}

// GetSchema retrieves a schema by table slug
func (h *SchemaHandler) GetSchema(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	if tableSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug is required"})
		return
	}

	schema, err := h.schemaRepo.GetSchemaBySlug(tableSlug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if schema == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "schema not found"})
		return
	}

	c.JSON(http.StatusOK, schema)
}

// GetAllSchemas retrieves all table schemas
func (h *SchemaHandler) GetAllSchemas(c *gin.Context) {
	schemas, err := h.schemaRepo.GetAllSchemas()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if len(schemas) == 0 {
		schemas = []*models.Schema{}
	}

	c.JSON(http.StatusOK, schemas)
}

// UpdateSchema updates an existing schema
func (h *SchemaHandler) UpdateSchema(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	if tableSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug is required"})
		return
	}

	var req models.UpdateSchemaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate fields
	if len(req.Fields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one field is required"})
		return
	}

	// Validate field names are unique
	fieldNames := make(map[string]bool)
	for _, field := range req.Fields {
		if field.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "field name cannot be empty"})
			return
		}
		if fieldNames[field.Name] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "duplicate field names are not allowed"})
			return
		}
		fieldNames[field.Name] = true
	}

	schema, err := h.schemaRepo.UpdateSchema(tableSlug, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if schema == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "schema not found"})
		return
	}

	c.JSON(http.StatusOK, schema)
}

// DeleteSchema deletes a schema and all its contents
func (h *SchemaHandler) DeleteSchema(c *gin.Context) {
	tableSlug := c.Param("tableSlug")
	if tableSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "table slug is required"})
		return
	}

	err := h.schemaRepo.DeleteSchema(tableSlug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "schema deleted successfully"})
}
