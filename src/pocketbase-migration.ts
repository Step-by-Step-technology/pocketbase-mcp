/**
 * Générateur de Migrations PocketBase pour MCP Server
 * Génère des fichiers de migration au format EXACT de PocketBase
 */

import * as fs from 'fs';
import * as path from 'path';

// Types pour les champs
type FieldType = 'text' | 'number' | 'email' | 'url' | 'bool' | 'date' | 'select' | 'json' | 'file' | 'relation' | 'autodate';

interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  min?: number;
  nonZero?: boolean; // Pour les champs number
  values?: string[]; // Pour les champs select
  collectionId?: string; // Pour les relations
  maxSelect?: number; // Pour les fichiers et relations
  cascadeDelete?: boolean; // Pour les relations
}

interface CollectionDefinition {
  name: string;
  fields: FieldDefinition[];
  type?: 'base' | 'auth';
  listRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
}

/**
 * Générer le code TypeScript pour un champ
 */
function generateFieldCode(field: FieldDefinition): string {
  const fieldTypes: { [key in FieldType]: string } = {
    text: 'TextField',
    number: 'NumberField',
    email: 'EmailField',
    url: 'URLField',
    bool: 'BoolField',
    date: 'DateField',
    select: 'SelectField',
    json: 'JSONField',
    file: 'FileField',
    relation: 'RelationField',
    autodate: 'AutodateField',
  };

  const className = fieldTypes[field.type];
  const fieldId = field.name.replace(/\s+/g, '_').toLowerCase();

  const props: Record<string, unknown> = {
    id: fieldId,
    name: field.name,
    required: field.required ?? false,
  };

  // Propriétés spécifiques au type
  switch (field.type) {
    case 'text':
      props.max = field.max ?? 0;
      break;
    case 'number':
      if (field.min !== undefined) props.min = field.min;
      if (field.max !== undefined && field.max !== 0) props.max = field.max;
      if (field.nonZero !== undefined) props.nonZero = field.nonZero;
      break;
    case 'select':
      props.values = field.values ?? [];
      break;
    case 'file':
      props.maxSelect = field.maxSelect ?? 1;
      props.maxSize = 5242880; // 5MB default
      break;
    case 'relation':
      props.collectionId = field.collectionId ?? '';
      props.maxSelect = field.maxSelect ?? 1;
      props.cascadeDelete = field.cascadeDelete ?? false;
      break;
  }

  // Générer la déclaration
  const propLines = Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `        ${key}: "${value}",`;
      } else if (Array.isArray(value)) {
        return `        ${key}: [${value.map(v => `"${v}"`).join(', ')}],`;
      } else if (value === null) {
        return `        ${key}: null,`;
      } else {
        return `        ${key}: ${value},`;
      }
    })
    .join('\n');

  return `      new ${className}({
${propLines}
      }),`;
}

/**
 * Générer le contenu complet d'un fichier de migration
 */
function generateMigrationContent(collection: CollectionDefinition): string {
  const timestamp = Date.now();
  const collectionNameSafe = collection.name.replace(/\s+/g, '_').toLowerCase();

  const fieldsCode = collection.fields
    .map(field => generateFieldCode(field))
    .join('\n');

  const listRule = collection.listRule === undefined ? 'null' : `"${collection.listRule}"`;
  const createRule = collection.createRule === undefined ? 'null' : `"${collection.createRule}"`;
  const updateRule = collection.updateRule === undefined ? 'null' : `"${collection.updateRule}"`;
  const deleteRule = collection.deleteRule === undefined ? 'null' : `"${collection.deleteRule}"`;

  return `/**
 * PocketBase Migration - Create ${collection.name} collection
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
  const collection = new Collection({
    id: "${collectionNameSafe}",
    name: "${collection.name}",
    type: "${collection.type || 'base'}",
    system: false,
    
    fields: [
${fieldsCode}
    ],
    
    listRule: ${listRule},
    createRule: ${createRule},
    updateRule: ${updateRule},
    deleteRule: ${deleteRule},
  });

  return $app.save(collection);
}, (db) => {
  return $app.delete($app.findCollectionByNameOrId("${collection.name}"));
});
`;
}

/**
 * Créer un fichier de migration
 */
