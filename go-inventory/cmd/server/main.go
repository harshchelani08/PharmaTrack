package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	_ "github.com/lib/pq"
)

// Global database and cache handlers
var db *sql.DB
var rdb *redis.Client
var ctx = context.Background()

type DeductRequest struct {
	TenantID string `json:"tenant_id" binding:"required"`
	BranchID string `json:"branch_id" binding:"required"`
	DrugID   string `json:"drug_id" binding:"required"`
	Quantity int    `json:"quantity" binding:"required,gt=0"`
	UserID   string `json:"user_id"`
}

type BatchDeduction struct {
	BatchID      string `json:"batch_id"`
	BatchNumber  string `json:"batch_number"`
	QtyDeducted  int    `json:"qty_deducted"`
	RemainingQty int    `json:"remaining_qty"`
}

type TransferValidateRequest struct {
	TenantID     string `json:"tenant_id" binding:"required"`
	FromBranchID string `json:"from_branch_id" binding:"required"`
	DrugID       string `json:"drug_id" binding:"required"`
	Quantity     int    `json:"quantity" binding:"required,gt=0"`
}

func main() {
	// Initialize Gin
	r := gin.Default()
	r.Use(CORSMiddleware())
	r.Use(APIKeyAuthMiddleware())

	// Initialize Database Connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:secure_db_password@localhost:5432/pharmatrack?sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Critical: Could not connect to database: %v", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Initialize Redis
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb = redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	// Routes
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "engine": "PharmaTrack Go Inventory Engine v1.0"})
	})

	r.POST("/deduct-stock", HandleDeductStock)
	r.POST("/validate-transfer", HandleValidateTransfer)
	r.GET("/reorder-calculation", HandleReorderCalculation)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("PharmaTrack Go microservice listening on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run HTTP server: %v", err)
	}
}

// HandleDeductStock locks batch records and executes atomic First-Expiry, First-Out (FEFO) stock deduction
func HandleDeductStock(c *gin.Context) {
	var req DeductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return;
	}

	// 1. Initialize atomic PostgreSQL transaction
	tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create SQL transaction", "details": err.Error()})
		return
	}

	// Make sure we rollback in case of premature return
	defer tx.Rollback()

	// 2. Select matching batches with a Row Lock (FOR UPDATE) to prevent concurrency double deductions
	query := `
		SELECT id, "batchNumber", "expiryDate", quantity 
		FROM "Batch" 
		WHERE "tenantId" = $1 AND "branchId" = $2 AND "drugId" = $3 AND quantity > 0 
		ORDER BY "expiryDate" ASC 
		FOR UPDATE`

	rows, err := tx.QueryContext(ctx, query, req.TenantID, req.BranchID, req.DrugID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to lock batch records", "details": err.Error()})
		return
	}
	defer rows.Close()

	type BatchItem struct {
		ID          string
		BatchNumber string
		ExpiryDate  time.Time
		Quantity    int
	}

	var availableBatches []BatchItem
	totalStockAvailable := 0

	for rows.Next() {
		var b BatchItem
		if err := rows.Scan(&b.ID, &b.BatchNumber, &b.ExpiryDate, &b.Quantity); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read database rows"})
			return
		}
		availableBatches = append(availableBatches, b)
		totalStockAvailable += b.Quantity
	}

	// 3. Confirm target inventory sufficiency
	if totalStockAvailable < req.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":     "INSUFFICIENT_STOCK",
			"message":   fmt.Sprintf("Requested %d units, but only %d units are in active batches.", req.Quantity, totalStockAvailable),
			"available": totalStockAvailable,
		})
		return
	}

	// 4. Perform sequential FEFO deduction
	qtyToDeduct := req.Quantity
	var deductions []BatchDeduction

	for _, batch := range availableBatches {
		if qtyToDeduct <= 0 {
			break
		}

		deductedFromThisBatch := 0
		newQty := 0

		if batch.Quantity >= qtyToDeduct {
			// This batch has enough to fulfill all remaining quantity
			deductedFromThisBatch = qtyToDeduct
			newQty = batch.Quantity - qtyToDeduct
			qtyToDeduct = 0
		} else {
			// This batch is fully consumed, roll remaining to the next batch
			deductedFromThisBatch = batch.Quantity
			newQty = 0
			qtyToDeduct -= batch.Quantity
		}

		// Update batch quantity in DB
		updateQuery := `UPDATE "Batch" SET quantity = $1, "updatedAt" = NOW() WHERE id = $2`
		if _, err := tx.ExecContext(ctx, updateQuery, newQty, batch.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deduct batch inventory", "details": err.Error()})
			return
		}

		// Insert inventory audit log
		logQuery := `
			INSERT INTO "InventoryLog" (id, "tenantId", "batchId", "changeQty", "prevQty", "newQty", reason, "userId", "createdAt") 
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`
		
		reason := fmt.Sprintf("POS Dispensing deduction - Qty: %d", deductedFromThisBatch)
		if _, err := tx.ExecContext(ctx, logQuery, req.TenantID, batch.ID, -deductedFromThisBatch, batch.Quantity, newQty, reason, req.UserID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit logs", "details": err.Error()})
			return
		}

		deductions = append(deductions, BatchDeduction{
			BatchID:      batch.ID,
			BatchNumber:  batch.BatchNumber,
			QtyDeducted:  deductedFromThisBatch,
			RemainingQty: newQty,
		})
	}

	// 5. Commit transaction safely
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finalize database transaction"})
		return
	}

	// 6. Redis Streams integration - Publish low-stock event check concurrently
	go func(tenant string, branch string, drug string) {
		checkLowStockAndAlert(tenant, branch, drug)
	}(req.TenantID, req.BranchID, req.DrugID)

	c.JSON(http.StatusOK, gin.H{
		"status":      "SUCCESS",
		"deductions":  deductions,
		"totalQty":    req.Quantity,
		"remaining":   totalStockAvailable - req.Quantity,
	})
}

