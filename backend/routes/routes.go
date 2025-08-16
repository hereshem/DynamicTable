package routes

import (
	"dynamic-table-backend/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes() *gin.Engine {
	r := gin.Default()

	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Initialize handlers
	schemaHandler := handlers.NewSchemaHandler()
	contentHandler := handlers.NewContentHandler()

	// Schema routes
	schemas := r.Group("/api/schemas")
	{
		schemas.POST("/", schemaHandler.CreateSchema)
		schemas.GET("/", schemaHandler.GetAllSchemas)
		schemas.GET("/:tableSlug", schemaHandler.GetSchema)
		schemas.PUT("/:tableSlug", schemaHandler.UpdateSchema)
		schemas.DELETE("/:tableSlug", schemaHandler.DeleteSchema)
	}

	// Content routes
	contents := r.Group("/api/contents")
	{
		contents.POST("/:tableSlug", contentHandler.CreateContent)
		contents.GET("/:tableSlug", contentHandler.GetContents)
		contents.GET("/:tableSlug/:id", contentHandler.GetContent)
		contents.PUT("/:tableSlug/:id", contentHandler.UpdateContent)
		contents.DELETE("/:tableSlug/:id", contentHandler.DeleteContent)
		// Add route for related data
		contents.GET("/:tableSlug/related/:fieldName", contentHandler.GetRelatedData)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	return r
}