function createMigrationFile(
  collection: CollectionDefinition,
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const collectionNameSafe = collection.name.replace(/\s+/g, '_').toLowerCase();
  const filename = `${timestamp}_create_${collectionNameSafe}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateMigrationContent(collection);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Parser les champs d'un fichier de migration
 */
function parseMigrationFields(content: string): FieldDefinition[] {
  const fields: FieldDefinition[] = [];

  // Chercher tous les champs dans le fichier
  const fieldRegex = /new (\w+)\({([^}]+)}\)/g;
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    const fieldType = match[1];
    const fieldContent = match[2];

    // Extraire les propriétés du champ
    const idMatch = fieldContent.match(/id:\s*"([^"]+)"/);
    const nameMatch = fieldContent.match(/name:\s*"([^"]+)"/);
    const requiredMatch = fieldContent.match(/required:\s*(true|false)/);
    const maxMatch = fieldContent.match(/max:\s*(\d+)/);
    const minMatch = fieldContent.match(/min:\s*(\d+)/);
    const valuesMatch = fieldContent.match(/values:\s*\[([^\]]+)\]/);

    if (nameMatch) {
      const fieldName = nameMatch[1];

      // Mapper le type de champ TypeScript au type interne
      const typeMap: { [key: string]: FieldType } = {
        'TextField': 'text',
        'NumberField': 'number',
        'EmailField': 'email',
        'URLField': 'url',
        'BoolField': 'bool',
        'DateField': 'date',
        'SelectField': 'select',
        'JSONField': 'json',
        'FileField': 'file',
        'RelationField': 'relation',
        'AutodateField': 'autodate'
      };

      const fieldTypeInternal = typeMap[fieldType] || 'text';

      const field: FieldDefinition = {
        name: fieldName,
        type: fieldTypeInternal,
        required: requiredMatch ? requiredMatch[1] === 'true' : false,
      };

      if (maxMatch && (fieldTypeInternal === 'text' || fieldTypeInternal === 'number')) {
        field.max = parseInt(maxMatch[1], 10);
      }

      if (minMatch && fieldTypeInternal === 'number') {
        field.min = parseInt(minMatch[1], 10);
      }

      if (valuesMatch && fieldTypeInternal === 'select') {
        const valuesStr = valuesMatch[1];
        field.values = valuesStr.split(',').map(v => v.trim().replace(/"/g, ''));
      }

      fields.push(field);
    }
  }

  return fields;
}

/**
 * Générer le contenu d'une migration de modification de collection
 */
function generateUpdateMigrationContent(
  collectionName: string,
  updates: {
    newName?: string;
    listRule?: string | null;
    createRule?: string | null;
    updateRule?: string | null;
    deleteRule?: string | null;
  }
): string {
  const timestamp = Date.now();
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();

  const updateLines: string[] = [];

  if (updates.newName !== undefined) {
    updateLines.push(`    collection.name = "${updates.newName}";`);
  }
  if (updates.listRule !== undefined) {
    updateLines.push(`    collection.listRule = ${updates.listRule === null ? 'null' : `"${updates.listRule}"`};`);
  }
  if (updates.createRule !== undefined) {
    updateLines.push(`    collection.createRule = ${updates.createRule === null ? 'null' : `"${updates.createRule}"`};`);
  }
  if (updates.updateRule !== undefined) {
    updateLines.push(`    collection.updateRule = ${updates.updateRule === null ? 'null' : `"${updates.updateRule}"`};`);
  }
  if (updates.deleteRule !== undefined) {
    updateLines.push(`    collection.deleteRule = ${updates.deleteRule === null ? 'null' : `"${updates.deleteRule}"`};`);
  }

  return `/**
 * PocketBase Migration - Update ${collectionName} collection
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }

${updateLines.join('\n')}

  return $app.save(collection);
}, (db) => {
  // Rollback - restore original values
  const collection = $app.findCollectionByNameOrId("${updates.newName || collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${updates.newName || collectionName} not found");
  }
  
  // Note: Rollback would need original values stored somewhere
  // For now, we just delete the collection if it was renamed
  if ("${updates.newName}" && "${updates.newName}" !== "${collectionName}") {
    collection.name = "${collectionName}";
  }
  
  return $app.save(collection);
});
`;
}

/**
 * Générer le contenu d'une migration de suppression de collection
 */
function generateDeleteMigrationContent(collectionName: string): string {
  const timestamp = Date.now();
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();

  return `/**
 * PocketBase Migration - Delete ${collectionName} collection
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }

  return $app.delete(collection);
}, (db) => {
  // Rollback - recreate the collection
  // Note: This would need the original collection definition
  // For now, we just create a basic collection
  const collection = new Collection({
    id: "${collectionNameSafe}",
    name: "${collectionName}",
    type: "base",
    system: false,
    
    fields: [
      new TextField({
        id: "name",
        name: "name",
        required: true,
        max: 100,
      }),
    ],
    
    listRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  return $app.save(collection);
});
`;
}

/**
 * Générer le contenu d'une migration de modification de champs
 */
function generateUpdateFieldsMigrationContent(
  collectionName: string,
  fields: FieldDefinition[]
): string {
  const timestamp = Date.now();
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();

  const fieldsCode = fields
    .map(field => generateFieldCode(field))
    .join('\n');

  return `/**
 * PocketBase Migration - Update fields of ${collectionName} collection
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }

  // Replace all fields with new definition
  collection.fields = [
${fieldsCode}
  ];

  return $app.save(collection);
}, (db) => {
  // Rollback - restore original fields
  // Note: This would need the original fields definition stored
  // For now, we just keep the current fields
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }
  
  return $app.save(collection);
});
`;
}

/**
 * Générer le contenu d'une migration pour ajouter un seul champ
 */
function generateAddFieldMigrationContent(
  collectionName: string,
  field: FieldDefinition
): string {
  const timestamp = Date.now();
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();

  const fieldCode = generateFieldCode(field);

  return `/**
 * PocketBase Migration - Add field to ${collectionName} collection
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }

  // Add new field to existing fields
  collection.fields.push(
${fieldCode}
  );

  return $app.save(collection);
}, (db) => {
  // Rollback - remove the added field
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }
  
  // Remove the field by name
  collection.fields = collection.fields.filter(f => f.name !== "${field.name}");
  
  return $app.save(collection);
});
`;
}

/**
 * Générer le contenu d'une migration pour supprimer un champ
 */
function generateRemoveFieldMigrationContent(
  collectionName: string,
  fieldName: string
): string {
  const timestamp = Date.now();
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();

  return `/**
 * PocketBase Migration - Remove field from ${collectionName} collection
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }

  // Remove the field by name
  collection.fields = collection.fields.filter(f => f.name !== "${fieldName}");
  
  return $app.save(collection);
}, (db) => {
  // Rollback - would need to restore the original field definition
  // Note: This requires storing the original field definition
  // For now, we just note that rollback is not fully supported
  const collection = $app.findCollectionByNameOrId("${collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${collectionName} not found");
  }
  
  throw new Error("Rollback not fully supported for field removal - original field definition not stored");
});
`;
}

/**
 * Analyser une migration pour déterminer comment la revenir en arrière
 */
function analyzeMigrationForRevert(content: string): {
  type: 'create' | 'update' | 'delete' | 'add_field' | 'remove_field' | 'update_fields';
  collectionName: string;
  details?: any;
} {
  // Chercher le nom de la collection
  let collectionName = 'unknown';
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
  if (!nameMatch) {
    nameMatch = content.match(/Add field to ([a-zA-Z_]+) collection/);
  }
  if (!nameMatch) {
    nameMatch = content.match(/Remove field from ([a-zA-Z_]+) collection/);
  }
  if (nameMatch) {
    collectionName = nameMatch[1];
  }

  // Déterminer le type de migration
  if (content.includes('new Collection({')) {
    return { type: 'create', collectionName };
  } else if (content.includes('$app.delete(collection)')) {
    return { type: 'delete', collectionName };
  } else if (content.includes('collection.fields.push(')) {
    // Extraire les détails du champ ajouté
    const fieldMatch = content.match(/name:\s*"([^"]+)"/);
    const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
    return { type: 'add_field', collectionName, details: { fieldName } };
  } else if (content.includes('.filter(f => f.name !==')) {
    // Extraire le nom du champ supprimé
    const fieldMatch = content.match(/f\.name !== "([^"]+)"/);
    const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
    return { type: 'remove_field', collectionName, details: { fieldName } };
  } else if (content.includes('collection.fields = [')) {
    return { type: 'update_fields', collectionName };
  } else if (content.includes('collection.name =') || content.includes('collection.listRule =')) {
    return { type: 'update', collectionName };
  }

  return { type: 'update', collectionName };
}