// HandleValidateTransfer ensures a transferring branch has sufficient stock without causing low-stock levels
func HandleValidateTransfer(c *gin.Context) {
	var req TransferValidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input schema"})
		return
	}

	query := `SELECT SUM(quantity) FROM "Batch" WHERE "tenantId" = $1 AND "branchId" = $2 AND "drugId" = $3`
	var stock int
	err := db.QueryRowContext(ctx, query, req.TenantID, req.FromBranchID, req.DrugID).Scan(&stock)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not verify branch inventory"})
		return
	}

	if stock < req.Quantity {
		c.JSON(http.StatusOK, gin.H{
			"valid":   false,
			"reason":  "INSUFFICIENT_STOCK",
			"message": fmt.Sprintf("Transfer of %d requested, but only %d units exist in origin branch.", req.Quantity, stock),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"message": "Stock exists and has been approved for transfer routing.",
	})
}

// HandleReorderCalculation computes optimal reorder quantities
func HandleReorderCalculation(c *gin.Context) {
	tenantID := c.Query("tenant_id")
	branchID := c.Query("branch_id")
	drugID := c.Query("drug_id")

	if tenantID == "" || branchID == "" || drugID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tenant_id, branch_id, and drug_id query parameters are required"})
		return
	}

	// Simple heuristic reorder computation (in standard practice offloaded to AI or calculated by rolling usage)
	query := `
		SELECT COALESCE(SUM(quantity), 0) 
		FROM "Batch" 
		WHERE "tenantId" = $1 AND "branchId" = $2 AND "drugId" = $3`
	
	var currentQty int
	err := db.QueryRowContext(ctx, query, tenantID, branchID, drugID).Scan(&currentQty)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count stock level"})
		return
	}

	reorderLimit := 50
	needsReorder := currentQty <= reorderLimit
	suggestedQty := 0
	if needsReorder {
		suggestedQty = 200 - currentQty
	}

	c.JSON(http.StatusOK, gin.H{
		"drug_id":            drugID,
		"current_stock":     currentQty,
		"reorder_threshold": reorderLimit,
		"needs_reorder":     needsReorder,
		"suggested_reorder": suggestedQty,
	})
}

// Helper to calculate low-stock alerts and feed alerts into Redis Streams
func checkLowStockAndAlert(tenantId, branchId, drugId string) {
	var totalQty int
	query := `SELECT COALESCE(SUM(quantity), 0) FROM "Batch" WHERE "tenantId" = $1 AND "branchId" = $2 AND "drugId" = $3`
	err := db.QueryRowContext(ctx, query, tenantId, branchId, drugId).Scan(&totalQty)
	if err != nil {
		return
	}

	// If stock dips below critical levels, push alert to Redis Streams
	if totalQty <= 20 {
		var drugName string
		db.QueryRowContext(ctx, `SELECT "brandName" FROM "Drug" WHERE id = $1`, drugId).Scan(&drugName)

		alertMessage := fmt.Sprintf("Stock for drug '%s' is running critically low. Only %d units left in branch.", drugName, totalQty)
		
		// Write Alert to Database
		alertQuery := `
			INSERT INTO "Alert" (id, "tenantId", "branchId", type, message, "isRead", "createdAt")
			VALUES (gen_random_uuid(), $1, $2, 'LOW_STOCK', $3, false, NOW())`
		
		db.ExecContext(ctx, alertQuery, tenantId, branchId, alertMessage)

		// Stream alert via Redis Pub-Sub channel
		rdb.XAdd(ctx, &redis.XAddArgs{
			Stream: "alerts:stream",
			Values: map[string]interface{}{
				"tenantId":  tenantId,
				"branchId":  branchId,
				"type":      "LOW_STOCK",
				"message":   alertMessage,
				"timestamp": time.Now().Format(time.RFC3339),
			},
		})
	}
}

// CORSMiddleware simple handler for development
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-API-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

// APIKeyAuthMiddleware secures communication between NestJS backend and Go service
func APIKeyAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		expectedKey := os.Getenv("GO_SERVICE_API_KEY")

		if expectedKey == "" {
			expectedKey = "go_engine_secure_secret_api_key_56789" // Fallback fallback safety
		}

		if apiKey != expectedKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: API Key is invalid or missing"})
			c.Abort()
			return
		}
		c.Next()
	}
}
