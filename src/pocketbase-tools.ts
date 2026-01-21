/**
 * MCP Server Tool - Créer des Collections PocketBase
 * Génère et crée des fichiers de migration PocketBase
 */

import { z } from 'zod';
import {
  createMigrationFile,
  parseMigrationFields,
  CollectionDefinition,
  FieldDefinition,
  createUpdateMigrationFile,
  createDeleteMigrationFile,
  createUpdateFieldsMigrationFile,
  createAddFieldMigrationFile,
  createRemoveFieldMigrationFile,
  createRevertMigrationFile
} from './pocketbase-migration.js';
import { registerPocketbaseCrudTools } from './pocketbase-crud-tools.js';
import * as fs from 'fs';
import * as path from 'path';

// Schéma Zod pour validation
const FieldSchema = z.object({
  name: z.string().describe('Nom du champ'),
  type: z.enum(['text', 'number', 'email', 'url', 'bool', 'date', 'select', 'json', 'file', 'relation', 'autodate']).describe('Type de champ'),
  required: z.boolean().optional().describe('Le champ est obligatoire'),
  max: z.number().optional().describe('Longueur max (pour text)'),
  min: z.number().optional().describe('Valeur min (pour number)'),
  nonZero: z.boolean().optional().describe('Contrainte non zero (pour les champs number)'),
  values: z.array(z.string()).optional().describe('Options (pour select)'),
  collectionId: z.string().optional().describe('ID collection (pour relation)'),
  maxSelect: z.number().optional().describe('Nombre max de sélections'),
  cascadeDelete: z.boolean().optional().describe('Supprimer les relations'),
});

const CreateCollectionSchema = z.object({
  collectionName: z.string().describe('Nom de la collection'),
  fields: z.array(FieldSchema).describe('Liste des champs'),
  type: z.enum(['base', 'auth']).optional().default('base').describe('Type de collection'),
  listRule: z.string().optional().nullable().describe('Règle de lecture'),
  createRule: z.string().optional().nullable().describe('Règle de création'),
  updateRule: z.string().optional().nullable().describe('Règle de modification'),
  deleteRule: z.string().optional().nullable().describe('Règle de suppression'),
});

/**
 * Outil MCP pour créer des migrations PocketBase
 */
