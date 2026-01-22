# 🚀 PocketBase MCP Server

A complete MCP (Model Context Protocol) server for managing PocketBase migrations via REST API. Generates and executes migrations to create, modify, and delete PocketBase collections.

## 📥 Installation from GitHub

### Clone and install

```bash
# Clone the repository
git clone https://github.com/Step-by-Step-technology/pocketbase-mcp.git
cd pocketbase-mcp

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### Quick setup

1. **Create an MCP configuration file** (`~/.cline_desktop_config.json` or equivalent):

```json
{
  "mcpServers": {
    "pocketbase-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_TOKEN": "your_pocketbase_admin_token",
        "POCKETBASE_MIGRATIONS_DIR": "/absolute/path/to/pb_migrations"
      }
    }
  }
}
```

1. **Restart your MCP client** (Cline Desktop, Cursor, etc.)

2. **Test the installation**:

   ```bash
   # Start the server in development mode
   npm run dev
   ```

### 📦 Global installation (optional)

```bash
# Install globally (if you want to use it as CLI)
npm install -g .

# Then run
pocketbase-mcp
```

**GitHub Repository:** <https://github.com/Step-by-Step-technology/pocketbase-mcp>

## ✨ Features

### ✅ Available Tools (20 complete tools)

#### 🏗️ Migration Tools (13 tools)

| Tool | Description | Status |
|------|-------------|--------|
| `pocketbase-create-collection-migration` | Generates a migration to create a new collection (supports relation fields) | ✅ Works perfectly |
| `pocketbase-update-collection` | Generates a migration to modify collection rules | ✅ New |
| `pocketbase-delete-collection` | Generates a migration to delete a collection | ✅ New |
| `pocketbase-update-collection-fields` | Generates a migration to modify collection fields (supports relation fields) | ✅ New |
| `pocketbase-add-field-migration` | Generates a migration to add a single field to a collection (supports relation fields) | ✅ **NEW** |
| `pocketbase-remove-field-migration` | Generates a migration to remove a single field from a collection | ✅ **NEW** |
| `pocketbase-revert-migration` | Generates a migration to revert a previous migration | ✅ **NEW** |
| `pocketbase-execute-any-migration` | Executes any type of migration (creation, modification, deletion) - now supports relation fields | ✅ Improved |
| `pocketbase-execute-migration` | Executes a creation migration (original tool preserved) | ✅ Works perfectly |
| `pocketbase-list-migrations` | Lists all available migrations | ✅ Existing |
| `pocketbase-view-migration` | Displays the content of a migration | ✅ Existing |
| `pocketbase-list-collections` | Lists all PocketBase collections | ✅ Existing |
| `pocketbase-view-collection` | Displays collection details | ✅ Existing |

#### 📊 CRUD Tools (7 tools)

| Tool | Description | Status |
|------|-------------|--------|
| `pocketbase-fetch-record` | Fetches a specific record from a PocketBase collection | ✅ **NEW** |
| `pocketbase-list-records` | Lists all records from a collection with pagination | ✅ **NEW** |
| `pocketbase-create-record` | Creates a new record in a PocketBase collection | ✅ **NEW** |
| `pocketbase-update-record` | Updates an existing record in a PocketBase collection | ✅ **NEW** |
| `pocketbase-get-collection-schema` | Gets the schema (fields and types) of a collection | ✅ **NEW** |
| `pocketbase-upload-file` | Uploads a file to a PocketBase collection | ✅ **NEW** |
| `pocketbase-download-file` | Downloads a file from a PocketBase collection | ✅ **NEW** |

**Total: 20 complete MCP tools** - Migration + CRUD + File management

## 🚀 Installation (Alternative)

If you have already cloned the project locally or are working on an existing version:

### Prerequisites

- Node.js 18+
- PocketBase running
- PocketBase admin token

### Local installation

```bash
# Move to the pocketbase-mcp folder
cd pocketbase-mcp

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

