# 🚀 PocketBase MCP Server

Un serveur MCP (Model Context Protocol) complet pour gérer les migrations PocketBase via API REST. Génère et exécute des migrations pour créer, modifier et supprimer des collections PocketBase.

## 📥 Installation depuis GitHub

### Cloner et installer

```bash
# Cloner le dépôt
git clone https://github.com/Step-by-Step-technology/pocketbase-mcp.git
cd pocketbase-mcp

# Installer les dépendances
npm install

# Compiler TypeScript
npm run build
```

### Configuration rapide

1. **Créez un fichier de configuration MCP** (`~/.claude_desktop_config.json` ou équivalent):

```json
{
  "mcpServers": {
    "pocketbase-mcp": {
      "command": "node",
      "args": ["/chemin/absolu/vers/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_TOKEN": "votre_token_admin_pocketbase",
        "POCKETBASE_MIGRATIONS_DIR": "/chemin/absolu/vers/pb_migrations"
      }
    }
  }
}
```

1. **Redémarrez votre client MCP** (Claude Desktop, Cursor, etc.)

2. **Testez l'installation**:

   ```bash
   # Démarrer le serveur en mode développement
   npm run dev
   ```

### 📦 Installation globale (optionnel)

```bash
# Installer globalement (si vous voulez l'utiliser comme CLI)
npm install -g .

# Puis exécuter
pocketbase-mcp
```

**Dépôt GitHub:** <https://github.com/Step-by-Step-technology/pocketbase-mcp>

## ✨ Fonctionnalités

### ✅ Outils Disponibles

| Outil | Description | Statut |
|-------|-------------|--------|
| `pocketbase-create-collection-migration` | Génère une migration pour créer une nouvelle collection | ✅ Fonctionne parfaitement |
| `pocketbase-update-collection` | Génère une migration pour modifier les règles d'une collection | ✅ Nouveau |
| `pocketbase-delete-collection` | Génère une migration pour supprimer une collection | ✅ Nouveau |
| `pocketbase-update-collection-fields` | Génère une migration pour modifier les champs d'une collection | ✅ Nouveau |
| `pocketbase-add-field-migration` | Génère une migration pour ajouter un seul champ à une collection | ✅ **NOUVEAU** |
| `pocketbase-remove-field-migration` | Génère une migration pour supprimer un seul champ d'une collection | ✅ **NOUVEAU** |
| `pocketbase-revert-migration` | Génère une migration pour revenir en arrière sur une migration précédente | ✅ **NOUVEAU** |
| `pocketbase-execute-any-migration` | Exécute n'importe quel type de migration (création, modification, suppression) | ✅ Amélioré |
| `pocketbase-execute-migration` | Exécute une migration de création (outil original préservé) | ✅ Fonctionne parfaitement |
| `pocketbase-list-migrations` | Liste toutes les migrations disponibles | ✅ Existant |
| `pocketbase-view-migration` | Affiche le contenu d'une migration | ✅ Existant |
| `pocketbase-list-collections` | Liste toutes les collections PocketBase | ✅ Existant |
| `pocketbase-view-collection` | Affiche les détails d'une collection | ✅ Existant |

## 🚀 Installation (Alternative)

Si vous avez déjà cloné le projet localement ou si vous travaillez sur une version existante:

### Prérequis

- Node.js 18+
- PocketBase en cours d'exécution
- Token d'administration PocketBase

### Installation locale

```bash
# Se déplacer dans le dossier pocketbase-mcp
cd pocketbase-mcp

# Installer les dépendances
npm install

# Compiler TypeScript
npm run build
```

**Note:** Pour une installation complète depuis GitHub, référez-vous à la section [📥 Installation depuis GitHub](#-installation-depuis-github) ci-dessus.

### Configuration

Les variables d'environnement sont configurées dans le fichier de configuration MCP (`cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "pocketbase-mcp": {
      "command": "node",
      "args": ["/chemin/absolu/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_TOKEN": "votre_token_admin_pocketbase",
        "POCKETBASE_MIGRATIONS_DIR": "/chemin/absolu/pb_migrations"
      }
    }
  }
}
```

**Variables requises:**

- `POCKETBASE_URL`: URL de votre instance PocketBase (ex: `http://127.0.0.1:8090`)
- `POCKETBASE_TOKEN`: Token d'administration PocketBase (obtenu via l'interface admin)
- `POCKETBASE_MIGRATIONS_DIR`: Chemin absolu vers le répertoire des migrations