/**
 * Générer le contenu pour revenir en arrière sur une migration
 */
function generateRevertMigrationContent(
  originalContent: string,
  originalFilename: string
): string {
  const analysis = analyzeMigrationForRevert(originalContent);
  const timestamp = Date.now();

  let revertAction = '';
  let revertDescription = '';

  switch (analysis.type) {
    case 'create':
      revertAction = `  return $app.delete($app.findCollectionByNameOrId("${analysis.collectionName}"));`;
      revertDescription = `Revert creation of ${analysis.collectionName} collection`;
      break;

    case 'delete':
      // Pour la suppression, on ne peut pas recréer exactement la collection
      // car on n'a pas la définition complète
      revertAction = `  // Cannot fully recreate deleted collection without original definition
  // Creating basic collection as fallback
  const collection = new Collection({
    id: "${analysis.collectionName.replace(/\s+/g, '_').toLowerCase()}",
    name: "${analysis.collectionName}",
    type: "base",
    system: false,
    
    fields: [
      new TextField({
        id: "name",
        name: "name",
        required: true,
        max: 100,
      }),
    ],
    
    listRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  });

  return $app.save(collection);`;
      revertDescription = `Attempt to recreate ${analysis.collectionName} collection (basic structure)`;
      break;

    case 'add_field':
      revertAction = `  const collection = $app.findCollectionByNameOrId("${analysis.collectionName}");
  
  if (!collection) {
    throw new Error("Collection ${analysis.collectionName} not found");
  }
  
  // Remove the added field
  collection.fields = collection.fields.filter(f => f.name !== "${analysis.details?.fieldName || 'unknown'}");
  
  return $app.save(collection);`;
      revertDescription = `Remove field ${analysis.details?.fieldName || 'unknown'} from ${analysis.collectionName} collection`;
      break;

    case 'remove_field':
      revertAction = `  // Cannot restore removed field without original definition
  throw new Error("Cannot restore removed field ${analysis.details?.fieldName || 'unknown'} - original definition not stored");`;
      revertDescription = `Cannot revert field removal - original definition not stored`;
      break;

    case 'update_fields':
      revertAction = `  // Cannot revert field updates without original field definitions
  throw new Error("Cannot revert field updates - original field definitions not stored");`;
      revertDescription = `Cannot revert field updates - original definitions not stored`;
      break;

    case 'update':
      revertAction = `  // Cannot revert collection updates without original values
  throw new Error("Cannot revert collection updates - original values not stored");`;
      revertDescription = `Cannot revert collection updates - original values not stored`;
      break;

    default:
      revertAction = `  throw new Error("Cannot revert unknown migration type");`;
      revertDescription = `Cannot revert unknown migration type`;
  }

  return `/**
 * PocketBase Migration - Revert: ${originalFilename}
 * ${revertDescription}
 * Generated: ${new Date().toISOString()}
 */

migrate((db) => {
${revertAction}
}, (db) => {
  // Rollback of revert would re-apply original migration
  // This is complex and not implemented
  throw new Error("Rollback of revert migration not supported");
});
`;
}