**Note:** For a complete installation from GitHub, refer to the [📥 Installation from GitHub](#-installation-from-github) section above.

### Configuration

Environment variables are configured in the MCP configuration file (`cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "pocketbase-mcp": {
      "command": "node",
      "args": ["/absolute/path/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_TOKEN": "your_pocketbase_admin_token",
        "POCKETBASE_MIGRATIONS_DIR": "/absolute/path/pb_migrations"
      }
    }
  }
}
```

**Required variables:**

- `POCKETBASE_URL`: URL of your PocketBase instance (e.g., `http://127.0.0.1:8090`)
- `POCKETBASE_TOKEN`: PocketBase admin token (obtained via admin interface)
- `POCKETBASE_MIGRATIONS_DIR`: Absolute path to the migrations directory

## 📦 Project Structure

```
pocketbase-mcp/
├── src/
│   ├── index.ts                    # MCP entry point
│   ├── pocketbase-migration.ts     # Migration generator
│   └── pocketbase-tools.ts         # All MCP tools
├── dist/                           # Compiled files
├── pb_migrations/                  # Generated migrations
├── package.json
├── tsconfig.json
├── README.md
└── GUIDE_COMPLET.md
```

## 🛠️ Usage

### Start the MCP Server

```bash
# Development
npm run dev

# Production
npm run build
node dist/index.js
```

### Cline Desktop Configuration

Add to `~/.cline_desktop_config.json`:

```json
{
  "mcpServers": {
    "pocketbase-mcp": {
      "command": "node",
      "args": ["/absolute/path/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_TOKEN": "your_token",
        "POCKETBASE_MIGRATIONS_DIR": "/absolute/path/pb_migrations"
      }
    }
  }
}
```

## 📝 Complete Examples

### 1. Create a Collection

```json
{
  "collectionName": "products",
  "fields": [
    {
      "name": "title",
      "type": "text",
      "required": true,
      "max": 200
    },
    {
      "name": "price",
      "type": "number",
      "required": true,
      "min": 0
    },
    {
      "name": "category",
      "type": "select",
      "required": true,
      "values": ["electronics", "clothing", "books", "food", "home"]
    }
  ],
  "type": "base"
}
```

### 2. Modify Collection Rules

```json
{
  "collectionName": "products",
  "listRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id != ''",
  "updateRule": "@request.auth.id != ''",
  "deleteRule": "@request.auth.id != ''"
}
```

### 3. Modify Collection Fields

```json
{
  "collectionName": "products",
  "fields": [
    {
      "name": "title",
      "type": "text",
      "required": true,
      "max": 200
    },
    {
      "name": "description",
      "type": "text",
      "required": false,
      "max": 1000
    },
    {
      "name": "price",
      "type": "number",
      "required": true,
      "min": 0
    },
    {
      "name": "stock",
      "type": "number",
      "required": false,
      "min": 0
    }
  ]
}
```

### 4. Delete a Collection

```json
{
  "collectionName": "old_collection"
}
```

### 5. Execute a Migration

```json
{
  "migrationFile": "1768985344_update_products.js"
}
```

### 6. Add a Field to a Collection

```json
{
  "collectionName": "products",
  "field": {
    "name": "stock",
    "type": "number",
    "required": false,
    "min": 0
  }
}
```

### 7. Remove a Field from a Collection

```json
{
  "collectionName": "products",
  "fieldName": "stock"
}
```

### 8. Revert a Migration

```json
{
  "migrationFile": "1768987877_add_field_stock_to_products.js"
}
```

## 🔄 Complete Workflow

### Step 1: Create a Migration

```bash
# Use the pocketbase-create-collection-migration tool
# → Generates a file in pb_migrations/
```

### Step 2: Execute the Migration

```bash
# Use the pocketbase-execute-any-migration tool
# → Executes the migration via REST API
```

### Step 3: Verify

```bash
# Use pocketbase-list-collections
# → Verifies that the collection was created
```

### Step 4: Modify if necessary

```bash
# Use pocketbase-update-collection
# → Generates a modification migration
# → Execute with pocketbase-execute-any-migration
```

## 🎯 Advanced Use Cases

### Creation Migration with Authentication Rules

```json
{
  "collectionName": "user_posts",
  "fields": [
    {
      "name": "title",
      "type": "text",
      "required": true,
      "max": 200
    },
    {
      "name": "content",
      "type": "text",
      "required": false,
      "max": 5000
    }
  ],
  "listRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id != ''",
  "updateRule": "@request.auth.id = author",
  "deleteRule": "@request.auth.id = author"
}
```

### Authentication Collection Migration

```json
{
  "collectionName": "users",
  "type": "auth",
  "fields": [
    {
      "name": "username",
      "type": "text",
      "required": true,
      "max": 100
    },
    {
      "name": "avatar",
      "type": "file",
      "required": false,
      "maxSelect": 1
    }
  ]
}
```

## ⚙️ Technical Configuration

### Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `POCKETBASE_URL` | URL of the PocketBase instance | `http://127.0.0.1:8090` |
| `POCKETBASE_TOKEN` | PocketBase admin token | (required) |
| `POCKETBASE_ADMIN_TOKEN` | Alternative to token | (optional) |
| `POCKETBASE_MIGRATIONS_DIR` | Migrations directory | `./pb_migrations` |

### NPM Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  }
}
```

## 🆕 New Features (January 2026)

### ✨ Addition of 3 New Tools

#### 1. **`pocketbase-add-field-migration`**

- **Purpose**: Add a single field to an existing collection
- **Advantage**: Fine granularity - no need to rewrite all fields
- **Usage example**:

  ```json
  {
    "collectionName": "products",
    "field": {
      "name": "stock",
      "type": "number",
      "required": false,
      "min": 0
    }
  }
  ```

#### 2. **`pocketbase-remove-field-migration`**

- **Purpose**: Remove a single field from an existing collection
- **Advantage**: Targeted removal without affecting other fields
- **Usage example**:

  ```json
  {
    "collectionName": "products",
    "fieldName": "stock"
  }
  ```

#### 3. **`pocketbase-revert-migration`**

- **Purpose**: Revert a previous migration
- **Advantage**: Safety - ability to undo changes
- **Usage example**:

  ```json
  {
    "migrationFile": "1768987877_add_field_stock_to_products.js"
  }
  ```

### 🔧 Improvement of `pocketbase-execute-any-migration`

- **New detection**: Now recognizes 6 types of migrations:
  1. `create` - Collection creation
  2. `update` - Rule modification
  3. `update_fields` - Modification of all fields
  4. `add_field` - Addition of a single field
  5. `remove_field` - Removal of a single field
  6. `delete` - Collection deletion

- **Compatibility**: Doesn't break existing functionality - the original `pocketbase-execute-migration` tool is preserved

## 🔗 Relation Fields Support (January 2026)

### ✨ Enhanced Support for Relation Fields

The MCP server now fully supports **relation fields** in PocketBase collections. This includes creating, updating, and managing collections with foreign key relationships between collections.

#### Key Improvements

1. **Fixed `parseMigrationFields()` function** in `src/pocketbase-migration.ts`:
   - Correctly handles `collectionId` parameter for relation fields
   - Properly serializes relation field configurations
   - Supports `maxSelect` and `cascadeDelete` options

2. **Enhanced `pocketbase-execute-any-migration` tool**:
   - Now correctly processes migration files containing relation fields
   - Properly handles the execution of migrations with complex field relationships

3. **Updated `pocketbase-update-collection-fields` tool**:
   - Supports adding/modifying relation fields in existing collections
   - Maintains backward compatibility with existing collections

### 📋 Relation Field Examples

#### Creating a Collection with Relation Fields

```json
{
  "collectionName": "user_roles",
  "fields": [
    {
      "name": "user_ref",
      "type": "relation",
      "required": true,
      "collectionId": "users",
      "maxSelect": 1,
      "cascadeDelete": false
    },
    {
      "name": "role_ref",
      "type": "relation",
      "required": true,
      "collectionId": "roles",
      "maxSelect": 1,
      "cascadeDelete": false
    },
    {
      "name": "assigned_at",
      "type": "date",
      "required": true
    },
    {
      "name": "assigned_by",
      "type": "relation",
      "required": true,
      "collectionId": "users",
      "maxSelect": 1,
      "cascadeDelete": false
    }
  ],
  "type": "base"
}
```

#### Adding a Relation Field to an Existing Collection

```json
{
  "collectionName": "posts",
  "field": {
    "name": "author",
    "type": "relation",
    "required": true,
    "collectionId": "users",
    "maxSelect": 1,
    "cascadeDelete": true
  }
}
```

### 🛠️ Technical Details

The fixes address the following issues:

1. **Bug in `parseMigrationFields()`**: The function was not correctly handling the `collectionId` parameter for relation fields, causing migrations to fail when creating collections with relations.

2. **Migration Execution**: The `pocketbase-execute-any-migration` tool now properly detects and executes migrations containing relation fields without errors.

3. **Field Configuration**: Relation fields now support all PocketBase options:
   - `collectionId`: The ID of the related collection (required)
   - `maxSelect`: Maximum number of related records (default: 1)
   - `cascadeDelete`: Whether to delete related records when the parent is deleted (default: false)

### ✅ Testing

The relation field support has been thoroughly tested with:

- ✅ **Creating collections with relation fields**: Works perfectly
- ✅ **Adding relation fields to existing collections**: Works perfectly
- ✅ **Executing migrations with relation fields**: Works perfectly
- ✅ **Real-world use case**: User roles system with `users` ↔ `roles` relationships

### 🎯 Real-World Example: User Roles System

A complete user roles system was implemented using the enhanced relation field support:

1. **`roles` collection**: Stores role definitions (level 0-9, level 99 for super admin)
2. **`user_roles` collection**: Junction table linking users to roles with relation fields
3. **Access rules**: Configured with proper authentication rules
4. **Default role assignment**: All new users automatically get level 1 (basic user)

This demonstrates the practical application of the relation field support in building complex database schemas with PocketBase.

## 🧪 Testing

The project has been successfully tested with:

- ✅ **Manual tests** of all features
- ✅ **Real migrations** executed on PocketBase
- ✅ **Complete validation** of the 13 MCP tools
- ✅ **Tests of new features**:
  - Field addition: ✅ Works
  - Field removal: ✅ Works
  - Migration revert: ✅ Works

To test the MCP server:

```bash
# Start the server in development mode
npm run dev

# Then use the tools via Cline Desktop or other MCP client
```

## 🔧 Development

### Code Structure

- **`src/pocketbase-migration.ts`**: Migration generation logic
  - `createMigrationFile()`: Collection creation
  - `createUpdateMigrationFile()`: Collection modification
  - `createDeleteMigrationFile()`: Collection deletion
  - `createUpdateFieldsMigrationFile()`: Field modification
  - `parseMigrationFields()`: Parsing fields from migrations

- **`src/pocketbase-tools.ts`**: MCP tool definitions
  - 10 complete tools with Zod validation
  - Robust error handling
  - REST API to PocketBase

- **`src/index.ts`**: Main MCP server
  - Server configuration
  - Connection management
  - Logging and monitoring

### Add a New Tool

1. Add the definition in `pocketbase-tools.ts`
2. Implement the business logic
3. Test manually with MCP tools
4. Document in the README

## 📊 Project Statistics

- **10 complete MCP tools**
- **4 types of migrations** supported (creation, modification, deletion, field modification)
- **100% TypeScript** with Zod validation
- **Complete REST API** to PocketBase
- **Robust error handling**
- **Complete documentation**

## 🚀 Deployment on GitHub

### Prepare the Project for GitHub

```bash
# Initialize git
git init

# Add files
git add .

# Initial commit
git commit -m "Initial commit: Complete PocketBase MCP Server"

# Create a repo on GitHub
# Link the remote repo
git remote add origin https://github.com/your-username/pocketbase-mcp.git

# Push the code
git push -u origin main
```

### Files to Include in .gitignore

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/

# Environment variables
.env
.env.local

# PocketBase migrations (optional)
pb_migrations/

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### Package.json for Publication

Make sure your `package.json` contains:

```json
{
  "name": "pocketbase-mcp",
  "version": "1.0.0",
  "description": "MCP Server for PocketBase migrations",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "keywords": ["mcp", "pocketbase", "migrations", "database"],
  "author": "Step by Step",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