## 📦 Structure du Projet

```
pocketbase-mcp/
├── src/
│   ├── index.ts                    # Point d'entrée MCP
│   ├── pocketbase-migration.ts     # Générateur de migrations
│   └── pocketbase-tools.ts         # Tous les outils MCP
├── dist/                           # Fichiers compilés
├── pb_migrations/                  # Migrations générées
├── package.json
├── tsconfig.json
├── README.md
└── GUIDE_COMPLET.md
```

## 🛠️ Utilisation

### Démarrer le Serveur MCP

```bash
# Développement
npm run dev

# Production
npm run build
node dist/index.js
```

### Configuration Claude Desktop

Ajoutez à `~/.claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pocketbase-mcp": {
      "command": "node",
      "args": ["/chemin/absolu/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_TOKEN": "votre_token",
        "POCKETBASE_MIGRATIONS_DIR": "/chemin/absolu/pb_migrations"
      }
    }
  }
}
```

## 📝 Exemples Complets

### 1. Créer une Collection

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

### 2. Modifier les Règles d'une Collection

```json
{
  "collectionName": "products",
  "listRule": "@request.auth.id != ''",
  "createRule": "@request.auth.id != ''",
  "updateRule": "@request.auth.id != ''",
  "deleteRule": "@request.auth.id != ''"
}
```

### 3. Modifier les Champs d'une Collection

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

### 4. Supprimer une Collection

```json
{
  "collectionName": "old_collection"
}
```

### 5. Exécuter une Migration

```json
{
  "migrationFile": "1768985344_update_products.js"
}
```

### 6. Ajouter un Champ à une Collection

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

### 7. Supprimer un Champ d'une Collection

```json
{
  "collectionName": "products",
  "fieldName": "stock"
}
```

### 8. Revenir en Arrière sur une Migration

```json
{
  "migrationFile": "1768987877_add_field_stock_to_products.js"
}
```

## 🔄 Workflow Complet

### Étape 1: Créer une Migration

```bash
# Utiliser l'outil pocketbase-create-collection-migration
# → Génère un fichier dans pb_migrations/
```

### Étape 2: Exécuter la Migration

```bash
# Utiliser l'outil pocketbase-execute-any-migration
# → Exécute la migration via API REST
```

### Étape 3: Vérifier

```bash
# Utiliser pocketbase-list-collections
# → Vérifie que la collection a été créée
```

### Étape 4: Modifier si nécessaire

```bash
# Utiliser pocketbase-update-collection
# → Génère une migration de modification
# → Exécuter avec pocketbase-execute-any-migration
```

## 🎯 Cas d'Utilisation Avancés

### Migration de Création avec Règles d'Authentification

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

### Migration de Collection d'Authentification

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

## ⚙️ Configuration Technique

### Variables d'Environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `POCKETBASE_URL` | URL de l'instance PocketBase | `http://127.0.0.1:8090` |
| `POCKETBASE_TOKEN` | Token d'administration PocketBase | (requis) |
| `POCKETBASE_ADMIN_TOKEN` | Alternative au token | (optionnel) |
| `POCKETBASE_MIGRATIONS_DIR` | Répertoire des migrations | `./pb_migrations` |

