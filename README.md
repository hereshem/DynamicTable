# Dynamic Tables System

A full-stack application for creating and managing dynamic tables with custom fields and CRUD operations. Built with Go (backend) and React + Vite (frontend).

## Features

- **Dynamic Table Creation**: Create tables with custom field definitions
- **Flexible Field Types**: Support for text, number, date, time, datetime, file, options, checkbox, radio, textarea, email, URL, and phone fields
- **Field Validation**: Regex pattern validation for custom field rules
- **Full CRUD Operations**: Create, read, update, and delete table records
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS
- **Real-time Updates**: Immediate UI updates after operations

## Architecture

### Backend (Go)
- **Database**: PostgreSQL with JSONB support for flexible schema storage
- **Framework**: Gin for HTTP routing and middleware
- **Database Driver**: lib/pq for PostgreSQL connectivity
- **UUID Generation**: Google UUID library for unique identifiers

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Axios for API communication

## Database Schema

### Tables

#### `schema` Table
- `id` (UUID): Primary key
- `table_slug` (VARCHAR): Unique identifier for the table
- `table_name` (VARCHAR): Human-readable table name
- `fields` (JSONB): Array of field definitions
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

#### `contents` Table
- `id` (UUID): Primary key
- `table_slug` (VARCHAR): Foreign key to schema table
- `keys` (JSONB): Field names and identifiers
- `values` (JSONB): Actual field values
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## Field Types

| Type | Description | Input Control |
|------|-------------|---------------|
| `text` | Single line text | Text input |
| `number` | Numeric value | Number input |
| `date` | Date only | Date picker |
| `time` | Time only | Time picker |
| `datetime` | Date and time | DateTime picker |
| `file` | File upload | File input |
| `options` | Dropdown selection | Select dropdown |
| `checkbox` | Boolean value | Checkbox |
| `radio` | Single choice | Radio buttons |
| `textarea` | Multi-line text | Textarea |
| `email` | Email address | Email input |
| `url` | Web URL | URL input |
| `phone` | Phone number | Tel input |

## Setup Instructions

### Prerequisites

- Go 1.21 or later
- Node.js 16 or later
- PostgreSQL 12 or later
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Go dependencies:**
   ```bash
   go mod tidy
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE dynamic_tables;
   ```

5. **Run the backend:**
   ```bash
   go run main.go
   ```

The backend will start on port 8080 (or the port specified in your .env file).

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The frontend will start on port 3000 with proxy configuration to the backend.

### Production Build

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **The built files will be in the `dist` directory**

## API Endpoints

### Schema Management

- `POST /api/schemas` - Create new table schema
- `GET /api/schemas` - List all table schemas
- `GET /api/schemas/:tableSlug` - Get specific table schema
- `PUT /api/schemas/:tableSlug` - Update table schema
- `DELETE /api/schemas/:tableSlug` - Delete table schema

### Content Management

- `POST /api/contents/:tableSlug` - Create new record
- `GET /api/contents/:tableSlug` - List all records for a table
- `GET /api/contents/:tableSlug/:id` - Get specific record
- `PUT /api/contents/:tableSlug/:id` - Update record
- `DELETE /api/contents/:tableSlug/:id` - Delete record

## Usage

### Creating a New Table

1. Click "Create Table" button on the home page
2. Enter table name and slug
3. Add dynamic fields with:
   - Field name (internal identifier)
   - Field label (display name)
   - Data type (text, number, date, etc.)
   - Validation pattern (optional regex)
   - Required flag
   - Options (for dropdown/radio/checkbox fields)
4. Click "Create Table" to save

### Managing Table Records

1. Click "View" on any table to see its contents
2. Use "Add Record" to create new entries
3. Use "Edit" to modify existing records
4. Use "Delete" to remove records

### Field Validation

- **Required Fields**: Must have values before saving
- **Regex Validation**: Custom patterns for field format validation
- **Type Validation**: Automatic validation based on field type

## Development

### Project Structure

```
dynamic_table/
├── backend/
│   ├── database/          # Database connection and schema
│   ├── handlers/          # HTTP request handlers
│   ├── models/            # Data structures and types
│   ├── repository/        # Database operations
│   ├── routes/            # API route definitions
│   ├── go.mod             # Go module file
│   ├── main.go            # Application entry point
│   └── env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript type definitions
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── package.json       # Node.js dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS configuration
└── README.md              # This file
```

### Adding New Field Types

1. **Backend**: Add the new type to the `Field` struct in `models/models.go`
2. **Frontend**: 
   - Add the type to `DATA_TYPES` array in `types/index.ts`
   - Implement rendering logic in `ContentForm.tsx`
   - Add validation if needed

### Database Migrations

The current implementation creates tables automatically on startup. For production use, consider implementing proper database migrations.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials in `.env` file
   - Ensure database exists

2. **Frontend Can't Connect to Backend**
   - Verify backend is running on port 8080
   - Check proxy configuration in `vite.config.ts`
   - Ensure CORS is properly configured

3. **Port Already in Use**
   - Change port in `.env` file (backend)
   - Change port in `vite.config.ts` (frontend)

### Logs

- Backend logs are printed to console
- Frontend errors appear in browser console
- Check network tab for API request/response details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information