export function registerPocketbaseTools(server: any) {
  server.registerTool(
    'pocketbase-create-collection-migration',
    {
      title: 'Créer une Migration de Collection PocketBase',
      description: 'Génère un fichier de migration PocketBase au format correct avec les champs spécifiés',
      inputSchema: CreateCollectionSchema,
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
      },
    },
    async (input: any) => {
      try {
        const collectionDef: CollectionDefinition = {
          name: input.collectionName,
          type: input.type || 'base',
          fields: input.fields as FieldDefinition[],
          listRule: input.listRule ?? null,
          createRule: input.createRule ?? null,
          updateRule: input.updateRule ?? null,
          deleteRule: input.deleteRule ?? null,
        };

        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Créer le fichier de migration
        const filePath = createMigrationFile(collectionDef, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `✅ Migration créée avec succès!\n\n📄 Fichier: ${filePath}\n\n📋 Contenu:\n\n${content}`,
            },
          ],
          structuredContent: {
            filePath,
            content,
            success: true,
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Erreur: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Outil pour vérifier les migrations existantes
   */
  server.registerTool(
    'pocketbase-list-migrations',
    {
      title: 'Lister les Migrations PocketBase',
      description: 'Liste tous les fichiers de migration dans le répertoire pb_migrations',
      inputSchema: z.object({}),
      outputSchema: {
        migrations: z.array(z.string()),
        count: z.number(),
      },
    },
    async () => {
      try {
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        if (!fs.existsSync(migrationsDir)) {
          return {
            content: [
              {
                type: 'text',
                text: `📁 Répertoire ${migrationsDir} n'existe pas encore`,
              },
            ],
            structuredContent: {
              migrations: [],
              count: 0,
            },
          };
        }

        const files = fs.readdirSync(migrationsDir)
          .filter(f => f.endsWith('.js'))
          .sort();

        return {
          content: [
            {
              type: 'text',
              text: `📋 ${files.length} migration(s) trouvée(s):\n\n${files.map(f => `  • ${f}`).join('\n')}`,
            },
          ],
          structuredContent: {
            migrations: files,
            count: files.length,
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Erreur: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Outil pour afficher le contenu d'une migration
   */
  server.registerTool(
    'pocketbase-view-migration',
    {
      title: 'Afficher le Contenu d\'une Migration',
      description: 'Affiche le contenu d\'un fichier de migration PocketBase',
      inputSchema: z.object({
        filename: z.string().describe('Nom du fichier de migration'),
      }),
      outputSchema: {
        content: z.string(),
      },
    },
    async (input: { filename: string }) => {
      try {
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';
        const filepath = path.join(migrationsDir, input.filename);

        // Vérifications de sécurité
        if (!filepath.startsWith(path.resolve(migrationsDir))) {
          throw new Error('Accès refusé: chemin invalide');
        }

        if (!fs.existsSync(filepath)) {
          throw new Error(`Fichier non trouvé: ${input.filename}`);
        }

        const content = fs.readFileSync(filepath, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `📄 ${input.filename}\n\n${content}`,
            },
          ],
          structuredContent: { content },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Erreur: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Outil pour exécuter une migration via API REST
   */
  server.registerTool(
    'pocketbase-execute-migration',
    {
      title: 'Exécuter une Migration PocketBase',
      description: 'Applique une migration via l\'API REST de PocketBase',
      inputSchema: z.object({
        migrationFile: z.string().describe('Nom du fichier de migration à exécuter'),
      }),
      outputSchema: { success: z.boolean(), collectionName: z.string().optional() }
    },
    async ({ migrationFile }: { migrationFile: string }) => {
      try {
        const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

        if (!adminToken) {
          throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
        }

        // Parser le fichier pour extraire le nom de collection
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';
        const filePath = path.join(migrationsDir, migrationFile);

        const content = fs.readFileSync(filePath, 'utf-8');
        const collectionMatch = content.match(/name:\s*"([^"]+)"/);
        const collectionName = collectionMatch ? collectionMatch[1] : 'unknown';

        // Extraire les champs du fichier migration
        const fields = parseMigrationFields(content);

        // Créer la collection via API REST
        const response = await fetch(`${pbUrl}/api/collections`, {
          method: 'POST',
          headers: {
            'Authorization': adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: collectionName,
            type: 'base',
            fields: fields.map(f => ({
              name: f.name,
              type: f.type,
              required: f.required || false,
              max: f.max || 0,
              min: f.min || 0,
              values: f.values || [],
            })),
            listRule: null,
            createRule: null,
            updateRule: null,
            deleteRule: null
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Erreur API');
        }

        return {
          content: [{
            type: 'text',
            text: `✅ Migration ${migrationFile} exécutée !\nCollection "${collectionName}" créée via API REST.`
          }],
          structuredContent: {
            success: true,
            collectionName,
            collectionId: result.id
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour lister les collections PocketBase
   */
  server.registerTool(
    'pocketbase-list-collections',
    {
      title: 'Lister les Collections PocketBase',
      description: 'Liste toutes les collections existantes dans PocketBase',
      inputSchema: z.object({}),
      outputSchema: {
        collections: z.array(z.string()),
        count: z.number(),
      },
    },
    async () => {
      try {
        const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

        if (!adminToken) {
          throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
        }

        const response = await fetch(`${pbUrl}/api/collections`, {
          method: 'GET',
          headers: {
            'Authorization': adminToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const result = await response.json();
        const collections = result.items.map((item: any) => item.name).sort();

        return {
          content: [{
            type: 'text',
            text: `📋 ${collections.length} collection(s) trouvée(s):\n\n${collections.map((c: string) => `  • ${c}`).join('\n')}`
          }],
          structuredContent: {
            collections,
            count: collections.length
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour voir les détails d'une collection
   */
  server.registerTool(
    'pocketbase-view-collection',
    {
      title: 'Voir les Détails d\'une Collection',
      description: 'Affiche les détails d\'une collection PocketBase (champs, règles, etc.)',
      inputSchema: z.object({
        collectionName: z.string().describe('Nom de la collection')
      }),
      outputSchema: {
        collection: z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          fields: z.array(z.any()),
          listRule: z.string().nullable(),
          createRule: z.string().nullable(),
          updateRule: z.string().nullable(),
          deleteRule: z.string().nullable(),
          created: z.string(),
          updated: z.string()
        })
      }
    },
    async ({ collectionName }: { collectionName: string }) => {
      try {
        const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

        if (!adminToken) {
          throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
        }

        // D'abord, obtenir la liste des collections pour trouver l'ID
        const listResponse = await fetch(`${pbUrl}/api/collections`, {
          method: 'GET',
          headers: {
            'Authorization': adminToken,
            'Content-Type': 'application/json'
          }
        });

        if (!listResponse.ok) {
          throw new Error(`Erreur API: ${listResponse.status}`);
        }

        const listResult = await listResponse.json();
        const collection = listResult.items.find((item: any) => item.name === collectionName);

        if (!collection) {
          throw new Error(`Collection "${collectionName}" non trouvée`);
        }

        // Obtenir les détails complets de la collection
        const detailResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
          method: 'GET',
          headers: {
            'Authorization': adminToken,
            'Content-Type': 'application/json'
          }
        });

        if (!detailResponse.ok) {
          throw new Error(`Erreur API: ${detailResponse.status}`);
        }

        const collectionDetails = await detailResponse.json();

        // Formater les champs pour l'affichage
        const fieldsText = collectionDetails.fields.map((field: any) =>
          `  • ${field.name} (${field.type})${field.required ? ' [requis]' : ''}${field.values ? ` valeurs: ${JSON.stringify(field.values)}` : ''}`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `📄 Collection: ${collectionDetails.name}\n` +
              `📋 Type: ${collectionDetails.type}\n` +
              `🆔 ID: ${collectionDetails.id}\n` +
              `📅 Créée: ${collectionDetails.created}\n` +
              `✏️ Modifiée: ${collectionDetails.updated}\n\n` +
              `📊 Champs (${collectionDetails.fields.length}):\n${fieldsText}\n\n` +
              `🔒 Règles:\n` +
              `  • Lecture: ${collectionDetails.listRule || 'null'}\n` +
              `  • Création: ${collectionDetails.createRule || 'null'}\n` +
              `  • Modification: ${collectionDetails.updateRule || 'null'}\n` +
              `  • Suppression: ${collectionDetails.deleteRule || 'null'}`
          }],
          structuredContent: {
            collection: collectionDetails
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour modifier une collection (génère une migration)
   */
  server.registerTool(
    'pocketbase-update-collection',
    {
      title: 'Modifier une Collection PocketBase',
      description: 'Génère une migration pour modifier les propriétés d\'une collection existante (règles, nom, etc.)',
      inputSchema: z.object({
        collectionName: z.string().describe('Nom de la collection à modifier'),
        newName: z.string().optional().describe('Nouveau nom de la collection'),
        listRule: z.string().optional().nullable().describe('Nouvelle règle de lecture'),
        createRule: z.string().optional().nullable().describe('Nouvelle règle de création'),
        updateRule: z.string().optional().nullable().describe('Nouvelle règle de modification'),
        deleteRule: z.string().optional().nullable().describe('Nouvelle règle de suppression')
      }),
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
        collectionName: z.string()
      }
    },
    async (input: {
      collectionName: string;
      newName?: string;
      listRule?: string | null;
      createRule?: string | null;
      updateRule?: string | null;
      deleteRule?: string | null;
    }) => {
      try {
        // Vérifier qu'au moins une modification est spécifiée
        const hasUpdates = input.newName !== undefined ||
          input.listRule !== undefined ||
          input.createRule !== undefined ||
          input.updateRule !== undefined ||
          input.deleteRule !== undefined;

        if (!hasUpdates) {
          throw new Error('Aucune modification spécifiée. Spécifiez au moins une propriété à modifier.');
        }

        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Préparer les données de mise à jour
        const updates = {
          newName: input.newName,
          listRule: input.listRule,
          createRule: input.createRule,
          updateRule: input.updateRule,
          deleteRule: input.deleteRule
        };

        // Créer le fichier de migration
        const filePath = createUpdateMigrationFile(input.collectionName, updates, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        const newName = input.newName || input.collectionName;

        return {
          content: [{
            type: 'text',
            text: `✅ Migration de modification générée avec succès!\n\n📄 Fichier: ${filePath}\n📝 Collection: ${input.collectionName} → ${newName}\n🔒 Modifications: ${Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined).join(', ')}\n\n📋 Contenu:\n\n${content}`
          }],
          structuredContent: {
            filePath,
            content,
            success: true,
            collectionName: newName
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour supprimer une collection (génère une migration)
   */
  server.registerTool(
    'pocketbase-delete-collection',
    {
      title: 'Supprimer une Collection PocketBase',
      description: 'Génère une migration pour supprimer une collection existante de PocketBase',
      inputSchema: z.object({
        collectionName: z.string().describe('Nom de la collection à supprimer')
      }),
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
        collectionName: z.string()
      }
    },
    async ({ collectionName }: { collectionName: string }) => {
      try {
        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Créer le fichier de migration
        const filePath = createDeleteMigrationFile(collectionName, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        return {
          content: [{
            type: 'text',
            text: `✅ Migration de suppression générée avec succès!\n\n📄 Fichier: ${filePath}\n🗑️ Collection à supprimer: ${collectionName}\n\n📋 Contenu:\n\n${content}`
          }],
          structuredContent: {
            filePath,
            content,
            success: true,
            collectionName
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour éditer les champs d'une collection (génère une migration)
   */
  server.registerTool(
    'pocketbase-update-collection-fields',
    {
      title: 'Éditer les Champs d\'une Collection',
      description: 'Génère une migration pour ajouter, modifier ou supprimer des champs d\'une collection PocketBase',
      inputSchema: z.object({
        collectionName: z.string().describe('Nom de la collection'),
        fields: z.array(FieldSchema).describe('Nouvelle liste de champs (remplace les champs existants)')
      }),
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
        collectionName: z.string(),
        fieldCount: z.number()
      }
    },
    async ({ collectionName, fields }: { collectionName: string; fields: any[] }) => {
      try {
        // Vérifier qu'il y a des champs
        if (!fields || fields.length === 0) {
          throw new Error('Aucun champ spécifié. Spécifiez au moins un champ.');
        }

        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Convertir les champs au format FieldDefinition
        const fieldDefinitions: FieldDefinition[] = fields.map(field => ({
          name: field.name,
          type: field.type,
          required: field.required || false,
          max: field.max,
          min: field.min,
          values: field.values,
          collectionId: field.collectionId,
          maxSelect: field.maxSelect,
          cascadeDelete: field.cascadeDelete
        }));

        // Créer le fichier de migration
        const filePath = createUpdateFieldsMigrationFile(collectionName, fieldDefinitions, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        return {
          content: [{
            type: 'text',
            text: `✅ Migration de modification de champs générée avec succès!\n\n📄 Fichier: ${filePath}\n📝 Collection: ${collectionName}\n📊 ${fields.length} champ(s) configuré(s):\n${fields.map(f => `  • ${f.name} (${f.type})${f.required ? ' [requis]' : ''}`).join('\n')}\n\n📋 Contenu:\n\n${content}`
          }],
          structuredContent: {
            filePath,
            content,
            success: true,
            collectionName,
            fieldCount: fields.length
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour exécuter n'importe quel type de migration (création, modification, suppression)
   * SANS dégrader l'outil pocketbase-execute-migration existant qui fonctionne parfaitement
   */
  server.registerTool(
    'pocketbase-execute-any-migration',
    {
      title: 'Exécuter une Migration PocketBase (tout type)',
      description: 'Exécute une migration PocketBase de création, modification ou suppression via API REST',
      inputSchema: z.object({
        migrationFile: z.string().describe('Nom du fichier de migration à exécuter'),
      }),
      outputSchema: {
        success: z.boolean(),
        collectionName: z.string().optional(),
        migrationType: z.string(),
        action: z.string()
      }
    },
    async ({ migrationFile }: { migrationFile: string }) => {
      try {
        const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const adminToken = process.env.POCKETBASE_TOKEN || process.env.POCKETBASE_ADMIN_TOKEN;

        if (!adminToken) {
          throw new Error('POCKETBASE_TOKEN ou POCKETBASE_ADMIN_TOKEN manquant');
        }

        // Lire le fichier de migration
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';
        const filePath = path.join(migrationsDir, migrationFile);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Déterminer le type de migration en analysant le contenu
        let migrationType = 'unknown';
        let collectionName = 'unknown';
        let action = 'unknown';

        // Chercher le nom de la collection - priorité à findCollectionByNameOrId
        let nameMatch = content.match(/\$app\.findCollectionByNameOrId\("([^"]+)"\)/);
        if (!nameMatch) {
          nameMatch = content.match(/Collection\s+"([^"]+)"/);
        }
        if (!nameMatch) {
          nameMatch = content.match(/Update fields of ([a-zA-Z_]+) collection/);
        }
        if (!nameMatch) {
          nameMatch = content.match(/Update ([a-zA-Z_]+) collection/);
        }
        if (!nameMatch) {
          nameMatch = content.match(/Create ([a-zA-Z_]+) collection/);
        }
        if (!nameMatch) {
          nameMatch = content.match(/Delete ([a-zA-Z_]+) collection/);
        }
        if (nameMatch) {
          collectionName = nameMatch[1];
        }

        // Déterminer le type de migration
        // Chercher d'abord dans la fonction principale (avant le rollback)
        const mainFunctionMatch = content.match(/migrate\(\(db\) => \{(.*?)\}, \(db\) => \{/s);
        const mainFunction = mainFunctionMatch ? mainFunctionMatch[1] : content;

        if (mainFunction.includes('$app.delete(collection)')) {
          migrationType = 'delete';
          action = 'Suppression de collection';
        } else if (mainFunction.includes('new Collection({')) {
          migrationType = 'create';
          action = 'Création de collection';
        } else if (mainFunction.includes('collection.listRule =') || mainFunction.includes('collection.name =')) {
          migrationType = 'update';
          action = 'Modification de collection';
        } else if (mainFunction.includes('collection.fields = [')) {
          migrationType = 'update_fields';
          action = 'Modification de champs';
        } else if (mainFunction.includes('collection.fields.push(')) {
          migrationType = 'add_field';
          action = 'Ajout de champ';
        } else if (mainFunction.includes('.filter(f => f.name !==')) {
          migrationType = 'remove_field';
          action = 'Suppression de champ';
        }

        // Pour les migrations de création, utiliser l'outil existant qui fonctionne parfaitement
        if (migrationType === 'create') {
          // Utiliser la logique existante de pocketbase-execute-migration
          const fields = parseMigrationFields(content);

          const response = await fetch(`${pbUrl}/api/collections`, {
            method: 'POST',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: collectionName,
              type: 'base',
              fields: fields.map(f => ({
                name: f.name,
                type: f.type,
                required: f.required || false,
                max: f.max || 0,
                min: f.min || 0,
                values: f.values || [],
              })),
              listRule: null,
              createRule: null,
              updateRule: null,
              deleteRule: null
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Erreur API');
          }

          return {
            content: [{
              type: 'text',
              text: `✅ Migration ${migrationFile} exécutée !\n📋 Type: ${action}\n📄 Collection: "${collectionName}" créée via API REST.`
            }],
            structuredContent: {
              success: true,
              collectionName,
              migrationType,
              action
            }
          };
        }
        // Pour les migrations de modification, utiliser l'API PATCH
        else if (migrationType === 'update' || migrationType === 'update_fields') {
          // D'abord, obtenir la liste des collections pour trouver l'ID
          const listResponse = await fetch(`${pbUrl}/api/collections`, {
            method: 'GET',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!listResponse.ok) {
            throw new Error(`Erreur API: ${listResponse.status}`);
          }

          const listResult = await listResponse.json();
          const collection = listResult.items.find((item: any) => item.name === collectionName);

          if (!collection) {
            throw new Error(`Collection "${collectionName}" non trouvée`);
          }

          // Pour les modifications de champs, extraire les nouveaux champs
          if (migrationType === 'update_fields') {
            const fields = parseMigrationFields(content);

            const updateData = {
              fields: fields.map(f => ({
                name: f.name,
                type: f.type,
                required: f.required || false,
                max: f.max || 0,
                min: f.min || 0,
                values: f.values || [],
              }))
            };

            const updateResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': adminToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
              const error = await updateResponse.json();
              throw new Error(error.message || `Erreur API: ${updateResponse.status}`);
            }

            const result = await updateResponse.json();

            return {
              content: [{
                type: 'text',
                text: `✅ Migration ${migrationFile} exécutée !\n📋 Type: ${action}\n📄 Collection: "${collectionName}" modifiée (${fields.length} champs) via API REST.`
              }],
              structuredContent: {
                success: true,
                collectionName,
                migrationType,
                action
              }
            };
          }
          // Pour les modifications de règles
          else {
            // Extraire les modifications depuis le fichier
            const updates: any = {};

            if (content.includes('collection.listRule =')) {
              const match = content.match(/collection\.listRule\s*=\s*"([^"]*)"/) || content.match(/collection\.listRule\s*=\s*null/);
              if (match) {
                updates.listRule = match[1] === 'null' ? null : match[1];
              }
            }

            if (content.includes('collection.createRule =')) {
              const match = content.match(/collection\.createRule\s*=\s*"([^"]*)"/) || content.match(/collection\.createRule\s*=\s*null/);
              if (match) {
                updates.createRule = match[1] === 'null' ? null : match[1];
              }
            }

            if (content.includes('collection.updateRule =')) {
              const match = content.match(/collection\.updateRule\s*=\s*"([^"]*)"/) || content.match(/collection\.updateRule\s*=\s*null/);
              if (match) {
                updates.updateRule = match[1] === 'null' ? null : match[1];
              }
            }

            if (content.includes('collection.deleteRule =')) {
              const match = content.match(/collection\.deleteRule\s*=\s*"([^"]*)"/) || content.match(/collection\.deleteRule\s*=\s*null/);
              if (match) {
                updates.deleteRule = match[1] === 'null' ? null : match[1];
              }
            }

            const updateResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': adminToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updates)
            });

            if (!updateResponse.ok) {
              const error = await updateResponse.json();
              throw new Error(error.message || `Erreur API: ${updateResponse.status}`);
            }

            const result = await updateResponse.json();

            return {
              content: [{
                type: 'text',
                text: `✅ Migration ${migrationFile} exécutée !\n📋 Type: ${action}\n📄 Collection: "${collectionName}" modifiée (${Object.keys(updates).join(', ')}) via API REST.`
              }],
              structuredContent: {
                success: true,
                collectionName,
                migrationType,
                action
              }
            };
          }
        }
        // Pour les migrations de suppression
        else if (migrationType === 'delete') {
          // D'abord, obtenir la liste des collections pour trouver l'ID
          const listResponse = await fetch(`${pbUrl}/api/collections`, {
            method: 'GET',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!listResponse.ok) {
            throw new Error(`Erreur API: ${listResponse.status}`);
          }

          const listResult = await listResponse.json();
          const collection = listResult.items.find((item: any) => item.name === collectionName);

          if (!collection) {
            throw new Error(`Collection "${collectionName}" non trouvée`);
          }

          const deleteResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!deleteResponse.ok) {
            const error = await deleteResponse.json();
            throw new Error(error.message || `Erreur API: ${deleteResponse.status}`);
          }

          return {
            content: [{
              type: 'text',
              text: `✅ Migration ${migrationFile} exécutée !\n📋 Type: ${action}\n🗑️ Collection: "${collectionName}" supprimée via API REST.`
            }],
            structuredContent: {
              success: true,
              collectionName,
              migrationType,
              action
            }
          };
        }
        // Pour les migrations d'ajout de champ
        else if (migrationType === 'add_field') {
          // D'abord, obtenir la liste des collections pour trouver l'ID
          const listResponse = await fetch(`${pbUrl}/api/collections`, {
            method: 'GET',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!listResponse.ok) {
            throw new Error(`Erreur API: ${listResponse.status}`);
          }

          const listResult = await listResponse.json();
          const collection = listResult.items.find((item: any) => item.name === collectionName);

          if (!collection) {
            throw new Error(`Collection "${collectionName}" non trouvée`);
          }

          // Obtenir les détails actuels de la collection
          const detailResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'GET',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!detailResponse.ok) {
            throw new Error(`Erreur API: ${detailResponse.status}`);
          }

          const collectionDetails = await detailResponse.json();

          // Extraire le champ à ajouter depuis le fichier de migration
          const fieldMatch = content.match(/new (\w+)Field\({([^}]+)}\)/);
          if (!fieldMatch) {
            throw new Error('Impossible d\'extraire les détails du champ à ajouter');
          }

          const fieldType = fieldMatch[1].toLowerCase();
          const fieldProps = fieldMatch[2];

          // Parser les propriétés du champ
          const nameMatch = fieldProps.match(/name:\s*"([^"]+)"/);
          const idMatch = fieldProps.match(/id:\s*"([^"]+)"/);
          const requiredMatch = fieldProps.match(/required:\s*(true|false)/);
          const minMatch = fieldProps.match(/min:\s*(\d+)/);

          if (!nameMatch) {
            throw new Error('Nom du champ non trouvé dans la migration');
          }

          const fieldName = nameMatch[1];
          const fieldId = idMatch ? idMatch[1] : fieldName;

          // Créer l'objet champ
          const newField: any = {
            name: fieldName,
            type: fieldType,
            required: requiredMatch ? requiredMatch[1] === 'true' : false,
            id: fieldId
          };

          if (minMatch && fieldType === 'number') {
            newField.min = parseInt(minMatch[1]);
          }

          // Ajouter le nouveau champ à la liste existante
          const updatedFields = [...collectionDetails.fields, newField];

          // Mettre à jour la collection avec le nouveau champ
          const updateResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: updatedFields
            })
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(error.message || `Erreur API: ${updateResponse.status}`);
          }

          const result = await updateResponse.json();

          return {
            content: [{
              type: 'text',
              text: `✅ Migration ${migrationFile} exécutée !\n📋 Type: ${action}\n📄 Collection: "${collectionName}" modifiée\n📊 Champ ajouté: ${fieldName} (${fieldType}) via API REST.`
            }],
            structuredContent: {
              success: true,
              collectionName,
              migrationType,
              action,
              fieldName,
              fieldType
            }
          };
        }
        // Pour les migrations de suppression de champ
        else if (migrationType === 'remove_field') {
          // D'abord, obtenir la liste des collections pour trouver l'ID
          const listResponse = await fetch(`${pbUrl}/api/collections`, {
            method: 'GET',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!listResponse.ok) {
            throw new Error(`Erreur API: ${listResponse.status}`);
          }

          const listResult = await listResponse.json();
          const collection = listResult.items.find((item: any) => item.name === collectionName);

          if (!collection) {
            throw new Error(`Collection "${collectionName}" non trouvée`);
          }

          // Obtenir les détails actuels de la collection
          const detailResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'GET',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            }
          });

          if (!detailResponse.ok) {
            throw new Error(`Erreur API: ${detailResponse.status}`);
          }

          const collectionDetails = await detailResponse.json();

          // Extraire le nom du champ à supprimer depuis le fichier de migration
          const fieldNameMatch = content.match(/\.filter\(f => f\.name !== "([^"]+)"/);
          if (!fieldNameMatch) {
            throw new Error('Impossible d\'extraire le nom du champ à supprimer');
          }

          const fieldNameToRemove = fieldNameMatch[1];

          // Filtrer le champ à supprimer
          const updatedFields = collectionDetails.fields.filter((field: any) => field.name !== fieldNameToRemove);

          // Mettre à jour la collection sans le champ
          const updateResponse = await fetch(`${pbUrl}/api/collections/${collection.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': adminToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: updatedFields
            })
          });

          if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(error.message || `Erreur API: ${updateResponse.status}`);
          }

          const result = await updateResponse.json();

          return {
            content: [{
              type: 'text',
              text: `✅ Migration ${migrationFile} exécutée !\n📋 Type: ${action}\n📄 Collection: "${collectionName}" modifiée\n🗑️ Champ supprimé: ${fieldNameToRemove} via API REST.`
            }],
            structuredContent: {
              success: true,
              collectionName,
              migrationType,
              action,
              fieldName: fieldNameToRemove
            }
          };
        }
        else {
          throw new Error(`Type de migration non supporté: ${migrationType}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour ajouter un champ à une collection (génère une migration)
   */
  server.registerTool(
    'pocketbase-add-field-migration',
    {
      title: 'Ajouter un Champ à une Collection',
      description: 'Génère une migration pour ajouter un seul champ à une collection existante',
      inputSchema: z.object({
        collectionName: z.string().describe('Nom de la collection'),
        field: FieldSchema.describe('Champ à ajouter')
      }),
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
        collectionName: z.string(),
        fieldName: z.string()
      }
    },
    async ({ collectionName, field }: { collectionName: string; field: any }) => {
      try {
        // Vérifier que le champ est spécifié
        if (!field) {
          throw new Error('Aucun champ spécifié.');
        }

        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Convertir le champ au format FieldDefinition
        const fieldDefinition: FieldDefinition = {
          name: field.name,
          type: field.type,
          required: field.required || false,
          max: field.max,
          min: field.min,
          values: field.values,
          collectionId: field.collectionId,
          maxSelect: field.maxSelect,
          cascadeDelete: field.cascadeDelete
        };

        // Créer le fichier de migration
        const filePath = createAddFieldMigrationFile(collectionName, fieldDefinition, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        return {
          content: [{
            type: 'text',
            text: `✅ Migration d'ajout de champ générée avec succès!\n\n📄 Fichier: ${filePath}\n📝 Collection: ${collectionName}\n📊 Champ ajouté: ${field.name} (${field.type})${field.required ? ' [requis]' : ''}\n\n📋 Contenu:\n\n${content}`
          }],
          structuredContent: {
            filePath,
            content,
            success: true,
            collectionName,
            fieldName: field.name
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour supprimer un champ d'une collection (génère une migration)
   */
  server.registerTool(
    'pocketbase-remove-field-migration',
    {
      title: 'Supprimer un Champ d\'une Collection',
      description: 'Génère une migration pour supprimer un seul champ d\'une collection existante',
      inputSchema: z.object({
        collectionName: z.string().describe('Nom de la collection'),
        fieldName: z.string().describe('Nom du champ à supprimer')
      }),
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
        collectionName: z.string(),
        fieldName: z.string()
      }
    },
    async ({ collectionName, fieldName }: { collectionName: string; fieldName: string }) => {
      try {
        // Vérifier que le nom du champ est spécifié
        if (!fieldName || fieldName.trim() === '') {
          throw new Error('Nom du champ non spécifié.');
        }

        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Créer le fichier de migration
        const filePath = createRemoveFieldMigrationFile(collectionName, fieldName, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        return {
          content: [{
            type: 'text',
            text: `✅ Migration de suppression de champ générée avec succès!\n\n📄 Fichier: ${filePath}\n📝 Collection: ${collectionName}\n🗑️ Champ supprimé: ${fieldName}\n\n📋 Contenu:\n\n${content}`
          }],
          structuredContent: {
            filePath,
            content,
            success: true,
            collectionName,
            fieldName
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Outil pour revenir en arrière sur une migration (génère une migration de revert)
   */
  server.registerTool(
    'pocketbase-revert-migration',
    {
      title: 'Revenir en Arrière sur une Migration',
      description: 'Génère une migration pour revenir en arrière sur une migration précédente',
      inputSchema: z.object({
        migrationFile: z.string().describe('Nom du fichier de migration à revenir en arrière')
      }),
      outputSchema: {
        filePath: z.string(),
        content: z.string(),
        success: z.boolean(),
        originalMigration: z.string(),
        revertDescription: z.string()
      }
    },
    async ({ migrationFile }: { migrationFile: string }) => {
      try {
        // Vérifier que le fichier de migration est spécifié
        if (!migrationFile || migrationFile.trim() === '') {
          throw new Error('Nom du fichier de migration non spécifié.');
        }

        // Déterminer le répertoire pb_migrations
        const migrationsDir = process.env.POCKETBASE_MIGRATIONS_DIR || './pb_migrations';

        // Créer le fichier de migration de revert
        const filePath = createRevertMigrationFile(migrationFile, migrationsDir);

        // Lire le contenu pour le retourner
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extraire la description du revert depuis le contenu
        const descriptionMatch = content.match(/Revert: (.*?)\n/);
        const revertDescription = descriptionMatch ? descriptionMatch[1] : 'Revenir en arrière sur la migration';

        return {
          content: [{
            type: 'text',
            text: `✅ Migration de revert générée avec succès!\n\n📄 Fichier: ${filePath}\n↩️ Revert de: ${migrationFile}\n📝 Description: ${revertDescription}\n\n📋 Contenu:\n\n${content}`
          }],
          structuredContent: {
            filePath,
            content,
            success: true,
            originalMigration: migrationFile,
            revertDescription
          }
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Erreur: ${(error as Error).message}`
          }],
          isError: true
        };
      }
    }
  );

  // Enregistrer les outils CRUD
  registerPocketbaseCrudTools(server);
}