### Scripts NPM

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  }
}
```

## 🆕 Nouvelles Fonctionnalités (Janvier 2026)

### ✨ Ajout de 3 Nouveaux Outils

#### 1. **`pocketbase-add-field-migration`**

- **Objectif**: Ajouter un seul champ à une collection existante
- **Avantage**: Granularité fine - pas besoin de réécrire tous les champs
- **Exemple d'utilisation**:

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

- **Objectif**: Supprimer un seul champ d'une collection existante
- **Avantage**: Suppression ciblée sans affecter les autres champs
- **Exemple d'utilisation**:

  ```json
  {
    "collectionName": "products",
    "fieldName": "stock"
  }
  ```

#### 3. **`pocketbase-revert-migration`**

- **Objectif**: Revenir en arrière sur une migration précédente
- **Avantage**: Sécurité - possibilité d'annuler les changements
- **Exemple d'utilisation**:

  ```json
  {
    "migrationFile": "1768987877_add_field_stock_to_products.js"
  }
  ```

### 🔧 Amélioration de `pocketbase-execute-any-migration`

- **Nouvelle détection**: Reconnaît maintenant 6 types de migrations:
  1. `create` - Création de collection
  2. `update` - Modification de règles
  3. `update_fields` - Modification de tous les champs
  4. `add_field` - Ajout d'un seul champ
  5. `remove_field` - Suppression d'un seul champ
  6. `delete` - Suppression de collection

- **Compatibilité**: Ne casse pas l'existant - l'outil original `pocketbase-execute-migration` est préservé

## 🧪 Tests

Le projet a été testé avec succès avec:

- ✅ **Tests manuels** de toutes les fonctionnalités
- ✅ **Migrations réelles** exécutées sur PocketBase
- ✅ **Validation complète** des 13 outils MCP
- ✅ **Tests des nouvelles fonctionnalités**:
  - Ajout de champ: ✅ Fonctionne
  - Suppression de champ: ✅ Fonctionne
  - Revert de migration: ✅ Fonctionne

Pour tester le serveur MCP:

```bash
# Démarrer le serveur en mode développement
npm run dev

# Puis utiliser les outils via Claude Desktop ou autre client MCP
```

## 🔧 Développement

### Structure du Code

- **`src/pocketbase-migration.ts`**: Logique de génération des migrations
  - `createMigrationFile()`: Création de collections
  - `createUpdateMigrationFile()`: Modification de collections
  - `createDeleteMigrationFile()`: Suppression de collections
  - `createUpdateFieldsMigrationFile()`: Modification de champs
  - `parseMigrationFields()`: Parsing des champs depuis les migrations

- **`src/pocketbase-tools.ts`**: Définition des outils MCP
  - 10 outils complets avec validation Zod
  - Gestion d'erreurs robuste
  - API REST vers PocketBase

- **`src/index.ts`**: Serveur MCP principal
  - Configuration du serveur
  - Gestion des connexions
  - Logging et monitoring

### Ajouter un Nouvel Outil

1. Ajouter la définition dans `pocketbase-tools.ts`
2. Implémenter la logique métier
3. Tester manuellement avec les outils MCP
4. Documenter dans le README

## 📊 Statistiques du Projet

- **10 outils MCP** complets
- **4 types de migrations** supportés (création, modification, suppression, modification de champs)
- **100% TypeScript** avec validation Zod
- **API REST complète** vers PocketBase
- **Gestion d'erreurs** robuste
- **Documentation complète**

## 🚀 Déploiement sur GitHub

### Préparer le Projet pour GitHub

```bash
# Initialiser git
git init

# Ajouter les fichiers
git add .

# Commit initial
git commit -m "Initial commit: PocketBase MCP Server complet"

# Créer un repo sur GitHub
# Lier le repo distant
git remote add origin https://github.com/votre-username/pocketbase-mcp.git

# Pousser le code
git push -u origin main
```

### Fichiers à Inclure dans .gitignore

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/

# Environment variables
.env
.env.local

# PocketBase migrations (optionnel)
pb_migrations/

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### Package.json pour Publication

Assurez-vous que votre `package.json` contient:

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
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [Model Context Protocol](https://modelcontextprotocol.io) pour le framework MCP
- [PocketBase](https://pocketbase.io) pour l'excellente base de données
- La communauté Claude pour les outils d'IA

## 📞 Support

Pour les questions et le support:

- Ouvrir une issue sur GitHub
- Consulter la documentation complète dans `GUIDE_COMPLET.md`

---

**✨ Fonctionnalité Unique:** Ce serveur MCP préserve soigneusement l'outil original `pocketbase-execute-migration` qui fonctionne parfaitement pour les créations, tout en ajoutant de nouveaux outils pour les modifications et suppressions sans dégrader les fonctionnalités existantes.

**🚀 Prêt pour la production:** Testé avec succès sur des migrations réelles de création, modification et suppression de collections PocketBase.
