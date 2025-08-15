# Demo Setup for Dynamic Tables with Search, Filter, and Sorting

## Quick Start

1. **Start the backend:**
   ```bash
   cd backend
   go mod tidy
   go run main.go
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Create a test table:**
   - Go to http://localhost:3000
   - Click "Create Table"
   - Table Name: "Employee Directory"
   - Table Slug: "employees"
   - Add these fields:
     - Name (text, required)
     - Email (email, required)
     - Department (options: Engineering, Marketing, Sales, HR)
     - Salary (number)
     - Hire Date (date)
     - Is Active (checkbox)

4. **Add sample data:**
   - Click "View" on the employees table
   - Add several records with different values
   - Example records:
     - John Doe, john@company.com, Engineering, 75000, 2023-01-15, ✓
     - Jane Smith, jane@company.com, Marketing, 65000, 2023-03-20, ✓
     - Bob Johnson, bob@company.com, Sales, 55000, 2022-11-10, ✗
     - Alice Brown, alice@company.com, HR, 60000, 2023-06-01, ✓

## Testing the Features

### Search Functionality
- Use the search bar to search across all fields
- Try searching for: "john", "engineering", "75000"
- Search is case-insensitive and works on partial matches

### Filtering
- Click the "Filters" button
- Filter by Department: "Engineering"
- Filter by Salary range
- Filter by Hire Date
- Combine multiple filters

### Sorting
- Click on any column header to sort
- Click again to reverse sort order
- Sort by Name, Email, Department, Salary, Hire Date
- Sort indicators show current sort state

### Pagination
- Change page size (10, 25, 50, 100)
- Navigate between pages
- See total count and current page info

## API Examples

### Search and Filter
```bash
# Search for "john"
GET /api/contents/employees?search=john

# Filter by department
GET /api/contents/employees?filters=department=Engineering

# Multiple filters
GET /api/contents/employees?filters=department=Engineering,salary=75000

# Sort by salary descending
GET /api/contents/employees?sortBy=salary&sortDir=desc

# Pagination
GET /api/contents/employees?page=1&pageSize=25

# Combined query
GET /api/contents/employees?search=john&filters=department=Engineering&sortBy=salary&sortDir=desc&page=1&pageSize=10
```

## Features Demonstrated

✅ **Global Search**: Searches across all JSON fields  
✅ **Field-Specific Filtering**: Filter by individual field values  
✅ **Dynamic Sorting**: Sort by any field (including JSON values)  
✅ **Pagination**: Configurable page sizes and navigation  
✅ **Real-time Updates**: UI updates immediately after operations  
✅ **Responsive Design**: Works on all screen sizes  
✅ **Type-Safe**: Full TypeScript support  

## Backend Implementation

- **Dynamic SQL Generation**: Builds queries based on JSONB fields
- **Parameterized Queries**: Prevents SQL injection
- **Efficient Indexing**: Uses GIN indexes for JSON fields
- **Flexible Sorting**: Handles both metadata and dynamic field sorting

## Frontend Implementation

- **Debounced Search**: 300ms delay to prevent excessive API calls
- **State Management**: Centralized state for all query parameters
- **Component Composition**: Reusable components for search, filter, sorting
- **Accessibility**: Proper ARIA labels and keyboard navigation