/**
 * Créer un fichier de migration de modification
 */
function createUpdateMigrationFile(
  collectionName: string,
  updates: {
    newName?: string;
    listRule?: string | null;
    createRule?: string | null;
    updateRule?: string | null;
    deleteRule?: string | null;
  },
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();
  const action = updates.newName ? 'rename' : 'update';
  const filename = `${timestamp}_${action}_${collectionNameSafe}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateUpdateMigrationContent(collectionName, updates);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Créer un fichier de migration de suppression
 */
function createDeleteMigrationFile(
  collectionName: string,
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();
  const filename = `${timestamp}_delete_${collectionNameSafe}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateDeleteMigrationContent(collectionName);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Créer un fichier de migration de modification de champs
 */
function createUpdateFieldsMigrationFile(
  collectionName: string,
  fields: FieldDefinition[],
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();
  const filename = `${timestamp}_update_fields_${collectionNameSafe}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateUpdateFieldsMigrationContent(collectionName, fields);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Créer un fichier de migration pour ajouter un champ
 */
function createAddFieldMigrationFile(
  collectionName: string,
  field: FieldDefinition,
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();
  const fieldNameSafe = field.name.replace(/\s+/g, '_').toLowerCase();
  const filename = `${timestamp}_add_field_${fieldNameSafe}_to_${collectionNameSafe}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateAddFieldMigrationContent(collectionName, field);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Créer un fichier de migration pour supprimer un champ
 */
function createRemoveFieldMigrationFile(
  collectionName: string,
  fieldName: string,
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const collectionNameSafe = collectionName.replace(/\s+/g, '_').toLowerCase();
  const fieldNameSafe = fieldName.replace(/\s+/g, '_').toLowerCase();
  const filename = `${timestamp}_remove_field_${fieldNameSafe}_from_${collectionNameSafe}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateRemoveFieldMigrationContent(collectionName, fieldName);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Créer un fichier de migration pour revenir en arrière
 */
function createRevertMigrationFile(
  originalMigrationFile: string,
  outputDir: string = './pb_migrations'
): string {
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Lire le fichier de migration original
  const originalPath = path.join(outputDir, originalMigrationFile);
  if (!fs.existsSync(originalPath)) {
    throw new Error(`Fichier de migration original non trouvé: ${originalMigrationFile}`);
  }

  const originalContent = fs.readFileSync(originalPath, 'utf-8');

  // Générer le nom du fichier avec timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const originalName = path.basename(originalMigrationFile, '.js');
  const filename = `${timestamp}_revert_${originalName}.js`;
  const filepath = path.join(outputDir, filename);

  // Générer le contenu
  const content = generateRevertMigrationContent(originalContent, originalMigrationFile);

  // Écrire le fichier
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

/**
 * Exemple d'utilisation
 */
function exampleUsage() {
  const testCollection: CollectionDefinition = {
    name: 'test_final_format',
    type: 'base',
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        max: 100,
      },
      {
        name: 'description',
        type: 'text',
        required: false,
        max: 500,
      },
      {
        name: 'count',
        type: 'number',
        required: false,
        min: 0,
      },
    ],
    listRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  };

  const filepath = createMigrationFile(testCollection);
  console.log(`✅ Migration créée: ${filepath}`);

  // Afficher le contenu généré
  console.log('\n📄 Contenu:');
  console.log(generateMigrationContent(testCollection));
}

// Export pour utilisation dans le MCP Server
export {
  generateMigrationContent,
  createMigrationFile,
  parseMigrationFields,
  CollectionDefinition,
  FieldDefinition,
  generateUpdateMigrationContent,
  generateDeleteMigrationContent,
  generateUpdateFieldsMigrationContent,
  generateAddFieldMigrationContent,
  generateRemoveFieldMigrationContent,
  generateRevertMigrationContent,
  analyzeMigrationForRevert,
  createUpdateMigrationFile,
  createDeleteMigrationFile,
  createUpdateFieldsMigrationFile,
  createAddFieldMigrationFile,
  createRemoveFieldMigrationFile,
  createRevertMigrationFile
};

// Exemple pour produits avec relations
const productsCollection: CollectionDefinition = {
  name: 'products',
  type: 'base',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      max: 200,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      max: 200,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      values: ['draft', 'published', 'archived'],
    },
    {
      name: 'description',
      type: 'text',
      required: false,
      max: 5000,
    },
    {
      name: 'image',
      type: 'file',
      required: false,
      maxSelect: 1,
    },
  ],
};

// Exemple pour authentification
const usersCollection: CollectionDefinition = {
  name: 'users',
  type: 'auth',
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      max: 100,
    },
    {
      name: 'firstName',
      type: 'text',
      required: false,
      max: 100,
    },
    {
      name: 'lastName',
      type: 'text',
      required: false,
      max: 100,
    },
    {
      name: 'avatar',
      type: 'file',
      required: false,
      maxSelect: 1,
    },
  ],
};

// Pour tester:
// exampleUsage();
